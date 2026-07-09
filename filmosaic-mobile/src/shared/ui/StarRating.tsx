import { View, Text, Pressable } from 'react-native';

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: number;
  onPress?: (rating: number) => void;
  readonly?: boolean;
}

export function StarRating({ rating, max = 5, size = 16, onPress, readonly }: StarRatingProps) {
  return (
    <View style={{ flexDirection: 'row', gap: 2, alignItems: 'center' }}>
      {Array.from({ length: max }, (_, i) => {
        const star = i + 1;
        const filled = star <= rating;
        const half = !filled && star - 0.5 <= rating;

        const content = (
          <Text style={{ fontSize: size, color: filled || half ? '#D4A85C' : '#3A3A3C' }}>
            {filled || half ? '★' : '☆'}
          </Text>
        );

        if (readonly || !onPress) return <View key={star}>{content}</View>;

        return (
          <Pressable key={star} onPress={() => onPress(star)} style={{ padding: 2 }} hitSlop={4} accessibilityLabel={`${star} star`} accessibilityRole="button">
            {content}
          </Pressable>
        );
      })}
    </View>
  );
}
