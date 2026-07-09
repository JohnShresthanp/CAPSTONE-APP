import 'package:flutter_frontend/core/network/api_constants.dart';
import 'package:flutter_frontend/core/network/dio_client.dart';

class AuthRemoteDataSource {
  final DioClient _dioClient = DioClient();

  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await _dioClient.post(
      ApiConstants.login,
      data: {'email': email, 'password': password},
    );
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> register(String username, String email, String password) async {
    final response = await _dioClient.post(
      ApiConstants.register,
      data: {
        'username': username,
        'email': email,
        'password': password,
        'confirmPassword': password,
      },
    );
    return response.data as Map<String, dynamic>;
  }

  Future<void> logout() async {
    try {
      await _dioClient.post(ApiConstants.logout);
    } catch (_) {}
  }

  Future<Map<String, dynamic>> refreshToken(String refreshToken) async {
    final response = await _dioClient.post(
      ApiConstants.refreshToken,
      data: {'refreshToken': refreshToken},
    );
    return response.data as Map<String, dynamic>;
  }
}
