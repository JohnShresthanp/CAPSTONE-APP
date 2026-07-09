import 'package:flutter_frontend/features/auth/domain/entities/user.dart';

class AuthResponse {
  final String token;
  final String refreshToken;
  final AuthUser user;

  const AuthResponse({
    required this.token,
    required this.refreshToken,
    required this.user,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    final userData = json['user'] as Map<String, dynamic>;
    return AuthResponse(
      token: json['token'] as String,
      refreshToken: json['refreshToken'] as String? ?? '',
      user: AuthUser(
        id: userData['id'] as int,
        username: userData['username'] as String,
        email: userData['email'] as String,
        displayName: userData['displayName'] as String?,
        avatarUrl: userData['avatarUrl'] as String?,
        bio: userData['bio'] as String?,
        role: userData['role'] as String? ?? 'user',
        isVerified: userData['isEmailVerified'] as bool? ?? false,
        token: json['token'] as String?,
        refreshToken: json['refreshToken'] as String?,
      ),
    );
  }
}
