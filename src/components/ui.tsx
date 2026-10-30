import type { ReactNode } from 'react';
import { Pressable, type PressableProps, StyleSheet, Text, type TextProps, View } from 'react-native';

import { font, layout, radius, space, useColors } from '../theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  ...rest
}: { label: string; variant?: Variant; size?: 'md' | 'lg' } & Omit<PressableProps, 'children'>) {
  const c = useColors();
  const bg = { primary: c.accent, secondary: c.surface2, ghost: 'transparent', danger: c.danger }[variant];
  const fg = { primary: c.onAccent, secondary: c.text, ghost: c.accent, danger: c.onDanger }[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, minHeight: size === 'lg' ? 56 : layout.minTapTarget },
        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
        rest.disabled && { opacity: 0.4 },
      ]}
      {...rest}
    >
      <Text style={[font.md, { color: fg, fontWeight: '600' }]}>{label}</Text>
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.chip,
        {
          borderColor: selected ? c.accent : c.border,
          backgroundColor: selected ? c.accentSubtle : c.surface,
        },
      ]}
    >
      <Text style={[font.sm, { color: c.text, fontWeight: '500' }]}>{label}</Text>
    </Pressable>
  );
}

export function Card({ children }: { children: ReactNode }) {
  const c = useColors();
  return <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>{children}</View>;
}

export function Body({ muted, style, ...rest }: TextProps & { muted?: boolean }) {
  const c = useColors();
  return <Text style={[font.md, { color: muted ? c.textMuted : c.text }, style]} {...rest} />;
}

export function SectionHeader({ children }: { children: string }) {
  const c = useColors();
  return (
    <Text
      accessibilityRole="header"
      style={[font.xs, { color: c.textMuted, fontWeight: '600', letterSpacing: 0.5, marginTop: space[6] }]}
    >
      {children.toUpperCase()}
    </Text>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.full,
    paddingHorizontal: space[6],
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    height: 36,
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: space[4],
    justifyContent: 'center',
  },
  card: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space[4],
    gap: space[2],
  },
});
