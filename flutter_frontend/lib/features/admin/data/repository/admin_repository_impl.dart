import 'package:flutter_frontend/features/admin/data/datasource/admin_remote_datasource.dart';

class AdminRepositoryImpl {
  final AdminRemoteDataSource _remoteDataSource = AdminRemoteDataSource();

  Future<Map<String, dynamic>> getDashboard() async {
    return await _remoteDataSource.getDashboard();
  }

  Future<List<dynamic>> getUsers({int page = 1}) async {
    return await _remoteDataSource.getUsers(page: page);
  }

  Future<List<dynamic>> getMovies({int page = 1}) async {
    return await _remoteDataSource.getMovies(page: page);
  }

  Future<List<dynamic>> getFlaggedReviews() async {
    return await _remoteDataSource.getFlaggedReviews();
  }

  Future<void> banUser(String userId) async {
    await _remoteDataSource.banUser(userId);
  }
}
