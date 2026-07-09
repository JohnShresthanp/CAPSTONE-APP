import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_frontend/core/theme/colors.dart';
import 'package:flutter_frontend/core/utils/error_handler.dart';
import 'package:flutter_frontend/core/utils/helpers.dart';
import 'package:flutter_frontend/core/widgets/loading_indicator.dart';
import 'package:flutter_frontend/core/widgets/error_widget.dart';
import 'package:flutter_frontend/features/lists/data/repository/list_repository_impl.dart';
import 'package:flutter_frontend/shared/models/list_model.dart';

class ListDetailScreen extends StatefulWidget {
  final String listId;

  const ListDetailScreen({super.key, required this.listId});

  @override
  State<ListDetailScreen> createState() => _ListDetailScreenState();
}

class _ListDetailScreenState extends State<ListDetailScreen> {
  final ListRepositoryImpl _repository = ListRepositoryImpl();
  ListModel? _list;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadList();
  }

  Future<void> _loadList() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      _list = await _repository.getListDetail(widget.listId);
    } catch (e) {
      _error = extractErrorMessage(e);
    }
    if (mounted) setState(() => _isLoading = false);
  }

  Future<void> _togglePrivacy() async {
    if (_list == null) return;
    try {
      final updated = await _repository.updateList(
        _list!.id,
        _list!.name,
        _list!.description,
        !_list!.isPublic,
      );
      setState(() => _list = updated);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(extractErrorMessage(e)), backgroundColor: AppColors.error),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_list?.name ?? 'List'),
        actions: [
          if (_list != null && !_list!.isSystem) ...[
            IconButton(
              icon: Icon(_list!.isPublic ? Icons.public : Icons.lock_outline),
              tooltip: _list!.isPublic ? 'Make private' : 'Make public',
              onPressed: _togglePrivacy,
            ),
            IconButton(
              icon: const Icon(Icons.delete_outline),
              tooltip: 'Delete list',
              onPressed: () async {
                final confirm = await showDialog<bool>(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: const Text('Delete List'),
                    content: Text('Delete "${_list!.name}"? This cannot be undone.'),
                    actions: [
                      TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
                      TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Delete', style: TextStyle(color: AppColors.error))),
                    ],
                  ),
                );
                if (confirm == true) {
                  try {
                    await _repository.deleteList(_list!.id);
                    if (mounted) context.pop();
                  } catch (e) {
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text(extractErrorMessage(e)), backgroundColor: AppColors.error),
                      );
                    }
                  }
                }
              },
            ),
          ],
        ],
      ),
      body: _isLoading
          ? const LoadingIndicator()
          : _error != null
              ? AppErrorWidget(message: _error!, onRetry: _loadList)
              : RefreshIndicator(
                  onRefresh: _loadList,
                  child: _list!.movies == null || _list!.movies!.isEmpty
                      ? const Center(
                          child: Text(
                            'No movies in this list yet.',
                            style: TextStyle(color: AppColors.textSecondary),
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _list!.movies!.length,
                          itemBuilder: (context, index) {
                            final item = _list!.movies![index];
                            return Container(
                              margin: const EdgeInsets.only(bottom: 12),
                              decoration: BoxDecoration(
                                color: AppColors.cardBackground,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: ListTile(
                                contentPadding: const EdgeInsets.all(8),
                                leading: ClipRRect(
                                  borderRadius: BorderRadius.circular(8),
                                  child: item.posterPath != null
                                      ? CachedNetworkImage(
                                          imageUrl: getImageUrl(item.posterPath!, size: 'w92'),
                                          width: 60,
                                          height: 80,
                                          fit: BoxFit.cover,
                                          placeholder: (_, __) => Container(
                                            color: AppColors.shimmerBase,
                                            width: 60,
                                            height: 80,
                                          ),
                                          errorWidget: (_, __, ___) => Container(
                                            color: AppColors.shimmerBase,
                                            width: 60,
                                            height: 80,
                                            child: const Icon(Icons.movie, color: AppColors.textHint),
                                          ),
                                        )
                                      : Container(
                                          color: AppColors.shimmerBase,
                                          width: 60,
                                          height: 80,
                                          child: const Icon(Icons.movie, color: AppColors.textHint),
                                        ),
                                ),
                                title: Text(
                                  item.title,
                                  style: const TextStyle(fontWeight: FontWeight.w600),
                                ),
                                trailing: const Icon(Icons.chevron_right),
                                onTap: () => context.push('/movies/${item.id}'),
                              ),
                            );
                          },
                        ),
                ),
    );
  }
}
