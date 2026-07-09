class ActivityModel {
  final String id;
  final int userId;
  final String username;
  final String? userAvatar;
  final String type;
  final String? content;
  final String? movieId;
  final String? movieTitle;
  final String? moviePoster;
  final String? reviewId;
  final String? listId;
  final String? listName;
  final int likeCount;
  final int commentCount;
  final DateTime? createdAt;

  const ActivityModel({
    required this.id,
    required this.userId,
    required this.username,
    this.userAvatar,
    required this.type,
    this.content,
    this.movieId,
    this.movieTitle,
    this.moviePoster,
    this.reviewId,
    this.listId,
    this.listName,
    this.likeCount = 0,
    this.commentCount = 0,
    this.createdAt,
  });

  factory ActivityModel.fromJson(Map<String, dynamic> json) {
    final actor = json['actor'] as Map<String, dynamic>?;
    final meta = json['metadata'] as Map<String, dynamic>?;
    return ActivityModel(
      id: json['id'] as String,
      userId: json['actorId'] as int,
      username: actor?['username'] as String? ?? '',
      userAvatar: actor?['avatar_url'] as String?,
      type: json['activityType'] as String? ?? 'review',
      content: meta?['title'] as String?,
      movieId: json['targetType'] == 'movie' ? json['targetId'] as String? : null,
      movieTitle: meta?['title'] as String?,
      moviePoster: meta?['poster_url'] as String?,
      reviewId: null,
      listId: null,
      listName: null,
      likeCount: 0,
      commentCount: 0,
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt'] as String) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'actorId': userId,
      'username': username,
      'avatar_url': userAvatar,
      'activityType': type,
      'content': content,
      'movieId': movieId,
      'movieTitle': movieTitle,
      'createdAt': createdAt?.toIso8601String(),
    };
  }
}
