import 'package:flutter/material.dart';
import 'package:flutter_frontend/core/theme/colors.dart';

class AdminScreen extends StatelessWidget {
  const AdminScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Admin Dashboard')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildStatCard('Total Users', '1,234', Icons.people, AppColors.primary),
          const SizedBox(height: 12),
          _buildStatCard('Total Movies', '567', Icons.movie, AppColors.accent),
          const SizedBox(height: 12),
          _buildStatCard('Total Reviews', '8,901', Icons.rate_review, AppColors.success),
          const SizedBox(height: 12),
          _buildStatCard('Reports', '23', Icons.flag, AppColors.warning),
          const SizedBox(height: 24),
          Text('Management', style: Theme.of(context).textTheme.displaySmall),
          const SizedBox(height: 12),
          ListTile(
            leading: const Icon(Icons.people_outline, color: AppColors.primary),
            title: const Text('Manage Users'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {},
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            tileColor: AppColors.cardBackground,
          ),
          const SizedBox(height: 8),
          ListTile(
            leading: const Icon(Icons.movie_outlined, color: AppColors.primary),
            title: const Text('Manage Movies'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {},
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            tileColor: AppColors.cardBackground,
          ),
          const SizedBox(height: 8),
          ListTile(
            leading: const Icon(Icons.flag_outlined, color: AppColors.primary),
            title: const Text('Manage Reports'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {},
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            tileColor: AppColors.cardBackground,
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: color.withOpacity(0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 28),
          ),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(value, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
              Text(title, style: const TextStyle(color: AppColors.textSecondary)),
            ],
          ),
        ],
      ),
    );
  }
}
