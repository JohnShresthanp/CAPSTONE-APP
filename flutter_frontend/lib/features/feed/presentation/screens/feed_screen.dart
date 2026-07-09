import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_frontend/core/theme/colors.dart';
import 'package:flutter_frontend/core/utils/error_handler.dart';
import 'package:flutter_frontend/core/utils/helpers.dart';
import 'package:flutter_frontend/core/widgets/loading_indicator.dart';
import 'package:flutter_frontend/core/widgets/error_widget.dart';
import 'package:flutter_frontend/features/feed/data/repository/feed_repository_impl.dart';
import 'package:flutter_frontend/shared/models/activity_model.dart';

class FeedScreen extends StatefulWidget {
  const FeedScreen({super.key});

  @override
  State<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends State<FeedScreen> {
  final FeedRepositoryImpl _repository = FeedRepositoryImpl();
  List<ActivityModel> _activities = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadFeed();
  }

  Future<void> _loadFeed() async {
    _isLoading = true;
    setState(() {});
    try {
      _activities = await _repository.getFeed();
    } catch (e) {
      _error = extractErrorMessage(e);
    }
    _isLoading = false;
    if (mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Feed')),
      body: _isLoading
          ? const LoadingIndicator()
          : _error != null
              ? AppErrorWidget(message: _error!, onRetry: _loadFeed)
              : RefreshIndicator(
                  onRefresh: _loadFeed,
                  child: _activities.isEmpty
                      ? const Center(child: Text('No activity yet', style: TextStyle(color: AppColors.textSecondary)))
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          itemCount: _activities.length,
                          itemBuilder: (context, index) {
                            return _buildActivityCard(_activities[index]);
                          },
                        ),
                ),
    );
  }

  Widget _buildActivityCard(ActivityModel activity) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(12),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(12),
        leading: GestureDetector(
          onTap: () => context.push('/profile/${activity.username}'),
          child: CircleAvatar(
            radius: 20,
            backgroundImage: activity.userAvatar != null
                ? CachedNetworkImageProvider(getImageUrl(activity.userAvatar!, size: 'w200'))
                : null,
            child: activity.userAvatar == null ? const Icon(Icons.person) : null,
          ),
        ),
        title: GestureDetector(
          onTap: () => context.push('/profile/${activity.username}'),
          child: RichText(
            text: TextSpan(
              children: [
                TextSpan(
                  text: activity.username,
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                TextSpan(
                  text: _getActivityText(activity.type),
                  style: const TextStyle(color: AppColors.textSecondary),
                ),
              ],
            ),
          ),
        ),
        subtitle: activity.content != null
            ? Text(
                activity.content!,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(color: AppColors.textHint, fontSize: 12),
              )
            : null,
        trailing: activity.moviePoster != null
            ? ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: CachedNetworkImage(
                  imageUrl: getImageUrl(activity.moviePoster!, size: 'w200'),
                  height: 50,
                  width: 35,
                  fit: BoxFit.cover,
                  placeholder: (_, __) => Container(color: AppColors.shimmerBase),
                  errorWidget: (_, __, ___) => Container(color: AppColors.shimmerBase),
                ),
              )
            : null,
        onTap: () {
          if (activity.movieId != null) {
            context.push('/movies/${activity.movieId}');
          }
        },
      ),
    );
  }

  String _getActivityText(String type) {
    switch (type) {
      case 'REVIEWED_MOVIE':
        return ' wrote a review';
      case 'WATCHED_MOVIE':
        return ' watched a movie';
      case 'LIKED_MOVIE':
        return ' liked a movie';
      case 'FOLLOWED_USER':
        return ' started following';
      case 'ADDED_TO_LIST':
        return ' added to list';
      default:
        return ' posted';
    }
  }
}
