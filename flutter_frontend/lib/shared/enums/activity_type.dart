enum ActivityType {
  review,
  watchlist,
  rating,
  listCreate,
  follow,
  like,
  comment;

  String get value {
    return name;
  }

  static ActivityType fromString(String type) {
    return ActivityType.values.firstWhere(
      (e) => e.name == type,
      orElse: () => ActivityType.review,
    );
  }
}
