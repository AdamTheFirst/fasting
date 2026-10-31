import type { ReactNode } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import type { MilestoneSource } from '../domain/milestones';
import { font, layout, radius, space, themes, type ThemeId, useColors, useIsDark } from '../theme';
import { Icon } from './Icon';
import { Button } from './ui';

/** A settings sub-page: the stack header carries the title, the groups scroll under it. */
export function SubPage({ children }: { children: ReactNode }) {
  const c = useColors();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={kit.page}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

export function Detail({ text, source }: { text?: string; source?: MilestoneSource | null }) {
  const c = useColors();
  return (
    <View style={{ gap: 2 }}>
      {text ? <Text style={[font.sm, { color: c.textMuted }]}>{text}</Text> : null}
      {source ? (
        <Text
          key={c.text}
          accessibilityRole="link"
          style={[font.xs, { color: c.text, textDecorationLine: 'underline' }]}
          onPress={() => void Linking.openURL(source.url)}
        >
          Source: {source.label}
        </Text>
      ) : null}
    </View>
  );
}

/** A theme with its real colours. */
export function ThemeRow({ id, selected, onPress }: { id: ThemeId; selected: boolean; onPress: () => void }) {
  const c = useColors();
  const dark = useIsDark();
  const t = themes[id][dark ? 'dark' : 'light'];
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${themes[id].name} theme`}
      onPress={onPress}
      style={({ pressed }) => [kit.themeRow, pressed && { backgroundColor: c.surface2 }]}
    >
      <View style={[kit.preview, { backgroundColor: t.accent }]}>
        <View style={[kit.previewDot, { backgroundColor: t.accentStrong }]} />
      </View>
      <Text style={[font.md, { color: c.text, flex: 1, fontWeight: '500' }]}>{themes[id].name}</Text>
      {selected ? <Icon name="check" size={22} color={c.text} /> : null}
    </Pressable>
  );
}

export function MeasureInput({
  label,
  unit,
  value,
  setValue,
  onSave,
}: {
  label: string;
  unit: string;
  value: string;
  setValue: (v: string) => void;
  onSave: () => Promise<void>;
}) {
  const c = useColors();
  return (
    <View style={kit.inline}>
      <TextInput
        style={[font.md, kit.input, { color: c.text, backgroundColor: c.surface2 }]}
        value={value}
        onChangeText={setValue}
        placeholder={`New ${label.toLowerCase()} (${unit})`}
        accessibilityLabel={`${label} in ${unit}`}
        placeholderTextColor={c.textFaint}
        keyboardType="decimal-pad"
        onSubmitEditing={() => void onSave()}
      />
      <Button label="Add" size="sm" variant="quiet" disabled={!value} onPress={() => void onSave()} />
    </View>
  );
}

export const kit = StyleSheet.create({
  page: { padding: layout.gutter, gap: space[4], paddingBottom: space[12] },
  inline: { flexDirection: 'row', gap: space[2], alignItems: 'center' },
  pad: { paddingHorizontal: space[4], paddingVertical: space[3] },
  hours: { flexGrow: 0, flexShrink: 0, flexBasis: 76, width: 76 },
  days: { flexDirection: 'row', flexWrap: 'wrap', gap: space[1] },
  input: {
    flex: 1,
    minWidth: 0,
    height: 48,
    borderRadius: radius.md,
    paddingHorizontal: space[4],
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    minHeight: 60,
  },
  preview: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  previewDot: { width: 12, height: 12, borderRadius: 6 },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
});
