import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_frontend/core/auth_state.dart';
import 'package:flutter_frontend/features/auth/presentation/screens/login_screen.dart';
import 'package:flutter_frontend/features/home/presentation/screens/home_screen.dart';
import 'package:flutter_frontend/features/movies/presentation/screens/movie_detail_screen.dart';
import 'package:flutter_frontend/features/movies/presentation/screens/person_detail_screen.dart';
import 'package:flutter_frontend/features/search/presentation/screens/search_screen.dart';
import 'package:flutter_frontend/features/feed/presentation/screens/feed_screen.dart';
import 'package:flutter_frontend/features/lists/presentation/screens/lists_screen.dart';
import 'package:flutter_frontend/features/lists/presentation/screens/list_detail_screen.dart';
import 'package:flutter_frontend/features/lists/presentation/screens/user_lists_screen.dart';
import 'package:flutter_frontend/features/profile/presentation/screens/profile_screen.dart';
import 'package:flutter_frontend/features/settings/presentation/screens/settings_screen.dart';
import 'package:flutter_frontend/features/admin/presentation/screens/admin_screen.dart';

final GlobalKey<NavigatorState> _rootNavigatorKey = GlobalKey<NavigatorState>();

final List<String> _authRequiredPaths = ['/feed', '/lists', '/profile', '/settings', '/admin'];

final GoRouter appRouter = GoRouter(
  navigatorKey: _rootNavigatorKey,
  initialLocation: '/home',
  redirect: (context, state) {
    final isLoggedIn = AuthState.isAuthenticated;
    final location = state.uri.toString();

    if (_authRequiredPaths.any((p) => location == p || location.startsWith('$p/'))) {
      if (!isLoggedIn) return '/login';
    }

    if (location == '/login' && isLoggedIn) return '/home';

    return null;
  },
  routes: [
    GoRoute(
      path: '/login',
      name: 'login',
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: '/home',
      name: 'home',
      builder: (context, state) => const HomeScreen(),
    ),
    GoRoute(
      path: '/search',
      name: 'search',
      builder: (context, state) => const SearchScreen(),
    ),
    GoRoute(
      path: '/feed',
      name: 'feed',
      builder: (context, state) => const FeedScreen(),
    ),
    GoRoute(
      path: '/movies/:id',
      name: 'movieDetail',
      builder: (context, state) => MovieDetailScreen(
        movieId: state.pathParameters['id']!,
      ),
    ),
    GoRoute(
      path: '/person/:id',
      name: 'personDetail',
      builder: (context, state) => PersonDetailScreen(
        personId: state.pathParameters['id']!,
      ),
    ),
    GoRoute(
      path: '/lists',
      name: 'lists',
      builder: (context, state) => const ListsScreen(),
    ),
    GoRoute(
      path: '/lists/:id',
      name: 'listDetail',
      builder: (context, state) => ListDetailScreen(
        listId: state.pathParameters['id']!,
      ),
    ),
    GoRoute(
      path: '/user-lists/:username',
      name: 'userLists',
      builder: (context, state) => UserListsScreen(
        username: state.pathParameters['username']!,
      ),
    ),
    GoRoute(
      path: '/profile',
      name: 'profile',
      builder: (context, state) => const ProfileScreen(),
    ),
    GoRoute(
      path: '/profile/:username',
      name: 'userProfile',
      builder: (context, state) => ProfileScreen(
        username: state.pathParameters['username'],
      ),
    ),
    GoRoute(
      path: '/settings',
      name: 'settings',
      builder: (context, state) => const SettingsScreen(),
    ),
    GoRoute(
      path: '/admin',
      name: 'admin',
      builder: (context, state) => const AdminScreen(),
    ),
  ],
);
