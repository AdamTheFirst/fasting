import { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';

import { Body, Button, Chip, SectionHeader } from '../../components/ui';
import { APP_NAME } from '../../config/identity';
import { csvToFasts, fastsToCsv } from '../../domain/csv';
import { goalLabel, newId } from '../../domain/fast';
import {
  AUTOPHAGY_NOTE,
  BUILT_IN_MILESTONES,
  customMilestone,
  type MilestoneSource,
} from '../../domain/milestones';
import { health } from '../../services/health';
import { toggleWeekday } from '../../domain/settings';
import { pickCsv, shareCsv } from '../../services/files';
import { ensureNotificationPermission } from '../../services/notifications';
import { useStore } from '../../state/store';
import { font, layout, radius, space, useColors } from '../../theme';

// Monday first, in the phone's language.
const WEEKDAY_NAMES = Array.from({ length: 7 }, (_, i) =>
  new Date(2026, 0, 5 + i).toLocaleDateString(undefined, { weekday: 'long' }),
);
const WEEKDAY_LETTERS = WEEKDAY_NAMES.map((_, i) =>
  new Date(2026, 0, 5 + i).toLocaleDateString(undefined, { weekday: 'narrow' }),
);

function Toggle({
  label,
  hint,
  value,
  onChange,
  source,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  source?: MilestoneSource | null;
}) {
  const c = useColors();
  // The whole row toggles, not only the small switch.
  return (
    <Pressable style={styles.toggle} onPress={() => onChange(!value)} accessible={false}>
      <View style={{ flex: 1 }}>
        <Body>{label}</Body>
        {hint ? (
          <Body muted style={font.sm}>
            {hint}
          </Body>
        ) : null}
        {source ? (
          <Body
            accessibilityRole="link"
            style={[font.sm, { color: c.accent }]}
            onPress={() => void Linking.openURL(source.url)}
          >
            {source.label}
          </Body>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ false: c.border, true: c.accentSubtle }}
        thumbColor={value ? c.accent : c.surface}
        ios_backgroundColor={c.border}
      />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const {
    fasts,
    presets,
    settings,
    updateSettings,
    replaceAllFasts,
    addWeight,
    addHeight,
    savePreset,
    deletePreset,
  } = useStore();
  const c = useColors();
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [mHours, setMHours] = useState('');
  const [mNote, setMNote] = useState('');
  const [streakHours, setStreakHours] = useState(String(settings.streakMinHours));
  const ms = settings.milestones;

  const setMilestones = async (patch: Partial<typeof ms>) => {
    const next = { ...ms, ...patch };
    const anyOn =
      next.enabledIds.length > 0 || next.custom.length > 0 || next.notifyGoal || next.notifyPersonalBest;
    // Permission is asked the first time something is turned on, never at install.
    if (anyOn && !(await ensureNotificationPermission())) {
      Alert.alert(
        'Notifications are off for this app',
        'Turn them on in system settings to get milestone alerts.',
      );
    }
    await updateSettings({ milestones: next });
  };

  const addCustomMilestone = async () => {
    const m = customMilestone(Number(mHours.replace(',', '.')), mNote, newId());
    if (!m) return Alert.alert('Enter the hours as a number, like 36 or 4.5.');
    await setMilestones({ custom: [...ms.custom, m].sort((a, b) => a.hours - b.hours) });
    setMHours('');
    setMNote('');
  };

  const saveStreakHours = () => {
    const h = Number(streakHours.replace(',', '.'));
    if (h > 0 && h <= 24) void updateSettings({ streakMinHours: h });
    else setStreakHours(String(settings.streakMinHours));
  };

  const confirmDeletePreset = (id: string, name: string) =>
    Alert.alert(`Delete the preset "${name}"?`, 'Past fasts keep their goal.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void deletePreset(id) },
    ]);

  const toggleHealth = async (on: boolean) => {
    if (on) {
      if (!(await health.isAvailable())) return Alert.alert(`${health.name} isn't available on this phone.`);
      if (!(await health.requestAccess()))
        return Alert.alert(`${APP_NAME} wasn't given access to ${health.name}.`);
    }
    await updateSettings({ healthSyncEnabled: on });
  };

  const saveWeight = async () => {
    const kg = Number(weight.replace(',', '.'));
    if (!(kg > 0)) return;
    const at = Date.now();
    await addWeight({ id: newId(), at, kg, source: 'manual' });
    if (settings.healthSyncEnabled) await health.writeWeight(kg, at).catch(() => {});
    setWeight('');
  };

  const saveHeight = async () => {
    const cm = Number(height.replace(',', '.'));
    if (!(cm > 0)) return;
    const at = Date.now();
    await addHeight({ id: newId(), at, m: cm / 100, source: 'manual' });
    if (settings.healthSyncEnabled) await health.writeHeight(cm / 100, at).catch(() => {});
    setHeight('');
  };

  const importCsv = async () => {
    const text = await pickCsv();
    if (text === null) return;
    try {
      const imported = csvToFasts(text);
      Alert.alert(`Replace your history with ${imported.length} fasts from this file?`, undefined, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Replace', style: 'destructive', onPress: () => void replaceAllFasts(imported) },
      ]);
    } catch (e) {
      Alert.alert(
        "Couldn't read that file. Nothing was changed.",
        e instanceof Error ? e.message : undefined,
      );
    }
  };

  const input = [
    font.md,
    styles.input,
    { color: c.text, borderColor: c.borderInput, backgroundColor: c.surface },
  ];

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <SectionHeader>Milestone alerts</SectionHeader>
      <Body muted style={font.sm}>
        All off unless you turn them on. Each says what is likely happening and links its source.
      </Body>
      {BUILT_IN_MILESTONES.map((m) => (
        <Toggle
          key={m.id}
          label={m.title}
          hint={m.body}
          source={m.source}
          value={ms.enabledIds.includes(m.id)}
          onChange={(on) =>
            void setMilestones({
              enabledIds: on ? [...ms.enabledIds, m.id] : ms.enabledIds.filter((x) => x !== m.id),
            })
          }
        />
      ))}
      <Toggle
        label="Goal reached"
        value={ms.notifyGoal}
        onChange={(v) => void setMilestones({ notifyGoal: v })}
      />
      <Toggle
        label="New longest fast"
        value={ms.notifyPersonalBest}
        onChange={(v) => void setMilestones({ notifyPersonalBest: v })}
      />
      <Body muted style={font.sm}>
        {AUTOPHAGY_NOTE}
      </Body>

      <SectionHeader>Your own milestones</SectionHeader>
      {ms.custom.map((m) => (
        <View key={m.id} style={styles.inline}>
          <View style={{ flex: 1 }}>
            <Body>{m.title}</Body>
            <Body muted style={font.sm}>
              {m.body}
            </Body>
          </View>
          <Button
            label="Remove"
            variant="ghost"
            onPress={() => void setMilestones({ custom: ms.custom.filter((x) => x.id !== m.id) })}
          />
        </View>
      ))}
      <View style={styles.inline}>
        <TextInput
          style={[input, styles.hours]}
          value={mHours}
          onChangeText={setMHours}
          placeholder="Hours"
          accessibilityLabel="Milestone hours"
          placeholderTextColor={c.textMuted}
          keyboardType="decimal-pad"
        />
        <TextInput
          style={input}
          value={mNote}
          onChangeText={setMNote}
          placeholder="Note (optional)"
          accessibilityLabel="Milestone note"
          placeholderTextColor={c.textMuted}
        />
        <Button label="Add" variant="secondary" onPress={() => void addCustomMilestone()} />
      </View>

      <SectionHeader>Long fasts</SectionHeader>
      <Toggle
        label="Show the safety card past 72 h"
        value={!settings.safetyCardDisabled}
        onChange={(v) => void updateSettings({ safetyCardDisabled: !v })}
      />

      <SectionHeader>Presets</SectionHeader>
      {presets.length === 0 ? (
        <Body muted style={font.sm}>
          Save one from the Custom goal on the Fast screen, or from any finished fast.
        </Body>
      ) : (
        presets.map((p) => (
          <View key={p.id} style={styles.preset}>
            <View style={styles.inline}>
              <TextInput
                style={input}
                defaultValue={p.name}
                accessibilityLabel={`Preset name, ${goalLabel(p.goal)}`}
                onEndEditing={(e) => {
                  const name = e.nativeEvent.text.trim();
                  if (name && name !== p.name) void savePreset({ ...p, name });
                }}
              />
              <Body muted style={[font.sm, styles.presetGoal]}>
                {goalLabel(p.goal)}
              </Body>
              <Button label="Delete" variant="ghost" onPress={() => confirmDeletePreset(p.id, p.name)} />
            </View>
            <View style={styles.days} accessibilityLabel={`Days that start on ${p.name}`}>
              {WEEKDAY_LETTERS.map((letter, day) => (
                <Chip
                  key={day}
                  label={letter}
                  accessibilityLabel={WEEKDAY_NAMES[day]}
                  selected={settings.weekdayPresets[day] === p.id}
                  onPress={() =>
                    void updateSettings({ weekdayPresets: toggleWeekday(settings.weekdayPresets, day, p.id) })
                  }
                />
              ))}
            </View>
          </View>
        ))
      )}
      {presets.length > 0 && (
        <Body muted style={font.sm}>
          Pick days to make a preset the Start screen&apos;s choice on those days. Optional.
        </Body>
      )}

      <SectionHeader>Streaks</SectionHeader>
      <View style={styles.inline}>
        <Body style={{ flex: 1 }}>A day counts toward a streak after this many hours fasted</Body>
        <TextInput
          style={[input, styles.hours]}
          value={streakHours}
          onChangeText={setStreakHours}
          onEndEditing={saveStreakHours}
          accessibilityLabel="Streak hours"
          keyboardType="decimal-pad"
        />
      </View>

      <SectionHeader>Weight and height</SectionHeader>
      <Toggle
        label={`Sync with ${health.name}`}
        hint="Reads and writes weight and height only."
        value={settings.healthSyncEnabled}
        onChange={(v) => void toggleHealth(v)}
      />
      <View style={styles.inline}>
        <TextInput
          style={input}
          value={weight}
          onChangeText={setWeight}
          placeholder="Weight (kg)"
          placeholderTextColor={c.textMuted}
          keyboardType="decimal-pad"
        />
        <Button label="Add" variant="secondary" onPress={() => void saveWeight()} />
      </View>
      <View style={styles.inline}>
        <TextInput
          style={input}
          value={height}
          onChangeText={setHeight}
          placeholder="Height (cm)"
          placeholderTextColor={c.textMuted}
          keyboardType="decimal-pad"
        />
        <Button label="Add" variant="secondary" onPress={() => void saveHeight()} />
      </View>
      <Toggle
        label="Show BMI chart"
        value={settings.showBmi}
        onChange={(v) => void updateSettings({ showBmi: v })}
      />

      <SectionHeader>Your data</SectionHeader>
      <Button
        label="Export CSV"
        variant="secondary"
        onPress={() => void shareCsv(`${APP_NAME.toLowerCase()}-fasts.csv`, fastsToCsv(fasts))}
      />
      <Button label="Import CSV" variant="secondary" onPress={() => void importCsv()} />
      <Body muted style={font.sm}>
        {APP_NAME} is a fasting log, not medical advice. Tracking is free, with no length limit.
      </Body>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: layout.gutter, gap: space[3], paddingBottom: space[12] },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: space[3], minHeight: 44 },
  inline: { flexDirection: 'row', gap: space[2], alignItems: 'center' },
  hours: { flex: 0, width: 80 },
  preset: { gap: space[2] },
  days: { flexDirection: 'row', flexWrap: 'wrap', gap: space[1] },
  presetGoal: { minWidth: 56, textAlign: 'right' },
  input: { flex: 1, height: 48, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: space[3] },
});
