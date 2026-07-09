import 'package:dio/dio.dart';

String extractErrorMessage(dynamic e) {
  if (e is DioException) {
    if (e.response?.data != null) {
      final data = e.response!.data;
      if (data is Map<String, dynamic>) {
        if (data.containsKey('message')) {
          return data['message'] as String;
        }
        if (data.containsKey('errors')) {
          final errors = data['errors'] as List;
          if (errors.isNotEmpty) {
            return errors.map((e) => e['message']).join(', ');
          }
        }
      }
    }
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return 'Connection timed out. Please check your internet and try again.';
      case DioExceptionType.connectionError:
        return 'Cannot connect to server. Please check your internet connection.';
      case DioExceptionType.badResponse:
        final statusCode = e.response?.statusCode;
        if (statusCode == 401) return 'Session expired. Please log in again.';
        if (statusCode == 403) return 'You don\'t have permission to do that.';
        if (statusCode == 404) return 'The requested resource was not found.';
        if (statusCode == 409) return 'This action conflicts with existing data.';
        if (statusCode == 500) return 'Server error. Please try again later.';
        return 'Request failed ($statusCode). Please try again.';
      default:
        break;
    }
  }
  return 'An unexpected error occurred. Please try again.';
}
