class UserModel {
  final int id;
  final String username;
  final String email;
  final String? displayName;
  final String? avatarUrl;
  final String? bio;
  final String role;
  final bool isVerified;
  final bool isFollowing;
  final int followerCount;
  final int followingCount;
  final int reviewCount;
  final int listCount;
  final List<LikedMovie> likedMovies;
  final DateTime? createdAt;

  const UserModel({
    required this.id,
    required this.username,
    required this.email,
    this.displayName,
    this.avatarUrl,
    this.bio,
    this.role = 'user',
    this.isVerified = false,
    this.isFollowing = false,
    this.followerCount = 0,
    this.followingCount = 0,
    this.reviewCount = 0,
    this.listCount = 0,
    this.likedMovies = const [],
    this.createdAt,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    final cnt = json['_count'] as Map<String, dynamic>?;
    final counts = json['counts'] as Map<String, dynamic>?;
    final rawLiked = json['likedMovies'] as List<dynamic>?;
    final likedMovies = rawLiked?.map((e) => LikedMovie.fromJson(e as Map<String, dynamic>)).toList() ?? [];
    return UserModel(
      id: json['id'] as int,
      username: json['username'] as String,
      email: json['email'] as String? ?? '',
      displayName: json['displayName'] as String? ?? json['display_name'] as String?,
      avatarUrl: json['avatarUrl'] as String? ?? json['avatar_url'] as String?,
      bio: json['bio'] as String?,
      role: json['role'] as String? ?? 'user',
      isVerified: json['isVerified'] as bool? ?? json['is_verified'] as bool? ?? false,
      isFollowing: json['isFollowing'] as bool? ?? json['is_following'] as bool? ?? false,
      followerCount: json['followerCount'] as int? ?? json['follower_count'] as int? ?? counts?['followers'] as int? ?? cnt?['followers'] as int? ?? 0,
      followingCount: json['followingCount'] as int? ?? json['following_count'] as int? ?? counts?['following'] as int? ?? cnt?['following'] as int? ?? 0,
      reviewCount: json['reviewCount'] as int? ?? json['review_count'] as int? ?? counts?['reviews'] as int? ?? cnt?['reviews'] as int? ?? 0,
      listCount: json['listCount'] as int? ?? json['list_count'] as int? ?? counts?['lists'] as int? ?? cnt?['lists'] as int? ?? 0,
      likedMovies: likedMovies,
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt'] as String) : (json['created_at'] != null ? DateTime.parse(json['created_at'] as String) : null),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'email': email,
      'display_name': displayName,
      'avatar_url': avatarUrl,
      'bio': bio,
      'role': role,
      'is_following': isFollowing,
      'is_verified': isVerified,
      'follower_count': followerCount,
      'following_count': followingCount,
      'review_count': reviewCount,
      'list_count': listCount,
      'created_at': createdAt?.toIso8601String(),
    };
  }
}

class LikedMovie {
  final String id;
  final String title;
  final String? posterUrl;

  const LikedMovie({required this.id, required this.title, this.posterUrl});

  factory LikedMovie.fromJson(Map<String, dynamic> json) {
    return LikedMovie(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      posterUrl: json['posterUrl'] as String?,
    );
  }
}
