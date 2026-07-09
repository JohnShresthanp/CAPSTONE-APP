import { Platform } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'System',
  default: 'System',
});

export const typography = {
  h1: { fontFamily, fontSize: 28, fontWeight: '700', lineHeight: 34 },
  h2: { fontFamily, fontSize: 22, fontWeight: '700', lineHeight: 28 },
  h3: { fontFamily, fontSize: 18, fontWeight: '600', lineHeight: 24 },
  body: { fontFamily, fontSize: 15, fontWeight: '400', lineHeight: 22 },
  bodyBold: { fontFamily, fontSize: 15, fontWeight: '600', lineHeight: 22 },
  caption: { fontFamily, fontSize: 13, fontWeight: '400', lineHeight: 18 },
  captionBold: { fontFamily, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  small: { fontFamily, fontSize: 11, fontWeight: '400', lineHeight: 14 },
  smallBold: { fontFamily, fontSize: 11, fontWeight: '600', lineHeight: 14 },
  label: { fontFamily, fontSize: 11, fontWeight: '600', lineHeight: 14, letterSpacing: 0.5 },
  button: { fontFamily, fontSize: 15, fontWeight: '600', lineHeight: 20 },
} as const;
