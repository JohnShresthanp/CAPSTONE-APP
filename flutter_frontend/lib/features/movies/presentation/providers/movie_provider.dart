import 'package:flutter/foundation.dart';
import 'package:flutter_frontend/core/utils/error_handler.dart';
import 'package:flutter_frontend/features/movies/data/repository/movie_repository_impl.dart';
import 'package:flutter_frontend/shared/models/movie_model.dart';

class MovieProvider extends ChangeNotifier {
  final MovieRepositoryImpl _repository = MovieRepositoryImpl();

  MovieModel? _movie;
  List<MovieModel> _similarMovies = [];
  List<MovieModel> _recommendedMovies = [];
  bool _isLoading = false;
  String? _error;

  MovieModel? get movie => _movie;
  List<MovieModel> get similarMovies => _similarMovies;
  List<MovieModel> get recommendedMovies => _recommendedMovies;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadMovieDetail(String movieId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final results = await Future.wait([
        _repository.getMovieDetail(movieId),
        _repository.getSimilarMovies(movieId),
        _repository.getRecommendedMovies(),
      ]);

      _movie = results[0] as MovieModel;
      _similarMovies = results[1] as List<MovieModel>;
      _recommendedMovies = results[2] as List<MovieModel>;

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = extractErrorMessage(e);
      _isLoading = false;
      notifyListeners();
    }
  }
}
