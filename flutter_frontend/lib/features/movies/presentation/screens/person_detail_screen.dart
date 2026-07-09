import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_frontend/core/theme/colors.dart';
import 'package:flutter_frontend/core/utils/error_handler.dart';
import 'package:flutter_frontend/core/utils/helpers.dart';
import 'package:flutter_frontend/core/widgets/loading_indicator.dart';
import 'package:flutter_frontend/features/movies/data/datasource/movie_remote_datasource.dart';
import 'package:flutter_frontend/shared/models/movie_model.dart';

class PersonDetailScreen extends StatefulWidget {
  final String personId;

  const PersonDetailScreen({super.key, required this.personId});

  @override
  State<PersonDetailScreen> createState() => _PersonDetailScreenState();
}

class _PersonDetailScreenState extends State<PersonDetailScreen> {
  final MovieRemoteDataSource _dataSource = MovieRemoteDataSource();
  Map<String, dynamic>? _person;
  List<MovieModel> _credits = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    _isLoading = true;
    setState(() {});
    try {
      final person = await _dataSource.getPersonDetail(widget.personId);
      final credits = await _dataSource.getPersonMovieCredits(widget.personId);
      _person = person;
      _credits = credits.map((e) => MovieModel.fromJson(e as Map<String, dynamic>)).toList();
    } catch (e) {
      _error = extractErrorMessage(e);
    }
    _isLoading = false;
    if (mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_person?['name'] as String? ?? 'Person Detail')),
      body: _isLoading
          ? const LoadingIndicator()
          : _error != null
              ? Center(child: Text(_error!))
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(16),
                            child: CachedNetworkImage(
                              imageUrl: getImageUrl(_person?['profile_path'] as String?),
                              height: 200,
                              width: 140,
                              fit: BoxFit.cover,
                              placeholder: (_, __) => Container(color: AppColors.shimmerBase),
                              errorWidget: (_, __, ___) => Container(
                                color: AppColors.shimmerBase,
                                height: 200,
                                child: const Icon(Icons.person, color: AppColors.textHint),
                              ),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  _person?['name'] as String? ?? '',
                                  style: Theme.of(context).textTheme.displaySmall,
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'Known for: ${_person?['known_for_department'] as String? ?? 'N/A'}',
                                  style: const TextStyle(color: AppColors.textSecondary),
                                ),
                                const SizedBox(height: 4),
                                if (_person?['birthday'] != null)
                                  Text(
                                    'Born: ${_person!['birthday']}',
                                    style: const TextStyle(color: AppColors.textSecondary),
                                  ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      if (_person?['biography'] != null && (_person!['biography'] as String).isNotEmpty) ...[
                        const SizedBox(height: 24),
                        Text('Biography', style: Theme.of(context).textTheme.displaySmall),
                        const SizedBox(height: 8),
                        Text(
                          _person!['biography'] as String,
                          style: const TextStyle(color: AppColors.textSecondary, height: 1.5),
                        ),
                      ],
                      const SizedBox(height: 24),
                      Text('Known For', style: Theme.of(context).textTheme.displaySmall),
                      const SizedBox(height: 12),
                      SizedBox(
                        height: 200,
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          itemCount: _credits.length,
                          itemBuilder: (context, index) {
                            final credit = _credits[index];
                            return GestureDetector(
                              onTap: () => context.push('/movies/${credit.id}'),
                              child: Container(
                                width: 120,
                                margin: const EdgeInsets.only(right: 8),
                                child: Column(
                                  children: [
                                    ClipRRect(
                                      borderRadius: BorderRadius.circular(12),
                                      child: CachedNetworkImage(
                                        imageUrl: getImageUrl(credit.posterPath, size: 'w200'),
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
                                    Text(credit.title, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 11), textAlign: TextAlign.center),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ),
    );
  }
}
