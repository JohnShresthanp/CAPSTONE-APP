import 'package:flutter_frontend/features/reviews/data/datasource/review_remote_datasource.dart';
import 'package:flutter_frontend/features/reviews/domain/repositories/review_repository.dart';
import 'package:flutter_frontend/shared/models/review_model.dart';
import 'package:flutter_frontend/shared/models/comment_model.dart';

class ReviewRepositoryImpl implements ReviewRepository {
  final ReviewRemoteDataSource _remoteDataSource = ReviewRemoteDataSource();

  @override
  Future<List<ReviewModel>> getMovieReviews(String movieId, {int page = 1}) async {
    final data = await _remoteDataSource.getMovieReviews(movieId, page: page);
    return data.map((e) => ReviewModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  @override
  Future<List<ReviewModel>> getUserReviews(String username, {int page = 1}) async {
    final data = await _remoteDataSource.getUserReviews(username, page: page);
    return data.map((e) => ReviewModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  @override
  Future<ReviewModel> createReview(String movieId, double rating, String content, {bool containsSpoiler = false}) async {
    final data = await _remoteDataSource.createReview(movieId, rating, content, containsSpoiler: containsSpoiler);
    return ReviewModel.fromJson(data);
  }

  @override
  Future<ReviewModel> updateReview(String reviewId, double rating, String content) async {
    final data = await _remoteDataSource.updateReview(reviewId, rating, content);
    return ReviewModel.fromJson(data);
  }

  @override
  Future<void> deleteReview(String reviewId) async {
    await _remoteDataSource.deleteReview(reviewId);
  }

  @override
  Future<bool> likeReview(String reviewId) async {
    return await _remoteDataSource.likeReview(reviewId);
  }

  @override
  Future<List<CommentModel>> getComments(String reviewId, {int page = 1}) async {
    final data = await _remoteDataSource.getComments(reviewId, page: page);
    return data.map((e) => CommentModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  @override
  Future<CommentModel> postComment(String reviewId, String body, {String? parentCommentId}) async {
    final data = await _remoteDataSource.postComment(reviewId, body, parentCommentId: parentCommentId);
    return CommentModel.fromJson(data);
  }

  @override
  Future<void> deleteComment(String reviewId, String commentId) async {
    await _remoteDataSource.deleteComment(reviewId, commentId);
  }
}
