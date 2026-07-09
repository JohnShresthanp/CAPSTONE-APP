import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_frontend/core/theme/colors.dart';
import 'package:flutter_frontend/core/widgets/loading_indicator.dart';
import 'package:flutter_frontend/core/widgets/error_widget.dart';
import 'package:flutter_frontend/features/home/presentation/providers/home_provider.dart';
import 'package:flutter_frontend/features/home/presentation/widgets/film_row.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final HomeProvider _provider = HomeProvider();
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    _provider.addListener(() {
      if (mounted) setState(() {});
    });
    _provider.loadHomeData();
  }

  @override
  void dispose() {
    _provider.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            const Icon(Icons.movie_creation_rounded, color: AppColors.primary),
            const SizedBox(width: 8),
            Text(
              'FilmMosaic',
              style: TextStyle(
                color: AppColors.primary,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () => context.push('/search'),
          ),
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () {
              showDialog(
                context: context,
                builder: (ctx) => AlertDialog(
                  title: const Text('Notifications'),
                  content: const Text('No new notifications.'),
                  actions: [
                    TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('OK')),
                  ],
                ),
              );
            },
          ),
        ],
      ),
      body: _buildBody(),
      bottomNavigationBar: _buildBottomNav(),
    );
  }

  Widget _buildBody() {
    if (_provider.isLoading) {
      return const ShimmerCard();
    }

    if (_provider.error != null) {
      return AppErrorWidget(
        message: _provider.error!,
        onRetry: () => _provider.loadHomeData(),
      );
    }

    return RefreshIndicator(
      onRefresh: () => _provider.loadHomeData(),
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 16),
            if (_provider.nowPlaying.isNotEmpty)
              FilmRow(
                title: 'Now Playing',
                movies: _provider.nowPlaying,
                onSeeAll: () => context.push('/search'),
              ),
            const SizedBox(height: 24),
            if (_provider.popularMovies.isNotEmpty)
              FilmRow(
                title: 'Popular',
                movies: _provider.popularMovies,
                onSeeAll: () => context.push('/search'),
              ),
            const SizedBox(height: 24),
            if (_provider.trendingMovies.isNotEmpty)
              FilmRow(
                title: 'Trending',
                movies: _provider.trendingMovies,
                onSeeAll: () => context.push('/search'),
              ),
            const SizedBox(height: 24),
            if (_provider.topRated.isNotEmpty)
              FilmRow(
                title: 'Top Rated',
                movies: _provider.topRated,
                onSeeAll: () => context.push('/search'),
              ),
            const SizedBox(height: 80),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomNav() {
    return Container(
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: AppColors.divider)),
      ),
      child: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() => _currentIndex = index);
          switch (index) {
            case 0:
              break;
            case 1:
              context.push('/feed');
              break;
            case 2:
              context.push('/lists');
              break;
            case 3:
              context.push('/profile');
              break;
          }
        },
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.dynamic_feed), label: 'Feed'),
          BottomNavigationBarItem(icon: Icon(Icons.list), label: 'Lists'),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
    );
  }
}
