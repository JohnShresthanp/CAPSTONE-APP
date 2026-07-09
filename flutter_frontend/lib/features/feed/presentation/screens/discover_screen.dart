import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_frontend/core/theme/colors.dart';
import 'package:flutter_frontend/core/utils/error_handler.dart';
import 'package:flutter_frontend/core/utils/helpers.dart';
import 'package:flutter_frontend/core/widgets/loading_indicator.dart';
import 'package:flutter_frontend/core/widgets/error_widget.dart';
import 'package:flutter_frontend/features/feed/data/repository/feed_repository_impl.dart';
import 'package:flutter_frontend/features/profile/data/repository/profile_repository_impl.dart';
import 'package:flutter_frontend/shared/models/activity_model.dart';

class DiscoverScreen extends StatefulWidget {
  const DiscoverScreen({super.key});

  @override
  State<DiscoverScreen> createState() => _DiscoverScreenState();
}

class _DiscoverScreenState extends State<DiscoverScreen> {
  final FeedRepositoryImpl _feedRepository = FeedRepositoryImpl();
  final ProfileRepositoryImpl _profileRepository = ProfileRepositoryImpl();
  List<ActivityModel> _activities = [];
  bool _isLoading = true;
  String? _error;
  Set<int> _followToggling = {};
  Set<String> _followedUsers = {};

  @override
  void initState() {
    super.initState();
    _loadFeed();
  }

  Future<void> _loadFeed() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      _activities = await _feedRepository.getFeed();
    } catch (e) {
      _error = extractErrorMessage(e);
    }
    if (mounted) setState(() => _isLoading = false);
  }

  List<_UserCardData> _extractUsers() {
    final seen = <String>{};
    final users = <_UserCardData>[];
    for (final activity in _activities) {
      if (activity.username.isEmpty) continue;
      if (seen.add(activity.username)) {
        users.add(_UserCardData(
          username: activity.username,
          avatarUrl: activity.userAvatar,
          lastActivity: _getActivityText(activity.type),
          movieTitle: activity.movieTitle,
        ));
      }
    }
    return users;
  }

  Future<void> _toggleFollow(String username) async {
    if (_followToggling.contains(username.hashCode)) return;
    setState(() => _followToggling.add(username.hashCode));
    try {
      await _profileRepository.followUser(username);
      setState(() {
        if (_followedUsers.contains(username)) {
          _followedUsers.remove(username);
        } else {
          _followedUsers.add(username);
        }
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(extractErrorMessage(e)), backgroundColor: AppColors.error),
        );
      }
    }
    _followToggling.remove(username.hashCode);
    if (mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Discover People')),
      body: _isLoading
          ? const LoadingIndicator()
          : _error != null
              ? AppErrorWidget(message: _error!, onRetry: _loadFeed)
              : RefreshIndicator(
                  onRefresh: _loadFeed,
                  child: _buildUserList(),
                ),
    );
  }

  Widget _buildUserList() {
    final users = _extractUsers();
    if (users.isEmpty) {
      return const Center(
        child: Text('No activity yet. Follow some users to see them here.', style: TextStyle(color: AppColors.textSecondary)),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: users.length,
      itemBuilder: (context, index) => _buildUserCard(users[index]),
    );
  }

  Widget _buildUserCard(_UserCardData user) {
    final isFollowing = _followedUsers.contains(user.username);
    final isToggling = _followToggling.contains(user.username.hashCode);
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(12),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(12),
        leading: GestureDetector(
          onTap: () => context.push('/profile/${user.username}'),
          child: CircleAvatar(
            radius: 24,
            backgroundImage: user.avatarUrl != null
                ? CachedNetworkImageProvider(getImageUrl(user.avatarUrl!, size: 'w200'))
                : null,
            child: user.avatarUrl == null ? const Icon(Icons.person) : null,
          ),
        ),
        title: GestureDetector(
          onTap: () => context.push('/profile/${user.username}'),
          child: Text(user.username, style: const TextStyle(fontWeight: FontWeight.w600)),
        ),
        subtitle: Text(
          '${user.lastActivity}${user.movieTitle != null ? ' "${user.movieTitle}"' : ''}',
          style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        trailing: SizedBox(
          width: 90,
          child: OutlinedButton(
            onPressed: isToggling ? null : () => _toggleFollow(user.username),
            style: OutlinedButton.styleFrom(
              foregroundColor: isFollowing ? AppColors.textSecondary : AppColors.primary,
              side: BorderSide(color: isFollowing ? AppColors.divider : AppColors.primary),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            ),
            child: isToggling
                ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                : Text(isFollowing ? 'Following' : 'Follow', style: const TextStyle(fontSize: 12)),
          ),
        ),
      ),
    );
  }

  String _getActivityText(String type) {
    switch (type) {
      case 'REVIEWED_MOVIE':
        return 'Reviewed';
      case 'WATCHED_MOVIE':
        return 'Watched';
      case 'LIKED_MOVIE':
        return 'Liked';
      case 'FOLLOWED_USER':
        return 'Followed';
      case 'ADDED_TO_LIST':
        return 'Added to list';
      default:
        return 'Active';
    }
  }
}

class _UserCardData {
  final String username;
  final String? avatarUrl;
  final String lastActivity;
  final String? movieTitle;

  const _UserCardData({
    required this.username,
    this.avatarUrl,
    required this.lastActivity,
    this.movieTitle,
  });
}
