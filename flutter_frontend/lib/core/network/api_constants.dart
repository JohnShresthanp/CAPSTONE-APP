class ApiConstants {
  static const String baseUrl = 'http://10.0.2.2:3000/api';

  // Auth
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String refreshToken = '/auth/refresh-token';
  static const String logout = '/auth/logout';
  static const String profileMe = '/auth/profile/me';

  // Movies
  static const String movies = '/movies';
  static const String popularMovies = '/movies/popular';
  static const String newReleases = '/movies/new-releases';
  static const String topRated = '/movies/top-rated';
  static const String nepaliTrending = '/movies/nepali/trending';
  static const String movieDetail = '/movies/';
  static const String movieReviews = '/movies/';
  static const String similarMovies = '/movies/';
  static const String search = '/movies/search';
  static const String personDetail = '/movies/person/';

  // Reviews
  static const String reviews = '/reviews';
  static const String reviewDetail = '/reviews/';
  static const String reviewComments = '/reviews/';
  static const String reviewLike = '/reviews/';

  // Lists
  static const String lists = '/lists';
  static const String listDetail = '/lists/';
  static const String listByUser = '/lists/user/';

  // Feed
  static const String feed = '/users/feed/activity';

  // Profile / Users
  static const String users = '/users';
  static const String userProfile = '/users/';
  static const String updateProfile = '/users/me/profile';
  static const String userStats = '/users/';
  static const String userReviews = '/users/';
  static const String userLists = '/users/';
  static const String followUser = '/users/';
  static const String userFollowers = '/users/';
  static const String userFollowing = '/users/';

  // Admin
  static const String adminUsers = '/admin/users';
  static const String adminMovies = '/admin/movies/nepali';
  static const String adminReviews = '/admin/reviews';
  static const String adminDashboard = '/admin/stats';
  static const String adminFlaggedReviews = '/admin/reviews/flagged';
}
