import 'package:flutter_frontend/features/profile/data/datasource/profile_remote_datasource.dart';
import 'package:flutter_frontend/features/profile/domain/repositories/profile_repository.dart';
import 'package:flutter_frontend/shared/models/review_model.dart';
import 'package:flutter_frontend/shared/models/user_model.dart';

class ProfileRepositoryImpl implements ProfileRepository {
  final ProfileRemoteDataSource _remoteDataSource = ProfileRemoteDataSource();

  @override
  Future<UserModel> getProfile(String? username) async {
    final data = await _remoteDataSource.getProfile(username);
    return UserModel.fromJson(data);
  }

  @override
  Future<UserModel> updateProfile(Map<String, dynamic> data) async {
    final response = await _remoteDataSource.updateProfile(data);
    return UserModel.fromJson(response);
  }

  @override
  Future<List<ReviewModel>> getUserReviews(String username, {int page = 1}) async {
    final data = await _remoteDataSource.getUserReviews(username, page: page);
    return data.map((e) => ReviewModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  @override
  Future<void> followUser(String username) async {
    await _remoteDataSource.followUser(username);
  }

  @override
  Future<void> unfollowUser(String username) async {
    await _remoteDataSource.unfollowUser(username);
  }

  @override
  Future<bool> isFollowing(String username) async {
    return false;
  }
}
