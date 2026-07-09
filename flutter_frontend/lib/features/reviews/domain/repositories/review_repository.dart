import 'package:flutter_frontend/shared/models/review_model.dart';
import 'package:flutter_frontend/shared/models/comment_model.dart';

abstract class ReviewRepository {
  Future<List<ReviewModel>> getMovieReviews(String movieId, {int page = 1});
  Future<List<ReviewModel>> getUserReviews(String username, {int page = 1});
  Future<ReviewModel> createReview(String movieId, double rating, String content, {bool containsSpoiler = false});
  Future<ReviewModel> updateReview(String reviewId, double rating, String content);
  Future<void> deleteReview(String reviewId);
  Future<bool> likeReview(String reviewId);
  Future<List<CommentModel>> getComments(String reviewId, {int page = 1});
  Future<CommentModel> postComment(String reviewId, String body, {String? parentCommentId});
  Future<void> deleteComment(String reviewId, String commentId);
}
