import 'package:flutter/foundation.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';

class CrashlyticsService {
  static FirebaseCrashlytics? _crashlytics;

  static Future<void> init() async {
    try {
      _crashlytics = FirebaseCrashlytics.instance;
      FlutterError.onError = (errorDetails) {
        _crashlytics?.recordFlutterFatalError(errorDetails);
      };
      PlatformDispatcher.instance.onError = (error, stack) {
        _crashlytics?.recordError(error, stack, fatal: true);
        return true;
      };
    } catch (_) {
      _crashlytics = null;
    }
  }

  static Future<void> log(String message) async {
    try {
      await _crashlytics?.log(message);
    } catch (_) {}
  }

  static Future<void> recordError(
    dynamic exception,
    StackTrace? stack, {
    dynamic reason,
  }) async {
    try {
      await _crashlytics?.recordError(exception, stack, reason: reason);
    } catch (_) {}
  }

  static Future<void> setUserIdentifier(String userId) async {
    try {
      await _crashlytics?.setUserIdentifier(userId);
    } catch (_) {}
  }
}
