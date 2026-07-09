import 'package:dio/dio.dart';
import 'package:flutter_frontend/core/storage/secure_storage.dart';

class AuthInterceptor extends Interceptor {
  final Dio dio;
  final SecureStorage secureStorage;
  bool _isRefreshing = false;

  AuthInterceptor({required this.dio, required this.secureStorage});

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    if (options.path == '/auth/refresh-token') {
      return handler.next(options);
    }
    final token = await secureStorage.getToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401 && !_isRefreshing) {
      final refreshToken = await secureStorage.getRefreshToken();
      if (refreshToken != null) {
        _isRefreshing = true;
        try {
          final rawDio = Dio(BaseOptions(
            baseUrl: dio.options.baseUrl,
            headers: {'Content-Type': 'application/json'},
          ));
          final response = await rawDio.post(
            '/auth/refresh-token',
            data: {'refreshToken': refreshToken},
          );
          if (response.statusCode == 200) {
            final newToken = response.data['token'];
            final newRefresh = response.data['refreshToken'];
            await secureStorage.saveToken(newToken);
            if (newRefresh != null) {
              await secureStorage.saveRefreshToken(newRefresh);
            }
            final retryOptions = err.requestOptions;
            retryOptions.headers['Authorization'] = 'Bearer $newToken';
            final retryResponse = await dio.fetch(retryOptions);
            return handler.resolve(retryResponse);
          }
        } catch (_) {
          await secureStorage.clearAll();
        } finally {
          _isRefreshing = false;
        }
      }
    }
    handler.next(err);
  }
}
