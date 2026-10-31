import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { BrandMark, Icon } from '../../components/Icon';
import {
  Button,
  Chip,
  ListGroup,
  ListRow,
  Screen,
  SectionHeader,
  Segmented,
  SwitchRow,
} from '../../components/ui';
import { APP_NAME } from '../../config/identity';
import { fastsToCsv } from '../../domain/csv';
import { importFasts, mergeImported } from '../../domain/importers';
import { HELPLINE } from '../../domain/safety';
import { goalLabel, newId } from '../../domain/fast';
import {
  AUTOPHAGY_NOTE,
  BUILT_IN_MILESTONES,
  customMilestone,
  type MilestoneSource,
} from '../../domain/milestones';
import { toggleWeekday } from '../../domain/settings';
import { bmi } from '../../domain/stats';
import { pickCsv, shareCsv } from '../../services/files';
import { health } from '../../services/health';
import { ensureNotificationPermission } from '../../services/notifications';
import { useStore } from '../../state/store';
import {
  type Appearance,
  font,
  radius,
  space,
  strong,
  tabular,
  themes,
  type ThemeId,
  useColors,
  useIsDark,
} from '../../theme';

// Monday first, in the phone's language.
const WEEKDAY_NAMES = Array.from({ length: 7 }, (_, i) =>
  new Date(2026, 0, 5 + i).toLocaleDateString(undefined, { weekday: 'long' }),
);
const WEEKDAY_LETTERS = WEEKDAY_NAMES.map((_, i) =>
  new Date(2026, 0, 5 + i).toLocaleDateString(undefined, { weekday: 'narrow' }),
);

