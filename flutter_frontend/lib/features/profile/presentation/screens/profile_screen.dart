import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_frontend/core/theme/colors.dart';
import 'package:flutter_frontend/core/utils/error_handler.dart';
import 'package:flutter_frontend/core/utils/helpers.dart';
import 'package:flutter_frontend/core/widgets/loading_indicator.dart';
import 'package:flutter_frontend/core/widgets/error_widget.dart';
import 'package:flutter_frontend/features/profile/data/repository/profile_repository_impl.dart';
import 'package:flutter_frontend/features/reviews/data/repository/review_repository_impl.dart';
import 'package:flutter_frontend/features/lists/data/repository/list_repository_impl.dart';
import 'package:flutter_frontend/shared/models/review_model.dart';
import 'package:flutter_frontend/shared/models/list_model.dart';
import 'package:flutter_frontend/shared/models/user_model.dart';

class ProfileScreen extends StatefulWidget {
  final String? username;

  const ProfileScreen({super.key, this.username});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final ProfileRepositoryImpl _repository = ProfileRepositoryImpl();
  final ReviewRepositoryImpl _reviewRepository = ReviewRepositoryImpl();
  final ListRepositoryImpl _listRepository = ListRepositoryImpl();
  UserModel? _user;
  bool _isLoading = true;
  String? _error;
  bool _followToggling = false;
  List<ReviewModel> _reviews = [];
  List<ListModel> _lists = [];

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    _isLoading = true;
    setState(() {});
    try {
      _user = await _repository.getProfile(widget.username);
      if (widget.username != null) {
        _reviews = await _reviewRepository.getUserReviews(widget.username!);
        _lists = await _listRepository.getUserLists(widget.username!);
      } else {
        _reviews = await _reviewRepository.getUserReviews(_user!.username);
        _lists = await _listRepository.getLists();
      }
    } catch (e) {
      _error = extractErrorMessage(e);
    }
    _isLoading = false;
    if (mounted) setState(() {});
  }

  Future<void> _toggleFollow() async {
    if (_user == null || _followToggling) return;
    setState(() => _followToggling = true);
    try {
      if (_user!.isFollowing) {
        await _repository.unfollowUser(_user!.username);
        _user = UserModel(
          id: _user!.id,
          username: _user!.username,
          email: _user!.email,
          displayName: _user!.displayName,
          avatarUrl: _user!.avatarUrl,
          bio: _user!.bio,
          role: _user!.role,
          isVerified: _user!.isVerified,
          isFollowing: false,
          followerCount: _user!.followerCount - 1,
          followingCount: _user!.followingCount,
          reviewCount: _user!.reviewCount,
          listCount: _user!.listCount,
          createdAt: _user!.createdAt,
        );
      } else {
        await _repository.followUser(_user!.username);
        _user = UserModel(
          id: _user!.id,
          username: _user!.username,
          email: _user!.email,
          displayName: _user!.displayName,
          avatarUrl: _user!.avatarUrl,
          bio: _user!.bio,
          role: _user!.role,
          isVerified: _user!.isVerified,
          isFollowing: true,
          followerCount: _user!.followerCount + 1,
          followingCount: _user!.followingCount,
          reviewCount: _user!.reviewCount,
          listCount: _user!.listCount,
          createdAt: _user!.createdAt,
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(extractErrorMessage(e)), backgroundColor: AppColors.error),
        );
      }
    }
    _followToggling = false;
    if (mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final isOwnProfile = widget.username == null;
    return Scaffold(
      appBar: AppBar(
        title: Text(_user?.username ?? 'Profile'),
        actions: [
          if (isOwnProfile)
            IconButton(
              icon: const Icon(Icons.settings),
              onPressed: () => context.push('/settings'),
            ),
        ],
      ),
      body: _isLoading
          ? const LoadingIndicator()
          : _error != null
              ? AppErrorWidget(message: _error!, onRetry: _loadProfile)
              : RefreshIndicator(
                  onRefresh: _loadProfile,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    child: Column(
                      children: [
                        const SizedBox(height: 24),
                        GestureDetector(
                          onTap: _user?.avatarUrl != null && isOwnProfile
                              ? () {} // TODO: change avatar
                              : null,
                          child: CircleAvatar(
                            radius: 50,
                            backgroundImage: _user?.avatarUrl != null
                                ? CachedNetworkImageProvider(getImageUrl(_user!.avatarUrl!, size: 'w300'))
                                : null,
                            child: _user?.avatarUrl == null ? const Icon(Icons.person, size: 50) : null,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          _user?.displayName ?? _user?.username ?? '',
                          style: Theme.of(context).textTheme.displaySmall,
                        ),
                        if (_user?.bio != null && _user!.bio!.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 32),
                            child: Text(
                              _user!.bio!,
                              textAlign: TextAlign.center,
                              style: const TextStyle(color: AppColors.textSecondary),
                            ),
                          ),
                        ],
                        const SizedBox(height: 16),
                        if (!isOwnProfile)
                          SizedBox(
                            width: 200,
                            child: OutlinedButton.icon(
                              onPressed: _followToggling ? null : _toggleFollow,
                              icon: Icon(_user!.isFollowing ? Icons.person_remove : Icons.person_add),
                              label: Text(_user!.isFollowing ? 'Unfollow' : 'Follow'),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: _user!.isFollowing ? AppColors.textSecondary : AppColors.primary,
                                side: BorderSide(
                                  color: _user!.isFollowing ? AppColors.divider : AppColors.primary,
                                ),
                              ),
                            ),
                          ),
                        const SizedBox(height: 24),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                          children: [
                            _buildStatColumn('Reviews', _user?.reviewCount.toString() ?? '0'),
                            _buildStatColumn('Lists', _user?.listCount.toString() ?? '0'),
                            _buildStatColumn('Followers', _user?.followerCount.toString() ?? '0'),
                            _buildStatColumn('Following', _user?.followingCount.toString() ?? '0'),
                          ],
                        ),
                        const SizedBox(height: 24),
                        if (_reviews.isNotEmpty) ...[
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            child: Text('Recent Reviews', style: Theme.of(context).textTheme.displaySmall),
                          ),
                          const SizedBox(height: 12),
                          ..._reviews.take(3).map((r) => _buildReviewCard(r)),
                          const SizedBox(height: 16),
                        ],
                        if (_user?.likedMovies.isNotEmpty == true) ...[
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            child: Text('Liked Movies', style: Theme.of(context).textTheme.displaySmall),
                          ),
                          const SizedBox(height: 12),
                          SizedBox(
                            height: 160,
                            child: ListView.builder(
                              scrollDirection: Axis.horizontal,
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              itemCount: _user!.likedMovies.length,
                              itemBuilder: (context, index) {
                                final movie = _user!.likedMovies[index];
                                return GestureDetector(
                                  onTap: () => context.push('/movies/${movie.id}'),
                                  child: Container(
                                    width: 100,
                                    margin: const EdgeInsets.only(right: 10),
                                    child: Column(
                                      children: [
                                        ClipRRect(
                                          borderRadius: BorderRadius.circular(8),
                                          child: movie.posterUrl != null
                                              ? CachedNetworkImage(
                                                  imageUrl: getImageUrl(movie.posterUrl!, size: 'w200'),
                                                  height: 120,
                                                  width: 100,
                                                  fit: BoxFit.cover,
                                                  placeholder: (_, __) => Container(color: AppColors.shimmerBase, height: 120, width: 100),
                                                  errorWidget: (_, __, ___) => Container(
                                                    color: AppColors.shimmerBase,
                                                    height: 120,
                                                    width: 100,
                                                    child: const Icon(Icons.movie, color: AppColors.textHint),
                                                  ),
                                                )
                                              : Container(
                                                  color: AppColors.shimmerBase,
                                                  height: 120,
                                                  width: 100,
                                                  child: const Icon(Icons.movie, color: AppColors.textHint),
                                                ),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          movie.title,
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                          textAlign: TextAlign.center,
                                          style: const TextStyle(fontSize: 11),
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
                          const SizedBox(height: 16),
                        ],
                        if (_lists.isNotEmpty) ...[
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text('Lists', style: Theme.of(context).textTheme.displaySmall),
                                if (_lists.length > 3)
                                  TextButton(
                                    onPressed: () => context.push('/user-lists/${_user!.username}'),
                                    child: const Text('View All'),
                                  ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 12),
                          ..._lists.take(3).map((l) => _buildListCard(l)),
                          const SizedBox(height: 16),
                        ],
                        const SizedBox(height: 24),
                      ],
                    ),
                  ),
                ),
    );
  }

  Widget _buildStatColumn(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
        ),
      ],
    );
  }

  Widget _buildReviewCard(ReviewModel r) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                r.movieTitle ?? 'Movie',
                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
              ),
              const Spacer(),
              ...List.generate(5, (i) {
                final star = i + 1;
                return Icon(
                  star <= r.rating ? Icons.star : Icons.star_border,
                  color: AppColors.ratingStar,
                  size: 14,
                );
              }),
            ],
          ),
          if (r.content.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              r.content,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildListCard(ListModel list) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 12),
        leading: Icon(
          list.isPublic ? Icons.public : Icons.lock_outline,
          color: AppColors.textSecondary,
          size: 20,
        ),
        title: Text(list.name, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 14)),
        subtitle: Text(
          '${list.movieCount} movies',
          style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
        ),
        trailing: const Icon(Icons.chevron_right, size: 20),
        onTap: () => context.push('/lists/${list.id}'),
      ),
    );
  }
}
