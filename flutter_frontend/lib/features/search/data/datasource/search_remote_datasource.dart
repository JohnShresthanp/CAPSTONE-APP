import 'package:flutter_frontend/core/network/api_constants.dart';
import 'package:flutter_frontend/core/network/dio_client.dart';

class SearchRemoteDataSource {
  final DioClient _dioClient = DioClient();

  Future<List<dynamic>> searchMovies(String query, {int page = 1}) async {
    final response = await _dioClient.get(
      ApiConstants.search,
      queryParameters: {'q': query, 'page': page},
    );
    final data = response.data['data'];
    if (data is Map) {
      return (data['movies'] ?? []) as List<dynamic>;
    }
    if (data is List) return data;
    return [];
  }
}
