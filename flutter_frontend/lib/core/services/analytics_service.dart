import 'package:firebase_analytics/firebase_analytics.dart';

class AnalyticsService {
  static final FirebaseAnalytics _analytics = FirebaseAnalytics.instance;

  static Future<void> logEvent({
    required String name,
    Map<String, Object>? parameters,
  }) async {
    await _analytics.logEvent(name: name, parameters: parameters);
  }

  static Future<void> setUserId(String? userId) async {
    await _analytics.setUserId(id: userId);
  }

  static Future<void> logScreen(String screenName) async {
    await _analytics.logScreenView(screenName: screenName);
  }

  static Future<void> logLogin(String method) async {
    await _analytics.logLogin(loginMethod: method);
  }

  static Future<void> logSearch(String searchTerm) async {
    await _analytics.logSearch(searchTerm: searchTerm);
  }

  static Future<void> logMovieView(String movieId) async {
    await logEvent(name: 'movie_view', parameters: <String, Object>{'movie_id': movieId});
  }

  static Future<void> logReviewCreated(String movieId) async {
    await logEvent(name: 'review_created', parameters: <String, Object>{'movie_id': movieId});
  }

  static Future<void> logListCreated() async {
    await logEvent(name: 'list_created');
  }
}
