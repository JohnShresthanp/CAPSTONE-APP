import 'package:flutter_frontend/features/lists/data/datasource/list_remote_datasource.dart';
import 'package:flutter_frontend/features/lists/domain/repositories/list_repository.dart';
import 'package:flutter_frontend/shared/models/list_model.dart';

class ListRepositoryImpl implements ListRepository {
  final ListRemoteDataSource _remoteDataSource = ListRemoteDataSource();

  @override
  Future<List<ListModel>> getLists() async {
    final data = await _remoteDataSource.getLists();
    return data.map((e) => ListModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  @override
  Future<List<ListModel>> getUserLists(String username) async {
    final data = await _remoteDataSource.getUserLists(username);
    return data.map((e) => ListModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  @override
  Future<ListModel> getListDetail(String listId) async {
    final data = await _remoteDataSource.getListDetail(listId);
    return ListModel.fromJson(data);
  }

  @override
  Future<ListModel> createList(String name, String? description, bool isPrivate) async {
    final data = await _remoteDataSource.createList(name, description, isPrivate);
    return ListModel.fromJson(data);
  }

  @override
  Future<ListModel> updateList(String listId, String name, String? description, bool isPrivate) async {
    final data = await _remoteDataSource.updateList(listId, name, description, isPrivate);
    return ListModel.fromJson(data);
  }

  @override
  Future<void> deleteList(String listId) async {
    await _remoteDataSource.deleteList(listId);
  }

  @override
  Future<void> addMovieToList(String listId, String movieId) async {
    await _remoteDataSource.addMovieToList(listId, movieId);
  }

  @override
  Future<void> removeMovieFromList(String listId, String movieId) async {
    await _remoteDataSource.removeMovieFromList(listId, movieId);
  }
}
