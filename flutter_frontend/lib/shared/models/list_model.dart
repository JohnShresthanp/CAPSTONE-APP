class ListModel {
  final String id;
  final String name;
  final String? description;
  final int userId;
  final String? username;
  final String? coverImage;
  final bool isPublic;
  final bool isSystem;
  final int movieCount;
  final int followerCount;
  final bool isFollowing;
  final List<MovieItem>? movies;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const ListModel({
    required this.id,
    required this.name,
    this.description,
    required this.userId,
    this.username,
    this.coverImage,
    this.isPublic = true,
    this.isSystem = false,
    this.movieCount = 0,
    this.followerCount = 0,
    this.isFollowing = false,
    this.movies,
    this.createdAt,
    this.updatedAt,
  });

  factory ListModel.fromJson(Map<String, dynamic> json) {
    final count = json['_count'] as Map<String, dynamic>?;
    final rawMovies = json['movies'] as List<dynamic>?;
    final movieItems = rawMovies?.map((e) {
      if (e is Map<String, dynamic> && e.containsKey('movie')) {
        final movie = e['movie'] as Map<String, dynamic>;
        return MovieItem(
          id: movie['id'] as String? ?? '',
          title: movie['title'] as String? ?? '',
          posterPath: movie['posterUrl'] as String?,
          position: e['sortOrder'] as int?,
        );
      }
      return MovieItem.fromJson(e as Map<String, dynamic>);
    }).toList();
    return ListModel(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      userId: json['userId'] as int? ?? json['user_id'] as int? ?? 0,
      username: json['username'] as String?,
      isPublic: json['isPrivate'] is bool ? !(json['isPrivate'] as bool) : true,
      isSystem: json['isSystem'] as bool? ?? json['is_system'] as bool? ?? false,
      movieCount: count?['movies'] as int? ?? movieItems?.length ?? 0,
      movies: movieItems,
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
      'name': name,
      'description': description,
      'userId': userId,
      'username': username,
      'coverImage': coverImage,
      'isPublic': isPublic,
      'movieCount': movieCount,
      'followerCount': followerCount,
      'isFollowing': isFollowing,
      'movies': movies?.map((e) => e.toJson()).toList(),
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }
}

class MovieItem {
  final String id;
  final String title;
  final String? posterPath;
  final int? position;

  const MovieItem({
    required this.id,
    required this.title,
    this.posterPath,
    this.position,
  });

  factory MovieItem.fromJson(Map<String, dynamic> json) {
    final movie = json['movie'] as Map<String, dynamic>?;
    return MovieItem(
      id: movie?['id'] as String? ?? json['id'] as String,
      title: movie?['title'] as String? ?? json['title'] as String,
      posterPath: movie?['posterUrl'] as String? ?? json['posterPath'] as String? ?? json['poster_path'] as String?,
      position: json['sortOrder'] as int? ?? json['position'] as int?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'posterPath': posterPath,
      'position': position,
    };
  }
}
