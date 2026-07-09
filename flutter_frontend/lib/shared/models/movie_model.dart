class MovieModel {
  final String id;
  final String title;
  final String? overview;
  final String? posterUrl;
  final String? backdropUrl;
  final String? releaseDate;
  final double tmdbRating;
  final int tmdbVoteCount;
  final int? runtime;
  final List<String> genres;
  final String? language;
  final String? status;
  final String? imdbId;
  final bool? isInWatchlist;
  final bool? isFavorited;

  const MovieModel({
    required this.id,
    required this.title,
    this.overview,
    this.posterUrl,
    this.backdropUrl,
    this.releaseDate,
    this.tmdbRating = 0,
    this.tmdbVoteCount = 0,
    this.runtime,
    this.genres = const [],
    this.language,
    this.status,
    this.imdbId,
    this.isInWatchlist,
    this.isFavorited,
  });

  factory MovieModel.fromJson(Map<String, dynamic> json) {
    return MovieModel(
      id: json['id'] as String,
      title: json['title'] as String? ?? '',
      overview: json['description'] as String?,
      posterUrl: json['posterUrl'] as String?,
      backdropUrl: json['backdropUrl'] as String?,
      releaseDate: json['releaseDate'] as String?,
      tmdbRating: (json['tmdbRating'] as num?)?.toDouble() ?? 0,
      tmdbVoteCount: json['tmdbVoteCount'] as int? ?? 0,
      runtime: json['runtime'] as int?,
      genres: (json['genres'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      language: json['language'] as String?,
      status: json['status'] as String?,
      imdbId: json['imdbId'] as String?,
      isInWatchlist: json['isInWatchlist'] as bool?,
      isFavorited: json['isFavorited'] as bool?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': overview,
      'posterUrl': posterUrl,
      'backdropUrl': backdropUrl,
      'releaseDate': releaseDate,
      'tmdbRating': tmdbRating,
      'tmdbVoteCount': tmdbVoteCount,
      'runtime': runtime,
      'genres': genres,
      'language': language,
      'status': status,
      'imdbId': imdbId,
    };
  }

  // Backward-compatible getters
  String? get posterPath => posterUrl;
  String? get backdropPath => backdropUrl;
  double get voteAverage => tmdbRating;
  int get voteCount => tmdbVoteCount;
  String? get originalLanguage => language;
  List<int> get genreIds => const [];
  double get popularity => tmdbRating;
  bool get adult => false;
}
