import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';

import { Body, Button, SectionHeader } from '../../components/ui';
import { APP_NAME } from '../../config/identity';
import { csvToFasts, fastsToCsv } from '../../domain/csv';
import { newId } from '../../domain/fast';
import { AUTOPHAGY_NOTE, BUILT_IN_MILESTONES } from '../../domain/milestones';
import { health } from '../../services/health';
import { pickCsv, shareCsv } from '../../services/files';
import { ensureNotificationPermission } from '../../services/notifications';
import { useStore } from '../../state/store';
import { font, layout, radius, space, useColors } from '../../theme';

function Toggle({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.toggle}>
      <View style={{ flex: 1 }}>
        <Body>{label}</Body>
        {hint ? (
          <Body muted style={font.sm}>
            {hint}
          </Body>
        ) : null}
      </View>
      <Switch accessibilityLabel={label} value={value} onValueChange={onChange} />
    </View>
  );
}

export default function SettingsScreen() {
  const { fasts, settings, updateSettings, replaceAllFasts, addWeight, addHeight } = useStore();
  const c = useColors();
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
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

      <SectionHeader>Long fasts</SectionHeader>
      <Toggle
        label="Show the safety card past 72 h"
        value={!settings.safetyCardDisabled}
        onChange={(v) => void updateSettings({ safetyCardDisabled: !v })}
      />

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
  input: { flex: 1, height: 48, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: space[3] },
});
