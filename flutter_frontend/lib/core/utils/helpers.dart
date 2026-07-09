String formatRating(double rating) {
  return (rating / 2).toStringAsFixed(1);
}

String formatVoteCount(int count) {
  if (count >= 1000000) {
    return '${(count / 1000000).toStringAsFixed(1)}M';
  } else if (count >= 1000) {
    return '${(count / 1000).toStringAsFixed(1)}K';
  }
  return count.toString();
}

String getImageUrl(String? path, {String size = 'w500'}) {
  if (path == null || path.isEmpty) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/uploads/')) return 'http://10.0.2.2:3000$path';
  return 'https://image.tmdb.org/t/p/$size$path';
}