function Detail({ text, source }: { text?: string; source?: MilestoneSource | null }) {
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

/** A theme with its real colours, like Periodiary's theme list. */
function ThemeRow({ id, selected, onPress }: { id: ThemeId; selected: boolean; onPress: () => void }) {
  const c = useColors();
  const dark = useIsDark();
  const t = themes[id][dark ? 'dark' : 'light'];
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${themes[id].name} theme`}
      onPress={onPress}
      style={({ pressed }) => [styles.themeRow, pressed && { backgroundColor: c.surface2 }]}
    >
      <View style={[styles.preview, { backgroundColor: t.accent }]}>
        <View style={[styles.previewDot, { backgroundColor: t.accentStrong }]} />
      </View>
      <Text style={[font.md, { color: c.text, flex: 1, fontWeight: '500' }]}>{themes[id].name}</Text>
      <View
        style={[
          styles.radio,
          selected ? { backgroundColor: c.primary, borderColor: c.primary } : { borderColor: c.borderInput },
        ]}
      >
        {selected ? <Icon name="check" size={16} color={c.onPrimary} /> : null}
      </View>
    </Pressable>
  );
}

function MeasureInput({
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
    <View style={styles.inline}>
      <TextInput
        style={[font.md, styles.input, { color: c.text, backgroundColor: c.surface2 }]}
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

export default function SettingsScreen() {
  const {
    fasts,
    presets,
    weights,
    heights,
    settings,
    updateSettings,
    replaceAllFasts,
    addFasts,
    deleteEverything,
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
  const latestWeight = weights.at(-1);
  const latestHeight = heights.at(-1);
  const currentBmi = latestWeight && latestHeight ? bmi(latestWeight.kg, latestHeight.m) : null;

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
      const now = Date.now();
      const result = importFasts(text, now);
      if (result.source === 'fastaway') {
        Alert.alert(`Replace your history with ${result.fasts.length} fasts from this file?`, undefined, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Replace', style: 'destructive', onPress: () => void replaceAllFasts(result.fasts) },
        ]);
        return;
      }
      // Another app's file: add to your history, never replace it.
      const { added, duplicates } = mergeImported(fasts, result.fasts, now);
      const notes = [
        duplicates ? `${duplicates} already in your history.` : null,
        result.skipped.length ? `${result.skipped.length} rows without a usable time were skipped.` : null,
      ].filter(Boolean);
      if (added.length === 0) {
        Alert.alert('Nothing new to add from this file.', notes.join(' ') || undefined);
        return;
      }
      Alert.alert(
        `Add ${added.length} ${added.length === 1 ? 'fast' : 'fasts'} to your history?`,
        notes.join(' ') || undefined,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add', onPress: () => void addFasts(added) },
        ],
      );
    } catch (e) {
      Alert.alert(
        "Couldn't read that file. Nothing was changed.",
        e instanceof Error ? e.message : undefined,
      );
    }
  };

  const toggleSignals = async (on: boolean) => {
    if (on) {
      if (!(await health.isAvailable())) return Alert.alert(`${health.name} isn't available on this phone.`);
      if (!(await health.requestSignalsAccess()))
        return Alert.alert(`${APP_NAME} wasn't given access to ${health.name}.`);
    }
    await updateSettings({ healthSignals: on });
  };

  const confirmDeleteEverything = () =>
    Alert.alert(
      'Delete everything?',
      'Every fast, note, preset, weight and setting on this phone. Export a CSV first if you want a copy. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete everything', style: 'destructive', onPress: () => void deleteEverything() },
      ],
    );

  const input = [font.md, styles.input, { color: c.text, backgroundColor: c.surface2 }];
  return (
    <Screen title="Settings">
      <SectionHeader>Theme</SectionHeader>
      <ListGroup>
        {(Object.keys(themes) as ThemeId[]).map((id) => (
          <ThemeRow
            key={id}
            id={id}
            selected={settings.theme === id}
            onPress={() => void updateSettings({ theme: id })}
          />
        ))}
      </ListGroup>

      <SectionHeader>Appearance</SectionHeader>
      <Segmented<Appearance>
        value={settings.appearance}
        onChange={(appearance) => void updateSettings({ appearance })}
        options={[
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
          { value: 'system', label: 'System' },
        ]}
      />

      <SectionHeader>Health</SectionHeader>
      <ListGroup footer="Reads and writes weight and height only. Nothing leaves this phone otherwise.">
        <SwitchRow
          icon="heart"
          label={`Sync with ${health.name}`}
          detail={settings.healthSyncEnabled ? 'On' : 'Off'}
          value={settings.healthSyncEnabled}
          onChange={(v) => void toggleHealth(v)}
        />
        <ListRow
          icon="scale"
          label="Weight"
          value={latestWeight ? `${latestWeight.kg.toFixed(1)} kg` : '–'}
          detail={latestWeight ? `Updated ${new Date(latestWeight.at).toLocaleDateString()}` : undefined}
        >
          <MeasureInput label="Weight" unit="kg" value={weight} setValue={setWeight} onSave={saveWeight} />
        </ListRow>
        <ListRow
          icon="ruler"
          label="Height"
          value={latestHeight ? `${Math.round(latestHeight.m * 100)} cm` : '–'}
        >
          <MeasureInput label="Height" unit="cm" value={height} setValue={setHeight} onSave={saveHeight} />
        </ListRow>
        <SwitchRow
          label="Show BMI chart"
          detail={currentBmi ? `BMI ${currentBmi.toFixed(1)} now` : 'Needs a weight and a height'}
          value={settings.showBmi}
          onChange={(v) => void updateSettings({ showBmi: v })}
        />
        <SwitchRow
          label="Body signals"
          detail="Sleep, resting heart rate and HRV next to your fasts, in History. Read only."
          value={settings.healthSignals}
          onChange={(v) => void toggleSignals(v)}
        />
      </ListGroup>

      <SectionHeader>Milestone alerts</SectionHeader>
      <ListGroup footer={`All off unless you turn them on. ${AUTOPHAGY_NOTE}`}>
        {BUILT_IN_MILESTONES.map((m) => (
          <SwitchRow
            key={m.id}
            icon="bell"
            label={`${m.title} · ${m.short ?? ''}`}
            detail={<Detail text={m.body} source={m.source} />}
            value={ms.enabledIds.includes(m.id)}
            onChange={(on) =>
              void setMilestones({
                enabledIds: on ? [...ms.enabledIds, m.id] : ms.enabledIds.filter((x) => x !== m.id),
              })
            }
          />
        ))}
        <SwitchRow
          icon="flag"
          label="Goal reached"
          value={ms.notifyGoal}
          onChange={(v) => void setMilestones({ notifyGoal: v })}
        />
        <SwitchRow
          icon="trophy"
          label="New longest fast"
          value={ms.notifyPersonalBest}
          onChange={(v) => void setMilestones({ notifyPersonalBest: v })}
        />
      </ListGroup>

      <SectionHeader>Your own milestones</SectionHeader>
      <ListGroup footer="Any hour, any note, e.g. 36 h: walk and electrolytes.">
        {ms.custom.map((m) => (
          <ListRow
            key={m.id}
            label={m.title}
            detail={m.body}
            right={
              <Button
                label="Remove"
                size="sm"
                variant="ghost"
                onPress={() => void setMilestones({ custom: ms.custom.filter((x) => x.id !== m.id) })}
              />
            }
          />
        ))}
        <View style={[styles.inline, styles.pad]}>
          <TextInput
            style={[input, styles.hours]}
            value={mHours}
            onChangeText={setMHours}
            placeholder="Hours"
            accessibilityLabel="Milestone hours"
            placeholderTextColor={c.textFaint}
            keyboardType="decimal-pad"
          />
          <TextInput
            style={input}
            value={mNote}
            onChangeText={setMNote}
            placeholder="Note (optional)"
            accessibilityLabel="Milestone note"
            placeholderTextColor={c.textFaint}
          />
          <Button
            label="Add"
            size="sm"
            variant="quiet"
            disabled={!mHours}
            onPress={() => void addCustomMilestone()}
          />
        </View>
      </ListGroup>

      <SectionHeader>Presets and weekly rhythm</SectionHeader>
      <ListGroup
        footer={
          presets.length
            ? "Pick days to make a preset the Start screen's choice on those days. Optional."
            : 'Save one from Custom on the Fast screen, or right after you end a fast.'
        }
      >
        {presets.length === 0 ? (
          <ListRow label="No presets yet" />
        ) : (
          presets.map((p) => (
            <View key={p.id} style={[styles.pad, { gap: space[3] }]}>
              <View style={styles.inline}>
                <TextInput
                  style={[input, { fontWeight: '600' }]}
                  defaultValue={p.name}
                  accessibilityLabel={`Preset name, ${goalLabel(p.goal)}`}
                  onEndEditing={(e) => {
                    const name = e.nativeEvent.text.trim();
                    if (name && name !== p.name) void savePreset({ ...p, name });
                  }}
                />
                <Text style={[font.sm, tabular, { color: c.textMuted, minWidth: 56, textAlign: 'right' }]}>
                  {goalLabel(p.goal)}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Delete preset ${p.name}`}
                  hitSlop={8}
                  onPress={() => confirmDeletePreset(p.id, p.name)}
                  style={styles.iconBtn}
                >
                  <Icon name="close" size={18} color={c.danger} />
                </Pressable>
              </View>
              <View style={styles.days} accessibilityLabel={`Days that start on ${p.name}`}>
                {WEEKDAY_LETTERS.map((letter, day) => (
                  <Chip
                    key={day}
                    compact
                    label={letter}
                    accessibilityLabel={WEEKDAY_NAMES[day]}
                    selected={settings.weekdayPresets[day] === p.id}
                    onPress={() =>
                      void updateSettings({
                        weekdayPresets: toggleWeekday(settings.weekdayPresets, day, p.id),
                      })
                    }
                  />
                ))}
              </View>
            </View>
          ))
        )}
      </ListGroup>

      <SectionHeader>Streaks and long fasts</SectionHeader>
      <ListGroup footer="No penalties. A gap is just data.">
        <ListRow
          label="Hours that make a streak day"
          detail="A day counts once you fasted this long in it"
          right={
            <TextInput
              style={[input, styles.hours, { textAlign: 'center' }]}
              value={streakHours}
              onChangeText={setStreakHours}
              onEndEditing={saveStreakHours}
              accessibilityLabel="Streak hours"
              keyboardType="decimal-pad"
            />
          }
        />
        <SwitchRow
          label="Safety card past 72 h"
          detail="Electrolytes, refeeding and who should ask a doctor. Never blocks."
          value={!settings.safetyCardDisabled}
          onChange={(v) => void updateSettings({ safetyCardDisabled: !v })}
        />
        <SwitchRow
          label="Notes from past you"
          detail="While fasting, what you wrote at the same hour of an earlier fast."
          value={settings.showPastNotes}
          onChange={(v) => void updateSettings({ showPastNotes: v })}
        />
      </ListGroup>

      <SectionHeader>Widget and shortcuts</SectionHeader>
      <ListGroup footer="Add the Fast timer widget from your home screen or lock screen.">
        <SwitchRow
          label="Discreet widget"
          detail="The widget and lock screen show only the time, never the word fast."
          value={settings.discreetWidget}
          onChange={(v) => void updateSettings({ discreetWidget: v })}
        />
        <ListRow
          label="Shortcuts and Siri"
          detail="Start or end a fast without opening the app"
          chevron
          onPress={() => router.push('/shortcuts')}
        />
      </ListGroup>

      <SectionHeader>Your data</SectionHeader>
      <ListGroup footer="A Fastaway CSV replaces your history after you confirm. A file from another app, such as a Zero CSV or any spreadsheet with start and end times, is added to it.">
        <ListRow
          icon="export"
          label="Export CSV"
          detail={`${fasts.length} ${fasts.length === 1 ? 'fast' : 'fasts'}`}
          chevron
          onPress={() => void shareCsv(`${APP_NAME.toLowerCase()}-fasts.csv`, fastsToCsv(fasts))}
        />
        <ListRow icon="import" label="Import CSV" chevron onPress={() => void importCsv()} />
        <ListRow label="Privacy" chevron onPress={() => router.push('/privacy')} />
        <ListRow label="Delete everything" destructive onPress={confirmDeleteEverything} />
      </ListGroup>
      <Text
        accessibilityRole="link"
        style={[font.sm, { color: c.text, textDecorationLine: 'underline', textAlign: 'center' }]}
        onPress={() => void Linking.openURL(HELPLINE.url)}
      >
        {HELPLINE.label}
      </Text>

      <View style={styles.about}>
        <BrandMark size={28} color={c.text} />
        <Text style={[font.lg, { color: c.text, ...strong }]}>Fastaway</Text>
        <Text style={[font.xs, { color: c.textMuted, textAlign: 'center' }]}>
          Version {Constants.expoConfig?.version ?? '0.1.0'}. A fasting log, not medical advice.{'\n'}
          Tracking is free, with no length limit.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
    minHeight: 64,
  },
  preview: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  previewDot: { width: 14, height: 14, borderRadius: 7 },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 12, height: 12, borderRadius: 6 },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  about: { alignItems: 'center', gap: space[2], marginTop: space[8] },
});
