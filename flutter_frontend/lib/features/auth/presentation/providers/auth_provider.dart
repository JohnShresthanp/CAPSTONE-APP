import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_frontend/core/auth_state.dart';
import 'package:flutter_frontend/features/auth/domain/entities/user.dart';
import 'package:flutter_frontend/features/auth/data/repository/auth_repository_impl.dart';

class AuthProvider extends ChangeNotifier {
  final AuthRepositoryImpl _authRepository = AuthRepositoryImpl();

  AuthUser? _user;
  bool _isLoading = false;
  String? _error;

  AuthUser? get user => _user;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _user != null;
  String? get error => _error;
  bool get isAdmin => _user?.isAdmin ?? false;

  Future<void> checkAuthStatus() async {
    _user = await _authRepository.getCurrentUser();
    AuthState.setAuthenticated(_user != null);
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _user = await _authRepository.login(email, password);
      AuthState.setAuthenticated(true);
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = _extractErrorMessage(e);
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> register(String username, String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _user = await _authRepository.register(username, email, password);
      AuthState.setAuthenticated(true);
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = _extractErrorMessage(e);
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await _authRepository.logout();
    _user = null;
    AuthState.setAuthenticated(false);
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  String _extractErrorMessage(dynamic e) {
    if (e is DioException && e.response?.data != null) {
      final data = e.response!.data;
      if (data is Map<String, dynamic> && data.containsKey('message')) {
        return data['message'] as String;
      }
      if (data is Map<String, dynamic> && data.containsKey('errors')) {
        final errors = data['errors'] as List;
        if (errors.isNotEmpty) {
          return errors.map((e) => e['message']).join(', ');
        }
      }
    }
    return 'An unexpected error occurred. Please try again.';
  }
}
