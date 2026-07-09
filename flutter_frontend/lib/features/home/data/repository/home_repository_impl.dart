import 'package:flutter_frontend/features/home/data/datasource/home_remote_datasource.dart';
import 'package:flutter_frontend/features/home/domain/repositories/home_repository.dart';
import 'package:flutter_frontend/shared/models/movie_model.dart';

class HomeRepositoryImpl implements HomeRepository {
  final HomeRemoteDataSource _remoteDataSource = HomeRemoteDataSource();

  @override
  Future<List<MovieModel>> getPopularMovies() async {
    final data = await _remoteDataSource.getPopularMovies();
    return data.map((e) => MovieModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  @override
  Future<List<MovieModel>> getNepaliTrending() async {
    final data = await _remoteDataSource.getNepaliTrending();
    return data.map((e) => MovieModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  @override
  Future<List<MovieModel>> getNewReleases() async {
    final data = await _remoteDataSource.getNewReleases();
    return data.map((e) => MovieModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  @override
  Future<List<MovieModel>> getTopRatedMovies() async {
    final data = await _remoteDataSource.getTopRatedMovies();
    return data.map((e) => MovieModel.fromJson(e as Map<String, dynamic>)).toList();
  }
}
