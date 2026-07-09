import 'package:flutter/material.dart';
import 'package:flutter_frontend/core/theme/colors.dart';
import 'package:flutter_frontend/core/utils/error_handler.dart';
import 'package:flutter_frontend/core/widgets/error_widget.dart';
import 'package:flutter_frontend/features/lists/data/repository/list_repository_impl.dart';
import 'package:flutter_frontend/shared/models/list_model.dart';

class AddToListSheet extends StatefulWidget {
  final String movieId;

  const AddToListSheet({super.key, required this.movieId});

  @override
  State<AddToListSheet> createState() => _AddToListSheetState();
}

class _AddToListSheetState extends State<AddToListSheet> {
  final ListRepositoryImpl _repository = ListRepositoryImpl();
  List<ListModel> _lists = [];
  bool _isLoading = true;
  String? _error;
  Set<String> _adding = {};

  @override
  void initState() {
    super.initState();
    _loadLists();
  }

  Future<void> _loadLists() async {
    setState(() => _isLoading = true);
    try {
      _lists = await _repository.getLists();
    } catch (e) {
      _error = extractErrorMessage(e);
    }
    if (mounted) setState(() => _isLoading = false);
  }

  Future<void> _addTo(String listId) async {
    setState(() => _adding.add(listId));
    try {
      await _repository.addMovieToList(listId, widget.movieId);
      if (!mounted) return;
      setState(() => _adding.remove(listId));
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Added to list')),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _adding.remove(listId));
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(extractErrorMessage(e)), backgroundColor: AppColors.error),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Add to List',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (_isLoading)
            const Center(child: CircularProgressIndicator())
          else if (_error != null)
            AppErrorWidget(message: _error!, onRetry: _loadLists)
          else if (_lists.isEmpty)
            const Center(
              child: Text(
                'No lists yet. Create one from the Lists tab.',
                style: TextStyle(color: AppColors.textSecondary),
              ),
            )
          else
            Flexible(
              child: ListView.builder(
                shrinkWrap: true,
                itemCount: _lists.length,
                itemBuilder: (context, index) {
                  final list = _lists[index];
                  final isAdding = _adding.contains(list.id);
                  return ListTile(
                    leading: Icon(
                      list.isPublic ? Icons.list : Icons.lock_outline,
                      color: AppColors.textSecondary,
                    ),
                    title: Text(list.name),
                    subtitle: Text(
                      '${list.movieCount} movies',
                      style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                    ),
                    trailing: isAdding
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.add_circle_outline),
                    onTap: isAdding ? null : () => _addTo(list.id),
                  );
                },
              ),
            ),
        ],
      ),
    );
  }
}
