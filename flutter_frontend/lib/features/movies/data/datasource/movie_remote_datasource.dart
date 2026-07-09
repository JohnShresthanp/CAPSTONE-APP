import 'package:flutter_frontend/core/network/api_constants.dart';
import 'package:flutter_frontend/core/network/dio_client.dart';

class MovieRemoteDataSource {
  final DioClient _dioClient = DioClient();

  Future<Map<String, dynamic>> getMovieDetail(String movieId) async {
    final response = await _dioClient.get('${ApiConstants.movieDetail}$movieId');
    return (response.data['data'] ?? response.data) as Map<String, dynamic>;
  }

  Future<List<dynamic>> getSimilarMovies(String movieId) async {
    final response = await _dioClient.get('${ApiConstants.movieDetail}$movieId/similar');
    return (response.data['data'] ?? []) as List<dynamic>;
  }

  Future<List<dynamic>> getRecommendedMovies() async {
    try {
      final response = await _dioClient.get('/movies/recommended');
      final data = response.data['data'];
      if (data is Map) {
        return (data['movies'] ?? []) as List<dynamic>;
      }
      if (data is List) return data;
      return [];
    } catch (_) {
      return [];
    }
  }

  Future<List<dynamic>> getMovieCredits(String movieId) async {
    final response = await _dioClient.get('${ApiConstants.movieDetail}$movieId');
    final movieData = response.data['data'] ?? response.data;
    return (movieData['cast'] as List<dynamic>?) ?? [];
  }

  Future<Map<String, dynamic>> getPersonDetail(String personId) async {
    final response = await _dioClient.get('${ApiConstants.personDetail}$personId');
    return (response.data['data'] ?? response.data) as Map<String, dynamic>;
  }

  Future<List<dynamic>> getPersonMovieCredits(String personId) async {
    final person = await getPersonDetail(personId);
    final movieCast = person['movieCast'] as List<dynamic>? ?? [];
    return movieCast.map((c) => c['movie'] ?? c).whereType<Map<String, dynamic>>().toList();
  }
}
