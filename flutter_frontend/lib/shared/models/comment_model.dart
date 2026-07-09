class CommentModel {
  final String id;
  final String reviewId;
  final int userId;
  final String? username;
  final String? userAvatar;
  final String body;
  final String? parentCommentId;
  final List<CommentModel> replies;
  final bool isDeleted;
  final DateTime? createdAt;

  const CommentModel({
    required this.id,
    required this.reviewId,
    required this.userId,
    this.username,
    this.userAvatar,
    required this.body,
    this.parentCommentId,
    this.replies = const [],
    this.isDeleted = false,
    this.createdAt,
  });

  factory CommentModel.fromJson(Map<String, dynamic> json) {
    final author = json['user'] as Map<String, dynamic>?;
    final repliesRaw = json['replies'] as List<dynamic>?;
    return CommentModel(
      id: json['id'] as String,
      reviewId: json['reviewId'] as String? ?? json['review_id'] as String? ?? '',
      userId: json['userId'] as int? ?? json['user_id'] as int? ?? author?['id'] as int? ?? 0,
      username: author?['username'] as String? ?? json['username'] as String?,
      userAvatar: author?['avatar_url'] as String? ?? json['avatar_url'] as String?,
      body: json['body'] as String? ?? '',
      parentCommentId: json['parentCommentId'] as String? ?? json['parent_comment_id'] as String?,
      replies: repliesRaw?.map((e) => CommentModel.fromJson(e as Map<String, dynamic>)).toList() ?? [],
      isDeleted: json['isDeleted'] as bool? ?? false,
      createdAt: _parseDate(json['createdAt'] ?? json['created_at']),
    );
  }

  static DateTime? _parseDate(dynamic value) {
    if (value == null) return null;
    if (value is DateTime) return value;
    return DateTime.tryParse(value as String);
  }
}
