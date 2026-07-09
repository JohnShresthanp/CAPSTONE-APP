import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_frontend/core/theme/colors.dart';
import 'package:flutter_frontend/core/utils/error_handler.dart';
import 'package:flutter_frontend/core/utils/helpers.dart';
import 'package:flutter_frontend/core/widgets/loading_indicator.dart';
import 'package:flutter_frontend/core/widgets/error_widget.dart';
import 'package:flutter_frontend/core/widgets/primary_button.dart';
import 'package:flutter_frontend/core/storage/secure_storage.dart';
import 'package:flutter_frontend/features/lists/presentation/widgets/add_to_list_sheet.dart';
import 'package:flutter_frontend/features/lists/data/repository/list_repository_impl.dart';
import 'package:flutter_frontend/features/movies/presentation/providers/movie_provider.dart';
import 'package:flutter_frontend/features/reviews/presentation/providers/review_provider.dart';
import 'package:flutter_frontend/features/reviews/presentation/widgets/review_bottom_sheet.dart';
import 'package:flutter_frontend/features/reviews/presentation/widgets/comments_sheet.dart';
import 'package:flutter_frontend/shared/models/review_model.dart';

class MovieDetailScreen extends StatefulWidget {
  final String movieId;

  const MovieDetailScreen({super.key, required this.movieId});

  @override
  State<MovieDetailScreen> createState() => _MovieDetailScreenState();
}

class _MovieDetailScreenState extends State<MovieDetailScreen> {
  final MovieProvider _provider = MovieProvider();
  final ReviewProvider _reviewProvider = ReviewProvider();
  final ListRepositoryImpl _listRepository = ListRepositoryImpl();
  bool _isLiked = false;
  String? _likedListId;
  bool _likeLoading = false;

  @override
  void initState() {
    super.initState();
    _provider.addListener(() {
      if (mounted) setState(() {});
    });
    _reviewProvider.addListener(() {
      if (mounted) setState(() {});
    });
    _provider.loadMovieDetail(widget.movieId);
    _reviewProvider.loadMovieReviews(widget.movieId);
    _loadLikeState();
  }

  Future<void> _loadLikeState() async {
    final storage = SecureStorage();
    final userData = await storage.getUserData();
    if (userData == null) return;
    try {
      final lists = await _listRepository.getLists();
      final likedList = lists.where((l) => l.isSystem && l.name == 'Liked Movies').toList();
      if (likedList.isEmpty) return;
      _likedListId = likedList.first.id;
      final detail = await _listRepository.getListDetail(_likedListId!);
      if (detail.movies != null) {
        _isLiked = detail.movies!.any((m) => m.id == widget.movieId);
      }
      if (mounted) setState(() {});
    } catch (_) {}
  }

