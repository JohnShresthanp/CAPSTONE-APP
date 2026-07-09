import 'package:flutter_frontend/features/feed/data/datasource/feed_remote_datasource.dart';
import 'package:flutter_frontend/shared/models/activity_model.dart';

class FeedRepositoryImpl {
  final FeedRemoteDataSource _remoteDataSource = FeedRemoteDataSource();

  Future<List<ActivityModel>> getFeed() async {
    final data = await _remoteDataSource.getFeed();
    return data.map((e) => ActivityModel.fromJson(e as Map<String, dynamic>)).toList();
  }
}
