import 'dart:convert';
import 'package:flutter_frontend/core/storage/secure_storage.dart';
import 'package:flutter_frontend/features/auth/data/datasource/auth_remote_datasource.dart';
import 'package:flutter_frontend/features/auth/data/models/auth_response.dart';
import 'package:flutter_frontend/features/auth/domain/entities/user.dart';
import 'package:flutter_frontend/features/auth/domain/repositories/auth_repository.dart';

class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource _remoteDataSource = AuthRemoteDataSource();
  final SecureStorage _secureStorage = SecureStorage();

  @override
  Future<AuthUser> login(String email, String password) async {
    final response = await _remoteDataSource.login(email, password);
    final authResponse = AuthResponse.fromJson(response);
    await _secureStorage.saveToken(authResponse.token);
    await _secureStorage.saveRefreshToken(authResponse.refreshToken);
    await _secureStorage.saveUserData(jsonEncode(authResponse.user));
    return authResponse.user;
  }

  @override
  Future<AuthUser> register(String username, String email, String password) async {
    final response = await _remoteDataSource.register(username, email, password);
    final authResponse = AuthResponse.fromJson(response);
    await _secureStorage.saveToken(authResponse.token);
    await _secureStorage.saveRefreshToken(authResponse.refreshToken);
    await _secureStorage.saveUserData(jsonEncode(authResponse.user));
    return authResponse.user;
  }

  @override
  Future<void> logout() async {
    await _remoteDataSource.logout();
    await _secureStorage.clearAll();
  }

  @override
  Future<AuthUser?> getCurrentUser() async {
    final userData = await _secureStorage.getUserData();
    final token = await _secureStorage.getToken();
    if (userData == null || token == null) return null;
    try {
      final userJson = await _secureStorage.getUserData();
      if (userJson == null) return null;
      final data = Map<String, dynamic>.from(jsonDecode(userJson) as Map);
      return AuthUser(
        id: data['id'] as int,
        username: data['username'] as String,
        email: data['email'] as String,
        displayName: data['display_name'] as String?,
        avatarUrl: data['avatar_url'] as String?,
        bio: data['bio'] as String?,
        role: data['role'] as String? ?? 'user',
        isVerified: data['is_verified'] as bool? ?? false,
        token: token,
      );
    } catch (_) {
      return null;
    }
  }

  @override
  Future<bool> isLoggedIn() async {
    final token = await _secureStorage.getToken();
    return token != null;
  }

  @override
  Future<String?> getToken() async {
    return await _secureStorage.getToken();
  }
}
