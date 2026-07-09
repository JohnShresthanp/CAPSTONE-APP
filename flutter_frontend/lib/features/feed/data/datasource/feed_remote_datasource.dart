import 'package:flutter_frontend/core/network/api_constants.dart';
import 'package:flutter_frontend/core/network/dio_client.dart';

class FeedRemoteDataSource {
  final DioClient _dioClient = DioClient();

  Future<List<dynamic>> getFeed() async {
    final response = await _dioClient.get(ApiConstants.feed);
    final data = response.data['data'];
    if (data is Map) {
      return (data['data'] ?? []) as List<dynamic>;
    }
    if (data is List) return data;
    return [];
  }
}