  Future<void> _toggleLike() async {
    if (_likedListId == null || _likeLoading) return;
    setState(() => _likeLoading = true);
    try {
      if (_isLiked) {
        await _listRepository.removeMovieFromList(_likedListId!, widget.movieId);
        _isLiked = false;
      } else {
        await _listRepository.addMovieToList(_likedListId!, widget.movieId);
        _isLiked = true;
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(extractErrorMessage(e)), backgroundColor: AppColors.error),
        );
      }
    }
    _likeLoading = false;
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    _provider.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _buildContent(),
    );
  }

  Widget _buildContent() {
    if (_provider.isLoading) {
      return const LoadingIndicator();
    }

    if (_provider.error != null) {
      return AppErrorWidget(
        message: _provider.error!,
        onRetry: () => _provider.loadMovieDetail(widget.movieId),
      );
    }

    final movie = _provider.movie;
    if (movie == null) return const SizedBox.shrink();

    return CustomScrollView(
      slivers: [
        SliverAppBar(
          expandedHeight: 300,
          pinned: true,
          flexibleSpace: FlexibleSpaceBar(
            background: Stack(
              fit: StackFit.expand,
              children: [
                CachedNetworkImage(
                  imageUrl: getImageUrl(movie.backdropPath, size: 'original'),
                  fit: BoxFit.cover,
                  placeholder: (_, __) => Container(color: AppColors.shimmerBase),
                  errorWidget: (_, __, ___) => Container(
                    color: AppColors.shimmerBase,
                    child: const Icon(Icons.movie, size: 64, color: AppColors.textHint),
                  ),
                ),
                Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.transparent,
                        AppColors.background.withOpacity(0.95),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => context.pop(),
          ),
          actions: [
            if (_likedListId != null)
              IconButton(
                icon: _likeLoading
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                    : Icon(
                        _isLiked ? Icons.favorite : Icons.favorite_border,
                        color: _isLiked ? AppColors.error : AppColors.textSecondary,
                      ),
                onPressed: _toggleLike,
              ),
          ],
        ),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  movie.title,
                  style: Theme.of(context).textTheme.displayMedium,
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(Icons.star, color: AppColors.ratingStar, size: 20),
                    const SizedBox(width: 4),
                    Text(
                      formatRating(movie.voteAverage),
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '(${formatVoteCount(movie.voteCount)})',
                      style: const TextStyle(color: AppColors.textSecondary),
                    ),
                    const SizedBox(width: 16),
                    if (movie.releaseDate != null)
                      Text(
                        movie.releaseDate!.substring(0, 4),
                        style: const TextStyle(color: AppColors.textSecondary),
                      ),
                  ],
                ),
                const SizedBox(height: 16),
                if (movie.genres != null && movie.genres!.isNotEmpty)
                  Wrap(
                    spacing: 8,
                    runSpacing: 4,
                    children: movie.genres!.map((genre) {
                      return Chip(
                        label: Text(genre, style: const TextStyle(fontSize: 12)),
                        materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        visualDensity: VisualDensity.compact,
                      );
                    }).toList(),
                  ),
                const SizedBox(height: 24),
                Text(
                  'Overview',
                  style: Theme.of(context).textTheme.displaySmall,
                ),
                const SizedBox(height: 8),
                Text(
                  movie.overview ?? 'No overview available.',
                  style: const TextStyle(color: AppColors.textSecondary, height: 1.5),
                ),
                const SizedBox(height: 24),
                PrimaryButton(
                  text: 'Write a Review',
                  onPressed: () => showModalBottomSheet(
                    context: context,
                    isScrollControlled: true,
                    builder: (_) => ReviewBottomSheet(
                      movieId: widget.movieId,
                      movieTitle: movie.title,
                      provider: _reviewProvider,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: () => showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      builder: (_) => AddToListSheet(movieId: widget.movieId),
                    ),
                    icon: const Icon(Icons.playlist_add),
                    label: const Text('Add to List'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      side: const BorderSide(color: AppColors.primary),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  'Reviews',
                  style: Theme.of(context).textTheme.displaySmall,
                ),
                const SizedBox(height: 12),
                if (_reviewProvider.isLoading)
                  const Center(child: Padding(padding: EdgeInsets.all(16), child: CircularProgressIndicator()))
                else if (_reviewProvider.reviews.isEmpty)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 16),
                    child: Text(
                      'No reviews yet. Be the first to review!',
                      style: TextStyle(color: AppColors.textSecondary),
                    ),
                  )
                else
                  ..._reviewProvider.reviews.map((r) => _buildReviewCard(context, r)),
                const SizedBox(height: 24),
                if (_provider.similarMovies.isNotEmpty) ...[
                  Text(
                    'Similar Movies',
                    style: Theme.of(context).textTheme.displaySmall,
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    height: 200,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      itemCount: _provider.similarMovies.length,
                      itemBuilder: (context, index) {
                        final similar = _provider.similarMovies[index];
                        return GestureDetector(
                          onTap: () => context.push('/movies/${similar.id}'),
                          child: Container(
                            width: 120,
                            margin: const EdgeInsets.only(right: 8),
                            child: Column(
                              children: [
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(12),
                                  child: CachedNetworkImage(
                                    imageUrl: getImageUrl(similar.posterPath, size: 'w200'),
                                    height: 160,
                                    width: 120,
                                    fit: BoxFit.cover,
                                    placeholder: (_, __) => Container(color: AppColors.shimmerBase),
                                    errorWidget: (_, __, ___) => Container(
                                      color: AppColors.shimmerBase,
                                      child: const Icon(Icons.movie, color: AppColors.textHint),
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  similar.title,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(fontSize: 11),
                                  textAlign: TextAlign.center,
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ],
                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildReviewCard(BuildContext context, ReviewModel r) {
    final stars = r.rating;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              GestureDetector(
                onTap: r.username != null ? () => context.push('/profile/${r.username}') : null,
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 16,
                      backgroundImage: r.userAvatar != null
                          ? NetworkImage(getImageUrl(r.userAvatar!, size: 'w100'))
                          : null,
                      child: r.userAvatar == null ? const Icon(Icons.person, size: 16) : null,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      r.username ?? 'Anonymous',
                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: List.generate(5, (i) {
                  final star = i + 1;
                  final filled = star <= stars;
                  final half = !filled && (star - 0.5) <= stars;
                  return Icon(
                    filled ? Icons.star : (half ? Icons.star_half : Icons.star_border),
                    color: AppColors.ratingStar,
                    size: 16,
                  );
                }),
              ),
            ],
          ),
          if (r.content.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              r.content,
              style: const TextStyle(color: AppColors.textSecondary, fontSize: 14, height: 1.4),
            ),
          ],
          const SizedBox(height: 12),
          Row(
            children: [
              GestureDetector(
                onTap: () => _reviewProvider.toggleLike(r.id),
                child: Row(
                  children: [
                    Icon(
                      r.isLiked ? Icons.favorite : Icons.favorite_border,
                      color: r.isLiked ? AppColors.error : AppColors.textSecondary,
                      size: 18,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${r.likeCount}',
                      style: TextStyle(
                        color: r.isLiked ? AppColors.error : AppColors.textSecondary,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              GestureDetector(
                onTap: () => showModalBottomSheet(
                  context: context,
                  isScrollControlled: true,
                  builder: (_) => CommentsSheet(reviewId: r.id, provider: _reviewProvider),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.comment_outlined, color: AppColors.textSecondary, size: 18),
                    const SizedBox(width: 4),
                    Text(
                      '${r.commentCount}',
                      style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
