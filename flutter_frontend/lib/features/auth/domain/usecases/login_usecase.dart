import 'package:flutter_frontend/features/auth/domain/entities/user.dart';
import 'package:flutter_frontend/features/auth/domain/repositories/auth_repository.dart';

class LoginUseCase {
  final AuthRepository repository;

  LoginUseCase(this.repository);

  Future<AuthUser> execute(String email, String password) {
    return repository.login(email, password);
  }
}
