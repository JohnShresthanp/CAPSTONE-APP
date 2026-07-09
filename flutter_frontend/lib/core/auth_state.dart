class AuthState {
  static bool _isAuthenticated = false;

  static bool get isAuthenticated => _isAuthenticated;

  static void setAuthenticated(bool value) {
    _isAuthenticated = value;
  }
}
