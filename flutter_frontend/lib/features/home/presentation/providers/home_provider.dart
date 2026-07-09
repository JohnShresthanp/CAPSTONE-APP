import 'package:flutter/foundation.dart';
import 'package:flutter_frontend/core/utils/error_handler.dart';
import 'package:flutter_frontend/features/home/data/repository/home_repository_impl.dart';
import 'package:flutter_frontend/shared/models/movie_model.dart';

class HomeProvider extends ChangeNotifier {
  final HomeRepositoryImpl _repository = HomeRepositoryImpl();

  List<MovieModel> _popularMovies = [];
  List<MovieModel> _trendingMovies = [];
  List<MovieModel> _nowPlaying = [];
  List<MovieModel> _topRated = [];
  bool _isLoading = false;
  String? _error;

  List<MovieModel> get popularMovies => _popularMovies;
  List<MovieModel> get trendingMovies => _trendingMovies;
  List<MovieModel> get nowPlaying => _nowPlaying;
  List<MovieModel> get topRated => _topRated;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadHomeData() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final results = await Future.wait([
        _repository.getPopularMovies().catchError((_) => <MovieModel>[]),
        _repository.getNepaliTrending().catchError((_) => <MovieModel>[]),
        _repository.getNewReleases().catchError((_) => <MovieModel>[]),
        _repository.getTopRatedMovies().catchError((_) => <MovieModel>[]),
      ]);

      _popularMovies = results[0];
      _trendingMovies = results[1];
      _nowPlaying = results[2];
      _topRated = results[3];

      if (_popularMovies.isEmpty && _trendingMovies.isEmpty && _nowPlaying.isEmpty && _topRated.isEmpty) {
        _error = 'Could not load any data. Please check your connection.';
      }

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = extractErrorMessage(e);
      _isLoading = false;
      notifyListeners();
    }
  }
}
