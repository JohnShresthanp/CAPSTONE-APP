import 'package:flutter_frontend/features/search/data/datasource/search_remote_datasource.dart';
import 'package:flutter_frontend/shared/models/movie_model.dart';

class SearchRepositoryImpl {
  final SearchRemoteDataSource _remoteDataSource = SearchRemoteDataSource();

  Future<List<MovieModel>> searchMovies(String query, {int page = 1}) async {
    final data = await _remoteDataSource.searchMovies(query, page: page);
    return data.map((e) => MovieModel.fromJson(e as Map<String, dynamic>)).toList();
  }


}
