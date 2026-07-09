import { Pressable, PressableProps } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressableScaleProps extends PressableProps {
  scale?: number;
}

export function PressableScale({ children, scale = 0.96, ...props }: PressableScaleProps) {
  const animated = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: animated.value }],
  }));

  return (
    <AnimatedPressable
      onPressIn={() => { animated.value = withSpring(scale); }}
      onPressOut={() => { animated.value = withSpring(1); }}
      style={animatedStyle}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
}
