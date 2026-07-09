import 'package:flutter_frontend/core/network/api_constants.dart';
import 'package:flutter_frontend/core/network/dio_client.dart';

class AdminRemoteDataSource {
  final DioClient _dioClient = DioClient();

  Future<Map<String, dynamic>> getDashboard() async {
    final response = await _dioClient.get(ApiConstants.adminDashboard);
    final data = response.data['data'];
    return (data is Map ? data : response.data) as Map<String, dynamic>;
  }

  Future<List<dynamic>> getUsers({int page = 1}) async {
    final response = await _dioClient.get(
      ApiConstants.adminUsers,
      queryParameters: {'page': page},
    );
    final data = response.data['data'];
    if (data is Map) {
      return (data['data'] ?? []) as List<dynamic>;
    }
    if (data is List) return data;
    return [];
  }

  Future<List<dynamic>> getMovies({int page = 1}) async {
    final response = await _dioClient.get(
      ApiConstants.adminMovies,
      queryParameters: {'page': page},
    );
    final data = response.data['data'];
    if (data is Map) {
      return (data['data'] ?? []) as List<dynamic>;
    }
    if (data is List) return data;
    return [];
  }

  Future<List<dynamic>> getFlaggedReviews() async {
    final response = await _dioClient.get(ApiConstants.adminFlaggedReviews);
    final data = response.data['data'];
    if (data is List) return data;
    return [];
  }

  Future<void> banUser(String userId) async {
    await _dioClient.delete('${ApiConstants.adminUsers}/$userId');
  }
}
