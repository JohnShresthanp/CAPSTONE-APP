import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_frontend/core/theme/colors.dart';

void main() {
  test('AppColors primary color is defined', () {
    expect(AppColors.primary, isNotNull);
  });

  test('AppColors secondary color is defined', () {
    expect(AppColors.secondary, isNotNull);
  });

  test('AppColors background color is defined', () {
    expect(AppColors.background, isNotNull);
  });

  test('AppColors textPrimary color is defined', () {
    expect(AppColors.textPrimary, isNotNull);
  });
}
