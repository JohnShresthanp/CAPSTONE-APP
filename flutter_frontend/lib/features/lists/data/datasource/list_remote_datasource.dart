import 'package:flutter_frontend/core/network/api_constants.dart';
import 'package:flutter_frontend/core/network/dio_client.dart';

class ListRemoteDataSource {
  final DioClient _dioClient = DioClient();

  Future<List<dynamic>> getLists() async {
    final response = await _dioClient.get(ApiConstants.lists);
    final data = response.data['data'];
    if (data is List) return data;
    return [];
  }

  Future<Map<String, dynamic>> getListDetail(String listId) async {
    final response = await _dioClient.get('${ApiConstants.listDetail}$listId');
    final data = response.data['data'];
    return (data is Map ? data : response.data) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> createList(String name, String? description, bool isPrivate) async {
    final response = await _dioClient.post(
      ApiConstants.lists,
      data: {'name': name, 'description': description, 'isPrivate': isPrivate},
    );
    final data = response.data['data'];
    return (data is Map ? data : response.data) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> updateList(String listId, String name, String? description, bool isPrivate) async {
    final response = await _dioClient.put(
      '${ApiConstants.lists}/$listId',
      data: {'name': name, 'description': description, 'isPrivate': isPrivate},
    );
    final data = response.data['data'];
    return (data is Map ? data : response.data) as Map<String, dynamic>;
  }

  Future<void> deleteList(String listId) async {
    await _dioClient.delete('${ApiConstants.lists}/$listId');
  }

  Future<void> addMovieToList(String listId, String movieId) async {
    await _dioClient.post('${ApiConstants.listDetail}$listId/movies', data: {'movieId': movieId});
  }

  Future<void> removeMovieFromList(String listId, String movieId) async {
    await _dioClient.delete('${ApiConstants.listDetail}$listId/movies/$movieId');
  }

  Future<List<dynamic>> getUserLists(String username) async {
    final response = await _dioClient.get('${ApiConstants.listByUser}$username');
    final data = response.data['data'];
    if (data is List) return data;
    return [];
  }
}
