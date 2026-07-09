import 'package:flutter_frontend/core/network/api_constants.dart';
import 'package:flutter_frontend/core/network/dio_client.dart';

class HomeRemoteDataSource {
  final DioClient _dioClient = DioClient();

  Future<List<dynamic>> getPopularMovies() async {
    final response = await _dioClient.get(ApiConstants.popularMovies);
    return (response.data['data'] ?? []) as List<dynamic>;
  }

  Future<List<dynamic>> getNepaliTrending() async {
    final response = await _dioClient.get(ApiConstants.nepaliTrending);
    return (response.data['data'] ?? []) as List<dynamic>;
  }

  Future<List<dynamic>> getNewReleases() async {
    final response = await _dioClient.get(ApiConstants.newReleases);
    return (response.data['data'] ?? []) as List<dynamic>;
  }

  Future<List<dynamic>> getTopRatedMovies() async {
    final response = await _dioClient.get(ApiConstants.topRated);
    return (response.data['data'] ?? []) as List<dynamic>;
  }
}
