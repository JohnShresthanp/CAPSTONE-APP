import 'package:flutter/material.dart';
import 'package:flutter_frontend/core/theme/colors.dart';
import 'package:flutter_frontend/core/widgets/primary_button.dart';
import 'package:flutter_frontend/features/reviews/presentation/providers/review_provider.dart';

class ReviewBottomSheet extends StatefulWidget {
  final String movieId;
  final String movieTitle;
  final ReviewProvider provider;

  const ReviewBottomSheet({
    super.key,
    required this.movieId,
    required this.movieTitle,
    required this.provider,
  });

  @override
  State<ReviewBottomSheet> createState() => _ReviewBottomSheetState();
}

class _ReviewBottomSheetState extends State<ReviewBottomSheet> {
  int _rating = 5;
  final _bodyController = TextEditingController();
  bool _isSubmitting = false;

  @override
  void dispose() {
    _bodyController.dispose();
    super.dispose();
  }

  String _ratingLabel(int r) {
    if (r == 5) return 'Excellent';
    if (r == 4) return 'Great';
    if (r == 3) return 'Good';
    if (r == 2) return 'Fair';
    return 'Poor';
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(
        24,
        24,
        24,
        24 + MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Review: ${widget.movieTitle}',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Center(
            child: Column(
              children: [
                Text(
                  _ratingLabel(_rating),
                  style: Theme.of(context).textTheme.displaySmall?.copyWith(
                        color: AppColors.ratingStar,
                      ),
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: List.generate(5, (index) {
                    final star = index + 1;
                    return GestureDetector(
                      onTap: () => setState(() => _rating = star),
                      child: Icon(
                        star <= _rating ? Icons.star : Icons.star_border,
                        color: AppColors.ratingStar,
                        size: 42,
                      ),
                    );
                  }),
                ),
                Text(
                  '$_rating / 5',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          TextField(
            controller: _bodyController,
            maxLines: 5,
            maxLength: 5000,
            decoration: const InputDecoration(
              hintText: 'Write your review (optional)...',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 16),
          PrimaryButton(
            text: 'Submit Review',
            isLoading: _isSubmitting,
            onPressed: _isSubmitting ? null : _submitReview,
          ),
        ],
      ),
    );
  }

  Future<void> _submitReview() async {
    setState(() => _isSubmitting = true);
    final success = await widget.provider.createReview(
      widget.movieId,
      _rating.toDouble(),
      _bodyController.text.trim(),
    );
    if (!mounted) return;
    setState(() => _isSubmitting = false);

    if (success) {
      Navigator.pop(context, true);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Review submitted!')),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(widget.provider.error ?? 'Failed to submit review'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
}
