import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_frontend/core/theme/colors.dart';
import 'package:flutter_frontend/features/home/presentation/widgets/film_card.dart';
import 'package:flutter_frontend/shared/models/movie_model.dart';

class FilmRow extends StatelessWidget {
  final String title;
  final List<MovieModel> movies;
  final VoidCallback? onSeeAll;

  const FilmRow({
    super.key,
    required this.title,
    required this.movies,
    this.onSeeAll,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: Theme.of(context).textTheme.displaySmall,
              ),
              if (onSeeAll != null)
                TextButton(
                  onPressed: onSeeAll,
                  child: const Text(
                    'See All',
                    style: TextStyle(color: AppColors.primary, fontSize: 14),
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 270,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: movies.length,
            itemBuilder: (context, index) {
              return FilmCard(
                movie: movies[index],
                onTap: () => context.push('/movies/${movies[index].id}'),
              );
            },
          ),
        ),
      ],
    );
  }
}
