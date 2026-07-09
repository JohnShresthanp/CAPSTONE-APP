import 'package:flutter_frontend/core/network/api_constants.dart';
import 'package:flutter_frontend/core/network/dio_client.dart';

class ReviewRemoteDataSource {
  final DioClient _dioClient = DioClient();

  Future<List<dynamic>> getMovieReviews(String movieId, {int page = 1}) async {
    final response = await _dioClient.get(
      '${ApiConstants.movieReviews}$movieId/reviews',
      queryParameters: {'page': page},
    );
    final data = response.data['data'];
    if (data is Map) {
      return (data['data'] ?? []) as List<dynamic>;
    }
    if (data is List) return data;
    return [];
  }

  Future<List<dynamic>> getUserReviews(String username, {int page = 1}) async {
    final response = await _dioClient.get(
      '${ApiConstants.userReviews}$username/reviews',
      queryParameters: {'page': page},
    );
    final data = response.data['data'];
    if (data is Map) {
      return (data['data'] ?? []) as List<dynamic>;
    }
    if (data is List) return data;
    return [];
  }

  Future<Map<String, dynamic>> createReview(String movieId, double rating, String body, {bool containsSpoiler = false}) async {
    final response = await _dioClient.post(
      ApiConstants.reviews,
      data: {'movieId': movieId, 'rating': rating, 'body': body, 'containsSpoiler': containsSpoiler},
    );
    final data = response.data['data'];
    return (data is Map ? data : response.data) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> updateReview(String reviewId, double rating, String content) async {
    final response = await _dioClient.put(
      '${ApiConstants.reviews}/$reviewId',
      data: {'rating': rating, 'body': content},
    );
    final data = response.data['data'];
    return (data is Map ? data : response.data) as Map<String, dynamic>;
  }

  Future<void> deleteReview(String reviewId) async {
    await _dioClient.delete('${ApiConstants.reviews}/$reviewId');
  }

  Future<bool> likeReview(String reviewId) async {
    final response = await _dioClient.post('${ApiConstants.reviews}/$reviewId/like');
    final data = response.data['data'];
    if (data is Map) return data['liked'] as bool? ?? false;
    return false;
  }

  Future<List<dynamic>> getComments(String reviewId, {int page = 1}) async {
    final response = await _dioClient.get(
      '${ApiConstants.reviewComments}$reviewId/comments',
      queryParameters: {'page': page},
    );
    final data = response.data['data'];
    if (data is Map) {
      return (data['data'] ?? []) as List<dynamic>;
    }
    if (data is List) return data;
    return [];
  }

  Future<Map<String, dynamic>> postComment(String reviewId, String body, {String? parentCommentId}) async {
    final response = await _dioClient.post(
      '${ApiConstants.reviewComments}$reviewId/comments',
      data: {
        'body': body,
        if (parentCommentId != null) 'parentCommentId': parentCommentId,
      },
    );
    final data = response.data['data'];
    return (data is Map ? data : response.data) as Map<String, dynamic>;
  }

  Future<void> deleteComment(String reviewId, String commentId) async {
    await _dioClient.delete('${ApiConstants.reviewComments}$reviewId/comments/$commentId');
  }
}
