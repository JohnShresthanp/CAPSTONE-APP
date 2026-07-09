import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_frontend/core/theme/colors.dart';
import 'package:flutter_frontend/core/utils/error_handler.dart';
import 'package:flutter_frontend/core/utils/helpers.dart';
import 'package:flutter_frontend/features/reviews/presentation/providers/review_provider.dart';
import 'package:flutter_frontend/shared/models/comment_model.dart';

class CommentsSheet extends StatefulWidget {
  final String reviewId;
  final ReviewProvider provider;

  const CommentsSheet({super.key, required this.reviewId, required this.provider});

  @override
  State<CommentsSheet> createState() => _CommentsSheetState();
}

class _CommentsSheetState extends State<CommentsSheet> {
  List<CommentModel> _comments = [];
  bool _isLoading = true;
  String? _error;
  final _commentController = TextEditingController();
  String? _replyingTo;
  String? _replyingToName;

  @override
  void initState() {
    super.initState();
    _loadComments();
  }

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  Future<void> _loadComments() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      _comments = await widget.provider.getComments(widget.reviewId);
    } catch (e) {
      _error = extractErrorMessage(e);
    }
    if (mounted) setState(() => _isLoading = false);
  }

  Future<void> _postComment() async {
    final text = _commentController.text.trim();
    if (text.isEmpty) return;

    final success = await widget.provider.postComment(
      widget.reviewId,
      text,
      parentCommentId: _replyingTo,
    );
    if (success) {
      _commentController.clear();
      setState(() {
        _replyingTo = null;
        _replyingToName = null;
      });
      _loadComments();
    }
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.7,
      minChildSize: 0.4,
      maxChildSize: 0.95,
      expand: false,
      builder: (context, scrollController) {
        return Container(
          decoration: BoxDecoration(
            color: AppColors.background,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              Container(
                margin: const EdgeInsets.only(top: 12),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.divider,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    const Text('Comments', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const Spacer(),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
              ),
              if (_replyingTo != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  color: AppColors.cardBackground,
                  child: Row(
                    children: [
                      Text('Replying to $_replyingToName', style: const TextStyle(color: AppColors.primary, fontSize: 13)),
                      const Spacer(),
                      IconButton(
                        icon: const Icon(Icons.close, size: 18),
                        onPressed: () => setState(() {
                          _replyingTo = null;
                          _replyingToName = null;
                        }),
                      ),
                    ],
                  ),
                ),
              Expanded(
                child: _isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : _error != null
                        ? Center(child: Text(_error!, style: const TextStyle(color: AppColors.error)))
                        : _comments.isEmpty
                            ? const Center(child: Text('No comments yet. Be the first!', style: TextStyle(color: AppColors.textSecondary)))
                            : ListView.builder(
                                controller: scrollController,
                                padding: const EdgeInsets.symmetric(horizontal: 16),
                                itemCount: _comments.length,
                                itemBuilder: (context, index) => _buildComment(_comments[index]),
                              ),
              ),
              Container(
                padding: EdgeInsets.only(
                  left: 16,
                  right: 8,
                  top: 8,
                  bottom: MediaQuery.of(context).viewInsets.bottom + 8,
                ),
                decoration: const BoxDecoration(
                  border: Border(top: BorderSide(color: AppColors.divider)),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _commentController,
                        decoration: InputDecoration(
                          hintText: _replyingTo != null ? 'Reply to $_replyingToName...' : 'Write a comment...',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(24),
                            borderSide: BorderSide.none,
                          ),
                          filled: true,
                          fillColor: AppColors.cardBackground,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                          isDense: true,
                        ),
                        maxLines: null,
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton(
                      icon: const Icon(Icons.send, color: AppColors.primary),
                      onPressed: _postComment,
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildComment(CommentModel comment) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 14,
                backgroundImage: comment.userAvatar != null
                    ? CachedNetworkImageProvider(getImageUrl(comment.userAvatar!, size: 'w100'))
                    : null,
                child: comment.userAvatar == null ? const Icon(Icons.person, size: 14) : null,
              ),
              const SizedBox(width: 8),
              Text(
                comment.username ?? 'User',
                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
              ),
              if (comment.isDeleted) const Text(' [deleted]', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
              const Spacer(),
              if (!comment.isDeleted)
                TextButton(
                  onPressed: () {
                    setState(() {
                      _replyingTo = comment.id;
                      _replyingToName = comment.username;
                    });
                  },
                  child: const Text('Reply', style: TextStyle(fontSize: 12)),
                ),
            ],
          ),
          Padding(
            padding: const EdgeInsets.only(left: 36),
            child: Text(
              comment.body,
              style: TextStyle(
                color: comment.isDeleted ? AppColors.textSecondary : AppColors.textPrimary,
                fontSize: 14,
              ),
            ),
          ),
          if (comment.replies.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(left: 36, top: 8),
              child: Column(
                children: comment.replies.map((reply) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      CircleAvatar(
                        radius: 10,
                        backgroundImage: reply.userAvatar != null
                            ? CachedNetworkImageProvider(getImageUrl(reply.userAvatar!, size: 'w100'))
                            : null,
                        child: reply.userAvatar == null ? const Icon(Icons.person, size: 10) : null,
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(reply.username ?? 'User', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12)),
                            Text(reply.isDeleted ? '[deleted]' : reply.body, style: TextStyle(fontSize: 13, color: reply.isDeleted ? AppColors.textSecondary : null)),
                          ],
                        ),
                      ),
                    ],
                  ),
                )).toList(),
              ),
            ),
        ],
      ),
    );
  }
}
