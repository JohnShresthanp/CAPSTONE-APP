import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_frontend/core/theme/colors.dart';
import 'package:flutter_frontend/core/utils/error_handler.dart';
import 'package:flutter_frontend/core/widgets/loading_indicator.dart';
import 'package:flutter_frontend/core/widgets/error_widget.dart';
import 'package:flutter_frontend/features/lists/data/repository/list_repository_impl.dart';
import 'package:flutter_frontend/shared/models/list_model.dart';

class UserListsScreen extends StatefulWidget {
  final String username;

  const UserListsScreen({super.key, required this.username});

  @override
  State<UserListsScreen> createState() => _UserListsScreenState();
}

class _UserListsScreenState extends State<UserListsScreen> {
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
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      _lists = await _repository.getUserLists(widget.username);
    } catch (e) {
      _error = extractErrorMessage(e);
    }
    if (mounted) setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text("${widget.username}'s Lists")),
      body: _isLoading
          ? const LoadingIndicator()
          : _error != null
              ? AppErrorWidget(message: _error!, onRetry: _loadLists)
              : RefreshIndicator(
                  onRefresh: _loadLists,
                  child: _lists.isEmpty
                      ? const Center(
                          child: Text('No public lists yet.', style: TextStyle(color: AppColors.textSecondary)),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
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
                                  '${list.movieCount} movies',
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
}
