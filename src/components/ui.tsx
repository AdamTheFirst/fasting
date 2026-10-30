import type { ReactNode } from 'react';
import {
  Pressable,
  type PressableProps,
  ScrollView,
  type ScrollViewProps,
  type StyleProp,
  StyleSheet,
  Switch,
  Text,
  type TextProps,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { font, layout, radius, serif, space, tabular, useColors } from '../theme';
import { BrandMark, Icon, type IconName } from './Icon';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'quiet';

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  icon,
  block,
  caption,
  style,
  ...rest
}: {
  label: string;
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
  icon?: IconName;
  /** Stretch to the full width of its parent. */
  block?: boolean;
  /** A second, smaller line under the label (lg only). */
  caption?: string;
  style?: StyleProp<ViewStyle>;
} & Omit<PressableProps, 'children' | 'style'>) {
  const c = useColors();
  const bg = {
    primary: c.accent,
    secondary: c.surface2,
    ghost: 'transparent',
    quiet: c.accentSubtle,
    danger: 'transparent',
  }[variant];
  const fg = { primary: c.onAccent, secondary: c.text, ghost: c.accent, quiet: c.accent, danger: c.danger }[
    variant
  ];
  const height = { sm: 36, md: 48, lg: caption ? 68 : 60 }[size];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={caption ? `${label}. ${caption}` : label}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: bg,
          minHeight: Math.max(height, size === 'sm' ? 36 : layout.minTapTarget),
          paddingHorizontal: size === 'sm' ? space[3] : space[5],
          alignSelf: block ? 'stretch' : 'center',
        },
        variant === 'danger' && { borderWidth: 1, borderColor: c.danger },
        pressed && { opacity: 0.85, transform: [{ scale: 0.985 }] },
        rest.disabled && { opacity: 0.4 },
        style,
      ]}
      {...rest}
    >
      <View style={styles.buttonRow}>
        {icon ? <Icon name={icon} size={size === 'sm' ? 18 : 20} color={fg} /> : null}
        <Text
          style={[
            size === 'lg' ? font.lg : size === 'sm' ? font.sm : font.md,
            { color: fg, fontWeight: '600' },
          ]}
        >
          {label}
        </Text>
      </View>
      {caption ? <Text style={[font.xs, { color: fg, opacity: 0.8 }]}>{caption}</Text> : null}
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  accessibilityLabel,
  compact,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
  compact?: boolean;
}) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      onPress={onPress}
      hitSlop={compact ? 4 : 0}
      style={[
        styles.chip,
        compact && styles.chipCompact,
        {
          borderColor: selected ? c.accent : c.border,
          backgroundColor: selected ? c.accent : c.surface,
        },
      ]}
    >
      <Text style={[font.sm, { color: selected ? c.onAccent : c.text, fontWeight: '600' }]}>{label}</Text>
    </Pressable>
  );
}

