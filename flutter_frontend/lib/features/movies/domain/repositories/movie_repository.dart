import 'package:flutter_frontend/shared/models/movie_model.dart';

abstract class MovieRepository {
  Future<MovieModel> getMovieDetail(String movieId);
  Future<List<MovieModel>> getSimilarMovies(String movieId);
  Future<List<MovieModel>> getRecommendedMovies();
}
