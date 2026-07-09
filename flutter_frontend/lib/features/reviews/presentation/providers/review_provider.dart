import 'package:flutter/foundation.dart';
import 'package:flutter_frontend/core/utils/error_handler.dart';
import 'package:flutter_frontend/features/reviews/data/repository/review_repository_impl.dart';
import 'package:flutter_frontend/shared/models/review_model.dart';
import 'package:flutter_frontend/shared/models/comment_model.dart';

class ReviewProvider extends ChangeNotifier {
  final ReviewRepositoryImpl _repository = ReviewRepositoryImpl();

  List<ReviewModel> _reviews = [];
  bool _isLoading = false;
  String? _error;

  List<ReviewModel> get reviews => _reviews;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadMovieReviews(String movieId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _reviews = await _repository.getMovieReviews(movieId);
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = extractErrorMessage(e);
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadUserReviews(String username) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _reviews = await _repository.getUserReviews(username);
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = extractErrorMessage(e);
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> createReview(String movieId, double rating, String content, {bool containsSpoiler = false}) async {
    try {
      await _repository.createReview(movieId, rating, content, containsSpoiler: containsSpoiler);
      await loadMovieReviews(movieId);
      return true;
    } catch (e) {
      _error = extractErrorMessage(e);
      notifyListeners();
      return false;
    }
  }

  Future<void> toggleLike(String reviewId) async {
    try {
      final isNowLiked = await _repository.likeReview(reviewId);
      final index = _reviews.indexWhere((r) => r.id == reviewId);
      if (index != -1) {
        final review = _reviews[index];
        _reviews[index] = ReviewModel(
          id: review.id,
          movieId: review.movieId,
          userId: review.userId,
          username: review.username,
          userAvatar: review.userAvatar,
          movieTitle: review.movieTitle,
          moviePoster: review.moviePoster,
          rating: review.rating,
          content: review.content,
          likeCount: isNowLiked ? review.likeCount + 1 : review.likeCount - 1,
          commentCount: review.commentCount,
          isLiked: isNowLiked,
          createdAt: review.createdAt,
          updatedAt: review.updatedAt,
        );
        notifyListeners();
      }
    } catch (e) {
      _error = extractErrorMessage(e);
      notifyListeners();
    }
  }

  Future<List<CommentModel>> getComments(String reviewId) async {
    try {
      return await _repository.getComments(reviewId);
    } catch (e) {
      _error = extractErrorMessage(e);
      notifyListeners();
      return [];
    }
  }

  Future<bool> postComment(String reviewId, String body, {String? parentCommentId}) async {
    try {
      await _repository.postComment(reviewId, body, parentCommentId: parentCommentId);
      return true;
    } catch (e) {
      _error = extractErrorMessage(e);
      notifyListeners();
      return false;
    }
  }

  Future<bool> deleteComment(String reviewId, String commentId) async {
    try {
      await _repository.deleteComment(reviewId, commentId);
      return true;
    } catch (e) {
      _error = extractErrorMessage(e);
      notifyListeners();
      return false;
    }
  }
}
