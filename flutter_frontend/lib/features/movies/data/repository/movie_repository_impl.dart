import 'package:flutter_frontend/features/movies/data/datasource/movie_remote_datasource.dart';
import 'package:flutter_frontend/features/movies/domain/repositories/movie_repository.dart';
import 'package:flutter_frontend/shared/models/movie_model.dart';

class MovieRepositoryImpl implements MovieRepository {
  final MovieRemoteDataSource _remoteDataSource = MovieRemoteDataSource();

  @override
  Future<MovieModel> getMovieDetail(String movieId) async {
    final data = await _remoteDataSource.getMovieDetail(movieId);
    return MovieModel.fromJson(data);
  }

  @override
  Future<List<MovieModel>> getSimilarMovies(String movieId) async {
    final data = await _remoteDataSource.getSimilarMovies(movieId);
    return data.map((e) => MovieModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  @override
  Future<List<MovieModel>> getRecommendedMovies() async {
    final data = await _remoteDataSource.getRecommendedMovies();
    return data.map((e) => MovieModel.fromJson(e as Map<String, dynamic>)).toList();
  }
}
