import 'package:flutter_frontend/shared/models/user_model.dart';
import 'package:flutter_frontend/shared/models/review_model.dart';

abstract class ProfileRepository {
  Future<UserModel> getProfile(String? username);
  Future<UserModel> updateProfile(Map<String, dynamic> data);
  Future<List<ReviewModel>> getUserReviews(String username, {int page = 1});
  Future<void> followUser(String username);
  Future<void> unfollowUser(String username);
  Future<bool> isFollowing(String username);
}
