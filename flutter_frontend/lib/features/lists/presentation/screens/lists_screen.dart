import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_frontend/core/theme/colors.dart';
import 'package:flutter_frontend/core/utils/error_handler.dart';
import 'package:flutter_frontend/core/widgets/loading_indicator.dart';
import 'package:flutter_frontend/core/widgets/error_widget.dart';
import 'package:flutter_frontend/features/lists/data/repository/list_repository_impl.dart';
import 'package:flutter_frontend/shared/models/list_model.dart';

class ListsScreen extends StatefulWidget {
  const ListsScreen({super.key});

  @override
  State<ListsScreen> createState() => _ListsScreenState();
}

class _ListsScreenState extends State<ListsScreen> {
  final ListRepositoryImpl _repository = ListRepositoryImpl();
  List<ListModel> _lists = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadLists();
  }

  Future<void> _loadLists() async {
    _isLoading = true;
    setState(() {});
    try {
      final allLists = await _repository.getLists();
      _lists = allLists.where((l) => !l.isSystem).toList();
    } catch (e) {
      _error = extractErrorMessage(e);
    }
    _isLoading = false;
    if (mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Lists')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showCreateListDialog(),
        backgroundColor: AppColors.primary,
        icon: const Icon(Icons.add),
        label: const Text('New List'),
      ),
      body: _isLoading
          ? const LoadingIndicator()
          : _error != null
              ? AppErrorWidget(message: _error!, onRetry: _loadLists)
              : RefreshIndicator(
                  onRefresh: _loadLists,
                  child: _lists.isEmpty
                      ? const Center(
                          child: Text('No lists yet. Create your first list!', style: TextStyle(color: AppColors.textSecondary)),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.fromLTRB(16, 8, 16, 80),
                          itemCount: _lists.length,
                          itemBuilder: (context, index) {
                            final list = _lists[index];
                            return Container(
                              margin: const EdgeInsets.only(bottom: 12),
                              decoration: BoxDecoration(
                                color: AppColors.cardBackground,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: ListTile(
                                contentPadding: const EdgeInsets.all(16),
                                leading: Icon(
                                  list.isPublic ? Icons.public : Icons.lock_outline,
                                  color: AppColors.textSecondary,
                                ),
                                title: Text(list.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                                subtitle: Text(
                                  '${list.movieCount} movies${list.isPublic ? '' : ' · Private'}',
                                  style: const TextStyle(color: AppColors.textSecondary),
                                ),
                                trailing: const Icon(Icons.chevron_right),
                                onTap: () => context.push('/lists/${list.id}'),
                              ),
                            );
                          },
                        ),
                ),
    );
  }

  void _showCreateListDialog() {
    final nameController = TextEditingController();
    final descController = TextEditingController();
    bool isPrivate = false;
    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Create List'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameController,
                decoration: const InputDecoration(hintText: 'List name'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: descController,
                decoration: const InputDecoration(hintText: 'Description (optional)'),
                maxLines: 2,
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Make private'),
                  Switch(
                    value: isPrivate,
                    onChanged: (v) => setDialogState(() => isPrivate = v),
                    activeColor: AppColors.primary,
                  ),
                ],
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
            TextButton(
              onPressed: () async {
                if (nameController.text.isNotEmpty) {
                  try {
                    await _repository.createList(
                      nameController.text,
                      descController.text.isNotEmpty ? descController.text : null,
                      isPrivate,
                    );
                    if (mounted) Navigator.pop(context);
                    _loadLists();
                  } catch (e) {
                    if (mounted) {
                      Navigator.pop(context);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text(extractErrorMessage(e)), backgroundColor: AppColors.error),
                      );
                    }
                  }
                }
              },
              child: const Text('Create'),
            ),
          ],
        ),
      ),
    );
  }
}
