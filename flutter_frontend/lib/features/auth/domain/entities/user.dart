class AuthUser {
  final int id;
  final String username;
  final String email;
  final String? displayName;
  final String? avatarUrl;
  final String? bio;
  final String role;
  final bool isVerified;
  final String? token;
  final String? refreshToken;

  const AuthUser({
    required this.id,
    required this.username,
    required this.email,
    this.displayName,
    this.avatarUrl,
    this.bio,
    this.role = 'user',
    this.isVerified = false,
    this.token,
    this.refreshToken,
  });

  bool get isAdmin => role == 'super_admin';
  bool get isModerator => role == 'moderator' || role == 'super_admin';

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'email': email,
      'display_name': displayName,
      'avatar_url': avatarUrl,
      'bio': bio,
      'role': role,
      'is_verified': isVerified,
    };
  }
}
