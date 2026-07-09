import 'package:flutter_frontend/shared/models/movie_model.dart';

abstract class HomeRepository {
  Future<List<MovieModel>> getPopularMovies();
  Future<List<MovieModel>> getNepaliTrending();
  Future<List<MovieModel>> getNewReleases();
  Future<List<MovieModel>> getTopRatedMovies();
}
