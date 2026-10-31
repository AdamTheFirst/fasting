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

import {
  elevation,
  font,
  layout,
  medium,
  radius,
  space,
  strong,
  tabular,
  useColors,
  useIsDark,
} from '../theme';
import { press, tick } from '../services/haptics';
import { Icon, type IconName } from './Icon';

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
  // Pills only. The main action is solid ink; the second one is a raised white pill; the rest are
  // plain text. Pastels never carry a label.
  const bg = {
    primary: c.primary,
    secondary: c.surface,
    ghost: 'transparent',
    quiet: c.surface2,
    danger: c.surface2,
  }[variant];
  const fg = {
    primary: c.onPrimary,
    secondary: c.text,
    ghost: c.text,
    quiet: c.text,
    danger: c.danger,
  }[variant];
  const height = { sm: 40, md: 52, lg: caption ? 68 : 60 }[size];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={caption ? `${label}. ${caption}` : label}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: bg,
          minHeight: height,
          paddingHorizontal: size === 'sm' ? space[4] : space[6],
          alignSelf: block ? 'stretch' : 'center',
        },
        variant === 'secondary' && { ...elevation, shadowColor: c.shadow },
        pressed && { opacity: 0.75, transform: [{ scale: 0.985 }] },
        rest.disabled && { opacity: 0.4 },
        style,
      ]}
      {...rest}
      onPress={(e) => {
        if (variant === 'primary' || variant === 'secondary') press();
        rest.onPress?.(e);
      }}
    >
      <View style={styles.buttonRow}>
        {icon ? <Icon name={icon} size={size === 'sm' ? 18 : 20} color={fg} /> : null}
        <Text
          // Android drops an underline when only the colour changes (a theme switch); remount per colour.
          key={fg}
          style={[size === 'sm' ? font.sm : font.md, { color: fg, fontWeight: '600', letterSpacing: -0.2 }]}
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
      onPress={() => {
        tick();
        onPress();
      }}
      hitSlop={6}
      style={[
        styles.chip,
        compact && styles.chipCompact,
        selected
          ? { backgroundColor: c.primary }
          : { backgroundColor: c.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: c.borderInput },
      ]}
    >
      <Text style={[font.sm, medium, { color: selected ? c.onPrimary : c.text }]}>{label}</Text>
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
            onPress={() => {
              tick();
              onChange(o.value);
            }}
            style={[
              styles.segment,
              on && { backgroundColor: c.surface, ...elevation, shadowOpacity: 0.1, shadowColor: c.shadow },
            ]}
          >
            <Text style={[font.sm, { color: on ? c.text : c.textMuted, fontWeight: on ? '600' : '500' }]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

type Tone = 'plain' | 'accent' | 'period' | 'flat';

/** A white card on the oat background, lifted by one soft shadow. No gradients, no outlines. */
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
  const bg = { plain: c.surface, accent: c.accentSubtle, period: c.periodSubtle, flat: c.surface2 }[tone];
  const body = [
    styles.card,
    { backgroundColor: bg },
    tone === 'plain' && { ...elevation, shadowColor: c.shadow },
    style,
  ];
  if (!onPress) return <View style={body}>{children}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [body, pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] }]}
    >
      {children}
    </Pressable>
  );
}

export function Body({ muted, style, ...rest }: TextProps & { muted?: boolean }) {
  const c = useColors();
  return <Text style={[font.md, { color: muted ? c.textMuted : c.text }, style]} {...rest} />;
}

/** Title text: screen titles, card headings and big numbers. */
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
      style={[font[size], strong, { color: color ?? c.text }, style]}
      {...rest}
    />
  );
}

export function SectionHeader({ children, action }: { children: string; action?: ReactNode }) {
  const c = useColors();
  return (
    <View style={styles.sectionHeader}>
      <Text accessibilityRole="header" style={[font.xl, strong, { color: c.text, flex: 1 }]}>
        {children}
      </Text>
      {action}
    </View>
  );
}

