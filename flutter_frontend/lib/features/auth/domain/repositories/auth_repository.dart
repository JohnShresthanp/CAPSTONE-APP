import 'package:flutter_frontend/features/auth/domain/entities/user.dart';

abstract class AuthRepository {
  Future<AuthUser> login(String email, String password);
  Future<AuthUser> register(String username, String email, String password);
  Future<void> logout();
  Future<AuthUser?> getCurrentUser();
  Future<bool> isLoggedIn();
  Future<String?> getToken();
}
