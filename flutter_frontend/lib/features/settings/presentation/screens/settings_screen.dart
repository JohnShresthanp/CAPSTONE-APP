import 'dart:io';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:dio/dio.dart' as dio_lib;
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_frontend/core/theme/colors.dart';
import 'package:flutter_frontend/core/providers/theme_provider.dart';
import 'package:flutter_frontend/core/utils/error_handler.dart';
import 'package:flutter_frontend/core/network/dio_client.dart';
import 'package:flutter_frontend/core/network/api_constants.dart';
import 'package:flutter_frontend/core/storage/secure_storage.dart';
import 'package:flutter_frontend/features/auth/presentation/providers/auth_provider.dart';
import 'dart:convert';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final AuthProvider _provider = AuthProvider();
  String _language = 'English';
  bool _emailNotifications = true;
  bool _pushNotifications = true;
  bool _profileVisible = true;

  @override
  void initState() {
    super.initState();
    _provider.addListener(() {
      if (mounted) setState(() {});
    });
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _language = prefs.getString('language') ?? 'English';
      _emailNotifications = prefs.getBool('emailNotifications') ?? true;
      _pushNotifications = prefs.getBool('pushNotifications') ?? true;
      _profileVisible = prefs.getBool('profileVisible') ?? true;
    });
  }

  Future<void> _saveSetting(String key, dynamic value) async {
    final prefs = await SharedPreferences.getInstance();
    if (value is bool) {
      await prefs.setBool(key, value);
    } else if (value is String) {
      await prefs.setString(key, value);
    }
  }

  @override
  void dispose() {
    _provider.dispose();
    super.dispose();
  }

  Future<void> _signOut() async {
    await _provider.logout();
    if (mounted) context.go('/login');
  }

  File? _pickedAvatar;

  Future<void> _pickAvatar() async {
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      builder: (ctx) => SafeArea(
        child: Wrap(
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: const Text('Camera'),
              onTap: () => Navigator.pop(ctx, ImageSource.camera),
            ),
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('Gallery'),
              onTap: () => Navigator.pop(ctx, ImageSource.gallery),
            ),
          ],
        ),
      ),
    );
    if (source == null) return;
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: source, maxWidth: 512, maxHeight: 512, imageQuality: 80);
    if (picked != null) {
      setState(() => _pickedAvatar = File(picked.path));
    }
  }

  String _getAvatarUrl(Map<String, dynamic> userData) {
    final avatarUrl = userData['avatar_url'] as String? ?? userData['avatarUrl'] as String?;
    if (avatarUrl == null || avatarUrl.isEmpty) return '';
    if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) return avatarUrl;
    if (avatarUrl.startsWith('/uploads/')) return 'http://10.0.2.2:3000$avatarUrl';
    return 'https://image.tmdb.org/t/p/w300$avatarUrl';
  }

  Future<void> _editProfile() async {
    final storage = SecureStorage();
    final userData = await storage.getUserData();
    if (userData == null) return;
    final data = Map<String, dynamic>.from(jsonDecode(userData) as Map);
    final currentUsername = data['username'] as String? ?? '';
    final currentBio = data['bio'] as String? ?? '';

    final usernameController = TextEditingController(text: currentUsername);
    final bioController = TextEditingController(text: currentBio);
    final formKey = GlobalKey<FormState>();

    _pickedAvatar = null;

    final result = await showDialog<Map<String, String>>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('Edit Profile'),
          content: Form(
            key: formKey,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  GestureDetector(
                    onTap: () async {
                      final source = await showModalBottomSheet<ImageSource>(
                        context: ctx,
                        builder: (sheetCtx) => SafeArea(
                          child: Wrap(
                            children: [
                              ListTile(
                                leading: const Icon(Icons.camera_alt),
                                title: const Text('Camera'),
                                onTap: () => Navigator.pop(sheetCtx, ImageSource.camera),
                              ),
                              ListTile(
                                leading: const Icon(Icons.photo_library),
                                title: const Text('Gallery'),
                                onTap: () => Navigator.pop(sheetCtx, ImageSource.gallery),
                              ),
                            ],
                          ),
                        ),
                      );
                      if (source == null) return;
                      final picker = ImagePicker();
                      final picked = await picker.pickImage(source: source, maxWidth: 512, maxHeight: 512, imageQuality: 80);
                      if (picked != null) {
                        setDialogState(() => _pickedAvatar = File(picked.path));
                      }
                    },
                    child: Stack(
                      children: [
                        CircleAvatar(
                          radius: 45,
                          backgroundImage: _pickedAvatar != null
                              ? FileImage(_pickedAvatar!)
                              : (_getAvatarUrl(data).isNotEmpty
                                  ? CachedNetworkImageProvider(_getAvatarUrl(data))
                                  : null) as ImageProvider?,
                          child: _pickedAvatar == null && _getAvatarUrl(data).isEmpty
                              ? const Icon(Icons.person, size: 45)
                              : null,
                        ),
                        Positioned(
                          bottom: 0,
                          right: 0,
                          child: Container(
                            padding: const EdgeInsets.all(6),
                            decoration: const BoxDecoration(
                              color: AppColors.primary,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.camera_alt, size: 18, color: Colors.white),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  TextFormField(
                    controller: usernameController,
                    decoration: const InputDecoration(labelText: 'Username'),
                    validator: (v) {
                      if (v == null || v.trim().isEmpty) return 'Username is required';
                      if (v.trim().length < 3) return 'Username must be at least 3 characters';
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: bioController,
                    decoration: const InputDecoration(labelText: 'Bio'),
                    maxLines: 3,
                  ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            TextButton(
              onPressed: () {
                if (formKey.currentState?.validate() ?? false) {
                  Navigator.pop(ctx, {
                    'username': usernameController.text.trim(),
                    'bio': bioController.text.trim(),
                  });
                }
              },
              child: const Text('Save'),
            ),
          ],
        ),
      ),
    );

    if (result != null) {
      try {
        final dio = DioClient();
        final formData = dio_lib.FormData.fromMap({
          'username': result['username'],
          'bio': result['bio'],
          if (_pickedAvatar != null)
            'avatar': await dio_lib.MultipartFile.fromFile(
              _pickedAvatar!.path,
              filename: 'avatar.jpg',
            ),
        });
        final response = await dio.upload(
          ApiConstants.updateProfile,
          data: formData,
        );
        final updatedData = response.data['data'];
        if (updatedData is Map) {
          await storage.saveUserData(jsonEncode(updatedData));
        }
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Profile updated'), backgroundColor: Colors.green),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(extractErrorMessage(e)), backgroundColor: AppColors.error),
          );
        }
      }
    }
  }

  void _showNotificationsSettings() {
    showModalBottomSheet(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Container(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Notification Settings', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 20),
              SwitchListTile(
                title: const Text('Email Notifications'),
                subtitle: const Text('Receive updates via email'),
                value: _emailNotifications,
                onChanged: (v) => setSheetState(() => _emailNotifications = v),
                activeColor: AppColors.primary,
              ),
              SwitchListTile(
                title: const Text('Push Notifications'),
                subtitle: const Text('Receive push notifications'),
                value: _pushNotifications,
                onChanged: (v) => setSheetState(() => _pushNotifications = v),
                activeColor: AppColors.primary,
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () async {
                    await _saveSetting('emailNotifications', _emailNotifications);
                    await _saveSetting('pushNotifications', _pushNotifications);
                    if (mounted) {
                      Navigator.pop(ctx);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Notification settings saved'), backgroundColor: Colors.green),
                      );
                    }
                  },
                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
                  child: const Text('Save', style: TextStyle(color: Colors.white)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showPrivacySettings() {
    showModalBottomSheet(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Container(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Privacy Settings', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 20),
              SwitchListTile(
                title: const Text('Public Profile'),
                subtitle: const Text('Allow others to see your profile'),
                value: _profileVisible,
                onChanged: (v) => setSheetState(() => _profileVisible = v),
                activeColor: AppColors.primary,
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () async {
                    await _saveSetting('profileVisible', _profileVisible);
                    if (mounted) {
                      Navigator.pop(ctx);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Privacy settings saved'), backgroundColor: Colors.green),
                      );
                    }
                  },
                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
                  child: const Text('Save', style: TextStyle(color: Colors.white)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showLanguageSelector() {
    final languages = ['English', 'Spanish', 'French', 'German', 'Japanese', 'Korean', 'Chinese'];
    showModalBottomSheet(
      context: context,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Select Language', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            ...languages.map((lang) => ListTile(
                  title: Text(lang),
                  trailing: _language == lang ? const Icon(Icons.check, color: AppColors.primary) : null,
                  onTap: () async {
                    await _saveSetting('language', lang);
                    setState(() => _language = lang);
                    if (mounted) {
                      Navigator.pop(ctx);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Language set to $lang'), backgroundColor: Colors.green),
                      );
                    }
                  },
                )),
          ],
        ),
      ),
    );
  }

  void _showAboutDialog() {
    showAboutDialog(
      context: context,
      applicationName: 'FilmMosaic',
      applicationVersion: '1.0.0',
      applicationIcon: const Icon(Icons.movie_creation_rounded, color: AppColors.primary, size: 48),
      children: const [
        Text('FilmMosaic is a movie tracking and social platform where you can discover, review, and share your favorite films with friends.'),
        SizedBox(height: 16),
        Text('Built with Flutter and Node.js'),
      ],
    );
  }

  void _showTermsOfService() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Terms of Service'),
        content: const SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('1. Acceptance of Terms', style: TextStyle(fontWeight: FontWeight.bold)),
              Text('By using FilmMosaic, you agree to these terms of service.'),
              SizedBox(height: 12),
              Text('2. User Accounts', style: TextStyle(fontWeight: FontWeight.bold)),
              Text('You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.'),
              SizedBox(height: 12),
              Text('3. User Content', style: TextStyle(fontWeight: FontWeight.bold)),
              Text('You retain ownership of content you post. By posting content, you grant FilmMosaic a license to use, display, and distribute your content.'),
              SizedBox(height: 12),
              Text('4. Community Guidelines', style: TextStyle(fontWeight: FontWeight.bold)),
              Text('Be respectful. No harassment, spam, or inappropriate content. We reserve the right to suspend accounts that violate these guidelines.'),
              SizedBox(height: 12),
              Text('5. Privacy', style: TextStyle(fontWeight: FontWeight.bold)),
              Text('We collect minimal data necessary to provide our services. We do not sell your personal information to third parties.'),
              SizedBox(height: 12),
              Text('6. Termination', style: TextStyle(fontWeight: FontWeight.bold)),
              Text('We may suspend or terminate your account at any time for violations of these terms.'),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Close')),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        children: [
          const _SectionHeader(title: 'Account'),
          ListTile(
            leading: const Icon(Icons.person_outline, color: AppColors.primary),
            title: const Text('Edit Profile'),
            trailing: const Icon(Icons.chevron_right),
            onTap: _editProfile,
          ),
          ListTile(
            leading: const Icon(Icons.notifications_outlined, color: AppColors.primary),
            title: const Text('Notifications'),
            trailing: const Icon(Icons.chevron_right),
            onTap: _showNotificationsSettings,
          ),
          ListTile(
            leading: const Icon(Icons.lock_outlined, color: AppColors.primary),
            title: const Text('Privacy'),
            trailing: const Icon(Icons.chevron_right),
            onTap: _showPrivacySettings,
          ),
          const Divider(),
          const _SectionHeader(title: 'Preferences'),
          Consumer<ThemeProvider>(
            builder: (context, themeProvider, _) {
              return SwitchListTile(
                secondary: Icon(
                  themeProvider.isDark ? Icons.dark_mode : Icons.light_mode,
                  color: AppColors.primary,
                ),
                title: const Text('Dark Mode'),
                value: themeProvider.isDark,
                onChanged: (v) => themeProvider.toggleTheme(v),
                activeColor: AppColors.primary,
              );
            },
          ),
          ListTile(
            leading: const Icon(Icons.language, color: AppColors.primary),
            title: const Text('Language'),
            subtitle: Text(_language),
            trailing: const Icon(Icons.chevron_right),
            onTap: _showLanguageSelector,
          ),
          const Divider(),
          const _SectionHeader(title: 'About'),
          ListTile(
            leading: const Icon(Icons.info_outline, color: AppColors.primary),
            title: const Text('About FilmMosaic'),
            trailing: const Icon(Icons.chevron_right),
            onTap: _showAboutDialog,
          ),
          ListTile(
            leading: const Icon(Icons.description_outlined, color: AppColors.primary),
            title: const Text('Terms of Service'),
            trailing: const Icon(Icons.chevron_right),
            onTap: _showTermsOfService,
          ),
          const Divider(),
          Padding(
            padding: const EdgeInsets.all(16),
            child: ElevatedButton.icon(
              onPressed: _signOut,
              icon: const Icon(Icons.logout),
              label: Text(_provider.isLoading ? 'Signing out...' : 'Sign Out'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.error,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;

  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Text(
        title,
        style: TextStyle(
          color: AppColors.primary,
          fontSize: 13,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}
