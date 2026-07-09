class ReviewModel {
  final String id;
  final String movieId;
  final int userId;
  final String? username;
  final String? userAvatar;
  final String? movieTitle;
  final String? moviePoster;
  final double rating;
  final String content;
  final int likeCount;
  final int commentCount;
  final bool isLiked;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const ReviewModel({
    required this.id,
    required this.movieId,
    required this.userId,
    this.username,
    this.userAvatar,
    this.movieTitle,
    this.moviePoster,
    required this.rating,
    required this.content,
    this.likeCount = 0,
    this.commentCount = 0,
    this.isLiked = false,
    this.createdAt,
    this.updatedAt,
  });

  factory ReviewModel.fromJson(Map<String, dynamic> json) {
    final movie = json['movie'] as Map<String, dynamic>?;
    final author = json['user'] as Map<String, dynamic>? ?? json['author'] as Map<String, dynamic>?;
    final count = json['_count'] as Map<String, dynamic>?;
    return ReviewModel(
      id: json['id'] as String,
      movieId: json['movieId'] as String? ?? json['movie_id'] as String,
      userId: json['userId'] as int? ?? json['user_id'] as int? ?? author?['id'] as int? ?? 0,
      username: author?['username'] as String? ?? json['username'] as String?,
      userAvatar: author?['avatar_url'] as String? ?? json['avatar_url'] as String? ?? json['user_avatar'] as String?,
      movieTitle: movie?['title'] as String? ?? json['movie_title'] as String?,
      moviePoster: movie?['posterUrl'] as String? ?? json['movie_poster'] as String? ?? movie?['poster_url'] as String?,
      rating: (json['rating'] as num?)?.toDouble() ?? 0,
      content: json['body'] as String? ?? json['content'] as String? ?? '',
      likeCount: json['likeCount'] as int? ?? json['like_count'] as int? ?? count?['likes'] as int? ?? 0,
      commentCount: json['commentCount'] as int? ?? json['comment_count'] as int? ?? count?['comments'] as int? ?? 0,
      isLiked: json['isLiked'] as bool? ?? json['is_liked'] as bool? ?? json['likedByUser'] as bool? ?? false,
      createdAt: _parseDate(json['createdAt'] ?? json['created_at']),
      updatedAt: _parseDate(json['updatedAt'] ?? json['updated_at']),
    );
  }

  static DateTime? _parseDate(dynamic value) {
    if (value == null) return null;
    if (value is DateTime) return value;
    return DateTime.tryParse(value as String);
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'movieId': movieId,
      'userId': userId,
      'username': username,
      'avatar_url': userAvatar,
      'movieTitle': movieTitle,
      'moviePoster': moviePoster,
      'rating': rating,
      'content': content,
      'likeCount': likeCount,
      'commentCount': commentCount,
      'isLiked': isLiked,
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }
}
