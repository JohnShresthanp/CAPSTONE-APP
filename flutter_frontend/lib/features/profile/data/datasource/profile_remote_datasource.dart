import 'package:flutter_frontend/core/network/api_constants.dart';
import 'package:flutter_frontend/core/network/dio_client.dart';
import 'package:flutter_frontend/core/storage/secure_storage.dart';
import 'dart:convert';

class ProfileRemoteDataSource {
  final DioClient _dioClient = DioClient();
  final SecureStorage _secureStorage = SecureStorage();

  Future<Map<String, dynamic>> getProfile(String? username) async {
    if (username != null) {
      final response = await _dioClient.get('${ApiConstants.userProfile}$username');
      return (response.data['data'] ?? response.data) as Map<String, dynamic>;
    }
    final userData = await _secureStorage.getUserData();
    if (userData != null) {
      final data = Map<String, dynamic>.from(jsonDecode(userData) as Map);
      final ownUsername = data['username'] as String?;
      if (ownUsername != null) {
        final response = await _dioClient.get('${ApiConstants.userProfile}$ownUsername');
        return (response.data['data'] ?? response.data) as Map<String, dynamic>;
      }
    }
    final response = await _dioClient.get(ApiConstants.profileMe);
    return (response.data['user'] ?? response.data['data'] ?? response.data) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> data) async {
    final response = await _dioClient.put(ApiConstants.updateProfile, data: data);
    final resData = response.data['data'];
    return (resData is Map ? resData : response.data) as Map<String, dynamic>;
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

  Future<void> followUser(String username) async {
    await _dioClient.post('${ApiConstants.followUser}$username/follow');
  }

  Future<void> unfollowUser(String username) async {
    await _dioClient.post('${ApiConstants.followUser}$username/follow');
  }
}
