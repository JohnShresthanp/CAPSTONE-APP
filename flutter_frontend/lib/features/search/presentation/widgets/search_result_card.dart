import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_frontend/core/theme/colors.dart';
import 'package:flutter_frontend/core/utils/helpers.dart';
import 'package:flutter_frontend/shared/models/movie_model.dart';

class SearchResultCard extends StatelessWidget {
  final MovieModel movie;
  final VoidCallback? onTap;

  const SearchResultCard({super.key, required this.movie, this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        decoration: BoxDecoration(
          color: AppColors.cardBackground,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.horizontal(left: Radius.circular(12)),
              child: CachedNetworkImage(
                imageUrl: getImageUrl(movie.posterPath, size: 'w200'),
                height: 100,
                width: 70,
                fit: BoxFit.cover,
                placeholder: (_, __) => Container(color: AppColors.shimmerBase),
                errorWidget: (_, __, ___) => Container(
                  color: AppColors.shimmerBase,
                  child: const Icon(Icons.movie, color: AppColors.textHint),
                ),
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      movie.title,
                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.star, size: 14, color: AppColors.ratingStar),
                        const SizedBox(width: 4),
                        Text(
                          formatRating(movie.voteAverage),
                          style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                        ),
                        const SizedBox(width: 12),
                        if (movie.releaseDate != null)
                          Text(
                            movie.releaseDate!.substring(0, 4),
                            style: const TextStyle(color: AppColors.textHint, fontSize: 13),
                          ),
                      ],
                    ),
                    if (movie.overview != null && movie.overview!.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        movie.overview!,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: AppColors.textHint, fontSize: 12),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
