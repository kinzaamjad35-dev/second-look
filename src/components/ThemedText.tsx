import { Text, TextStyle, StyleSheet } from 'react-native';

import { colors, typography } from '@/src/theme/tokens';

type TextType = 'title' | 'heading' | 'body' | 'small' | 'caption' | 'label';

interface ThemedTextProps {
  type?: TextType;
  style?: TextStyle | TextStyle[];
  children: React.ReactNode;
}

/**
 * Text component that uses the graveyard theme tokens.
 * Defaults to `body` variant.
 */
export function ThemedText({ type = 'body', style, children }: ThemedTextProps) {
  return (
    <Text style={[styles.base, styles[type], style as TextStyle]}>{children}</Text>
  );
}

const styles = StyleSheet.create({
  base: {
    color: colors.text,
  },
  title: typography.title,
  heading: typography.heading,
  body: typography.body,
  small: typography.small,
  caption: typography.caption,
  label: typography.label,
});