/** One-of-a-few choice, e.g. 30 days / 90 days / Year. */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const c = useColors();
  return (
    <View accessibilityRole="radiogroup" style={[styles.segmented, { backgroundColor: c.surface2 }]}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.value)}
            style={[styles.segment, on && [styles.segmentOn, { backgroundColor: c.surface }]]}
          >
            <Text style={[font.sm, { color: on ? c.text : c.textMuted, fontWeight: '600' }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

type Tone = 'plain' | 'accent' | 'milestone' | 'hero';

export function Card({
  children,
  tone = 'plain',
  style,
  onPress,
  accessibilityLabel,
}: {
  children: ReactNode;
  tone?: Tone;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  const c = useColors();
  const bg = { plain: c.surface, accent: c.accentSubtle, milestone: c.milestoneSubtle, hero: c.hero }[tone];
  const border = tone === 'plain' ? c.border : 'transparent';
  const body = [styles.card, { backgroundColor: bg, borderColor: border }, style];
  if (!onPress) return <View style={body}>{children}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [body, pressed && { opacity: 0.9 }]}
    >
      {children}
    </Pressable>
  );
}

export function Body({ muted, style, ...rest }: TextProps & { muted?: boolean }) {
  const c = useColors();
  return <Text style={[font.md, { color: muted ? c.textMuted : c.text }, style]} {...rest} />;
}

/** Serif title text: screen titles, card headings and big numbers. */
export function Title({
  size = 'xl',
  style,
  color,
  ...rest
}: TextProps & { size?: keyof typeof font; color?: string }) {
  const c = useColors();
  return (
    <Text
      accessibilityRole="header"
      style={[font[size], { color: color ?? c.text, fontFamily: serif, fontWeight: '600' }, style]}
      {...rest}
    />
  );
}

export function SectionHeader({ children, action }: { children: string; action?: ReactNode }) {
  const c = useColors();
  return (
    <View style={styles.sectionHeader}>
      <Text
        accessibilityRole="header"
        style={[font.xs, { color: c.textMuted, fontWeight: '700', letterSpacing: 0.8, flex: 1 }]}
      >
        {children.toUpperCase()}
      </Text>
      {action}
    </View>
  );
}

/** Label over a big number. */
export function Stat({
  label,
  value,
  unit,
  hint,
  color,
  mutedColor,
  align = 'left',
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  color?: string;
  mutedColor?: string;
  align?: 'left' | 'center';
}) {
  const c = useColors();
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}${unit ? ` ${unit}` : ''}${hint ? `. ${hint}` : ''}`}
      style={{ flex: 1, alignItems: align === 'center' ? 'center' : 'flex-start', gap: 2 }}
    >
      <Text style={[font.xs, { color: mutedColor ?? c.textMuted, fontWeight: '600' }]}>{label}</Text>
      <Text style={[font.xl, tabular, { color: color ?? c.text, fontFamily: serif, fontWeight: '600' }]}>
        {value}
        {unit ? <Text style={[font.sm, { color: mutedColor ?? c.textMuted }]}> {unit}</Text> : null}
      </Text>
      {hint ? <Text style={[font.xs, { color: mutedColor ?? c.textMuted }]}>{hint}</Text> : null}
    </View>
  );
}

/** An inset group of rows, like iOS Settings. */
export function ListGroup({ children, footer }: { children: ReactNode; footer?: string }) {
  const c = useColors();
  const items = (Array.isArray(children) ? children.flat() : [children]).filter(Boolean);
  return (
    <View style={{ gap: space[2] }}>
      <View style={[styles.group, { backgroundColor: c.surface, borderColor: c.border }]}>
        {items.map((child, i) => (
          <View
            key={i}
            style={i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }}
          >
            {child}
          </View>
        ))}
      </View>
      {footer ? (
        <Text style={[font.xs, { color: c.textMuted, paddingHorizontal: space[2] }]}>{footer}</Text>
      ) : null}
    </View>
  );
}

export function ListRow({
  icon,
  iconColor,
  label,
  detail,
  value,
  onPress,
  chevron,
  right,
  destructive,
  children,
}: {
  icon?: IconName;
  iconColor?: string;
  label: string;
  detail?: ReactNode;
  value?: string;
  onPress?: () => void;
  chevron?: boolean;
  right?: ReactNode;
  destructive?: boolean;
  children?: ReactNode;
}) {
  const c = useColors();
  const content = (
    <>
      <View style={styles.row}>
        {icon ? (
          <View style={[styles.rowIcon, { backgroundColor: c.accentSubtle }]}>
            <Icon name={icon} size={18} color={iconColor ?? c.accent} />
          </View>
        ) : null}
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[font.md, { color: destructive ? c.danger : c.text, fontWeight: '500' }]}>
            {label}
          </Text>
          {typeof detail === 'string' ? (
            <Text style={[font.sm, { color: c.textMuted }]}>{detail}</Text>
          ) : (
            detail
          )}
        </View>
        {value ? <Text style={[font.md, tabular, { color: c.textMuted }]}>{value}</Text> : null}
        {right}
        {chevron ? <Icon name="chevron" size={18} color={c.textFaint} /> : null}
      </View>
      {children}
    </>
  );
  if (!onPress) return <View style={styles.rowWrap}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.rowWrap, pressed && { backgroundColor: c.surface2 }]}
    >
      {content}
    </Pressable>
  );
}

export function SwitchRow({
  icon,
  label,
  detail,
  value,
  onChange,
}: {
  icon?: IconName;
  label: string;
  detail?: ReactNode;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const c = useColors();
  // The whole row toggles, not only the small switch.
  return (
    <ListRow
      icon={icon}
      label={label}
      detail={detail}
      onPress={() => onChange(!value)}
      right={
        <Switch
          accessibilityLabel={label}
          value={value}
          onValueChange={onChange}
          trackColor={{ false: c.border, true: c.accentSoft }}
          thumbColor={value ? c.accent : c.surface}
          ios_backgroundColor={c.border}
        />
      }
    />
  );
}

export function Badge({
  label,
  tone = 'accent',
}: {
  label: string;
  tone?: 'accent' | 'milestone' | 'muted';
}) {
  const c = useColors();
  const bg = { accent: c.accentSubtle, milestone: c.milestoneSubtle, muted: c.surface2 }[tone];
  const fg = { accent: c.accent, milestone: c.milestone, muted: c.textMuted }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[font.xs, { color: fg, fontWeight: '700' }]}>{label}</Text>
    </View>
  );
}

/**
 * Every tab screen: safe area, the brand mark, a serif title and an optional
 * right-hand action, then scrolling content.
 */
export function Screen({
  title,
  eyebrow,
  right,
  children,
  scroll = true,
  ...rest
}: {
  title: string;
  eyebrow?: string;
  right?: ReactNode;
  children: ReactNode;
  scroll?: boolean;
} & ScrollViewProps) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const header = (
    <View style={[styles.header, { paddingTop: insets.top + space[3] }]}>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={styles.eyebrow}>
          <BrandMark size={14} color={c.accent} bleed={false} />
          <Text style={[font.xs, { color: c.textMuted, fontWeight: '700', letterSpacing: 0.8 }]}>
            {(eyebrow ?? 'fastaway').toUpperCase()}
          </Text>
        </View>
        <Title size="xl">{title}</Title>
      </View>
      {right}
    </View>
  );
  if (!scroll)
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        {header}
        <View style={styles.content}>{children}</View>
      </View>
    );
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{ paddingBottom: space[12] }}
      keyboardShouldPersistTaps="handled"
      {...rest}
    >
      {header}
      <View style={styles.content}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonRow: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  chip: {
    height: 40,
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: space[4],
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipCompact: { height: 34, minWidth: 34, paddingHorizontal: space[2] },
  segmented: { flexDirection: 'row', borderRadius: radius.md, padding: 3 },
  segment: {
    flex: 1,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md - 3,
  },
  segmentOn: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space[5],
    gap: space[3],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: space[4],
    paddingHorizontal: space[1],
  },
  group: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  rowWrap: {
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    minHeight: 56,
    justifyContent: 'center',
    gap: space[3],
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  rowIcon: { width: 32, height: 32, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: space[2],
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: layout.gutter,
    paddingBottom: space[4],
    gap: space[3],
  },
  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  content: { paddingHorizontal: layout.gutter, gap: space[3] },
});
