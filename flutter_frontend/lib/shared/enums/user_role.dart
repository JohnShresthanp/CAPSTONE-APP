enum UserRole {
  user,
  moderator,
  admin;

  String get value {
    return name;
  }

  static UserRole fromString(String role) {
    return UserRole.values.firstWhere(
      (e) => e.name == role,
      orElse: () => UserRole.user,
    );
  }

  bool get isAdmin => this == UserRole.admin;
  bool get isModerator => this == UserRole.moderator || this == UserRole.admin;
}
