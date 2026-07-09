import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_frontend/core/auth_state.dart';
import 'package:flutter_frontend/core/theme/app_theme.dart';
import 'package:flutter_frontend/core/providers/theme_provider.dart';
import 'package:flutter_frontend/core/storage/hive_service.dart';
import 'package:flutter_frontend/core/services/crashlytics_service.dart';
import 'package:flutter_frontend/features/auth/data/repository/auth_repository_impl.dart';
import 'package:flutter_frontend/routes/app_router.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  try {
    await HiveService.init();
  } catch (_) {}

  try {
    await CrashlyticsService.init();
  } catch (_) {}

  final repo = AuthRepositoryImpl();
  final user = await repo.getCurrentUser();
  AuthState.setAuthenticated(user != null);

  runApp(const FilmMosaicApp());
}

class FilmMosaicApp extends StatelessWidget {
  const FilmMosaicApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => ThemeProvider(),
      child: Consumer<ThemeProvider>(
        builder: (context, themeProvider, _) {
          return MaterialApp.router(
            title: 'FilmMosaic',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.lightTheme,
            darkTheme: AppTheme.darkTheme,
            themeMode: themeProvider.themeMode,
            routerConfig: appRouter,
          );
        },
      ),
    );
  }
}