/** The small caps label over an inset group, as in iOS Settings. */
export function GroupLabel({ children }: { children: string }) {
  const c = useColors();
  return (
    <Text accessibilityRole="header" style={[font.xs, styles.groupLabel, { color: c.textMuted }]}>
      {children.toUpperCase()}
    </Text>
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
      <Text style={[font.xs, medium, { color: mutedColor ?? c.textMuted }]}>{label}</Text>
      <Text style={[font['2xl'], tabular, { color: color ?? c.text, ...strong }]}>
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
      <View style={[styles.group, { backgroundColor: c.surface, ...elevation, shadowColor: c.shadow }]}>
        <View>
          {items.map((child, i) => (
            <View key={i}>
              {i > 0 && (
                <View
                  style={{
                    height: StyleSheet.hairlineWidth,
                    backgroundColor: c.border,
                    marginLeft: space[4],
                  }}
                />
              )}
              {child}
            </View>
          ))}
        </View>
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
            <Icon name={icon} size={18} color={iconColor ?? c.text} />
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
  const dark = useIsDark();
  // The whole row toggles, not only the small switch.
  return (
    <ListRow
      icon={icon}
      label={label}
      detail={detail}
      onPress={() => {
        tick();
        onChange(!value);
      }}
      right={
        <Switch
          accessibilityLabel={label}
          value={value}
          onValueChange={onChange}
          trackColor={{ false: c.border, true: c.primary }}
          thumbColor={value ? (dark ? c.bg : '#FFFFFF') : c.switchThumbOff}
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
  tone?: 'accent' | 'period' | 'muted' | 'estimate';
}) {
  const c = useColors();
  const bg = { accent: c.accentSubtle, period: c.periodSubtle, muted: c.surface2, estimate: c.surface2 }[
    tone
  ];
  const fg = { accent: c.text, period: c.text, muted: c.textMuted, estimate: c.textMuted }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[font.xs, { color: fg, fontWeight: '600' }]}>{label}</Text>
    </View>
  );
}

/**
 * Every tab screen: safe area, a title with an optional line under it and an optional
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
    <View style={[styles.header, { paddingTop: space[3] }]}>
      <View style={{ flex: 1, gap: 2 }}>
        {eyebrow ? (
          <Text style={[font.xs, styles.eyebrow, { color: c.textMuted }]}>{eyebrow.toUpperCase()}</Text>
        ) : null}
        <Title size="title">{title}</Title>
      </View>
      {right}
    </View>
  );
  // The status bar is transparent, so content stops below it instead of scrolling under the clock.
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
      {scroll ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: space[12] }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          {...rest}
        >
          {header}
          <View style={styles.content}>{children}</View>
        </ScrollView>
      ) : (
        <>
          {header}
          <View style={styles.content}>{children}</View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonRow: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  chip: {
    height: 44,
    borderRadius: radius.full,
    paddingHorizontal: space[4],
    flexDirection: 'row',
    gap: space[1],
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipCompact: { height: 36, minWidth: 36, paddingHorizontal: space[2] },
  segmented: { flexDirection: 'row', borderRadius: radius.full, padding: 4 },
  segment: {
    flex: 1,
    minHeight: 40,
    flexDirection: 'row',
    gap: space[1],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  card: {
    borderRadius: radius.xl,
    padding: space[5],
    gap: space[3],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: space[5],
    paddingHorizontal: space[1],
  },
  group: { borderRadius: radius.lg },
  rowWrap: {
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    minHeight: 56,
    justifyContent: 'center',
    gap: space[3],
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  rowIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: space[2],
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: layout.gutter,
    paddingBottom: space[5],
    gap: space[3],
  },
  content: { paddingHorizontal: layout.gutter, gap: space[4] },
  eyebrow: { fontWeight: '600', letterSpacing: 0.6 },
  groupLabel: {
    fontWeight: '600',
    letterSpacing: 0.6,
    marginTop: space[5],
    marginBottom: -space[2],
    paddingHorizontal: space[4],
  },
});
