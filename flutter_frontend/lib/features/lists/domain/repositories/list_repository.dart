import 'package:flutter_frontend/shared/models/list_model.dart';

abstract class ListRepository {
  Future<List<ListModel>> getLists();
  Future<List<ListModel>> getUserLists(String username);
  Future<ListModel> getListDetail(String listId);
  Future<ListModel> createList(String name, String? description, bool isPrivate);
  Future<ListModel> updateList(String listId, String name, String? description, bool isPrivate);
  Future<void> deleteList(String listId);
  Future<void> addMovieToList(String listId, String movieId);
  Future<void> removeMovieFromList(String listId, String movieId);
}
