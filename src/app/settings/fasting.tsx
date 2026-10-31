import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, Text, TextInput, View } from 'react-native';

import { Icon } from '../../components/Icon';
import { kit, SubPage } from '../../components/SettingsKit';
import { Chip, GroupLabel, ListGroup, ListRow, SwitchRow } from '../../components/ui';
import { goalLabel } from '../../domain/fast';
import { toggleWeekday } from '../../domain/settings';
import { useStore } from '../../state/store';
import { font, space, tabular, useColors } from '../../theme';

// Monday first, in the phone's language.
const WEEKDAY_NAMES = Array.from({ length: 7 }, (_, i) =>
  new Date(2026, 0, 5 + i).toLocaleDateString(undefined, { weekday: 'long' }),
);
const WEEKDAY_LETTERS = WEEKDAY_NAMES.map((_, i) =>
  new Date(2026, 0, 5 + i).toLocaleDateString(undefined, { weekday: 'narrow' }),
);

export default function FastingSettings() {
  const { presets, settings, updateSettings, savePreset, deletePreset } = useStore();
  const c = useColors();
  const [streakHours, setStreakHours] = useState(String(settings.streakMinHours));
  const input = [font.md, kit.input, { color: c.text, backgroundColor: c.surface2 }];

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

  return (
    <SubPage>
      <GroupLabel>Presets</GroupLabel>
      <ListGroup
        footer={
          presets.length
            ? 'Pick days to make a preset the first choice on those days. Optional.'
            : 'Save one from Custom on the Fast screen, or right after you end a fast.'
        }
      >
        {presets.length === 0 ? (
          <ListRow label="No presets yet" />
        ) : (
          presets.map((p) => (
            <View key={p.id} style={[kit.pad, { gap: space[3] }]}>
              <View style={kit.inline}>
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
                  style={kit.iconBtn}
                >
                  <Icon name="close" size={18} color={c.textMuted} />
                </Pressable>
              </View>
              <View style={kit.days} accessibilityLabel={`Days that start on ${p.name}`}>
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

      <GroupLabel>Streaks</GroupLabel>
      <ListGroup footer="No penalties. A gap is just data.">
        <ListRow
          label="Hours for a streak day"
          right={
            <TextInput
              style={[input, kit.hours, { textAlign: 'center' }]}
              value={streakHours}
              onChangeText={setStreakHours}
              onEndEditing={saveStreakHours}
              accessibilityLabel="Hours for a streak day"
              keyboardType="decimal-pad"
            />
          }
        />
      </ListGroup>

      <GroupLabel>While fasting</GroupLabel>
      <ListGroup>
        <SwitchRow
          label="Notes from past you"
          detail="What you wrote at the same hour of an earlier fast"
          value={settings.showPastNotes}
          onChange={(v) => void updateSettings({ showPastNotes: v })}
        />
        <SwitchRow
          label="Safety card past 72 h"
          detail="Electrolytes, refeeding and when to ask a doctor"
          value={!settings.safetyCardDisabled}
          onChange={(v) => void updateSettings({ safetyCardDisabled: !v })}
        />
      </ListGroup>

      {Platform.OS === 'ios' && (
        <>
          <GroupLabel>Widget and Siri</GroupLabel>
          <ListGroup footer="Add the timer widget from your home screen or lock screen.">
            <SwitchRow
              label="Discreet widget"
              detail="Shows only the time, never the word fast"
              value={settings.discreetWidget}
              onChange={(v) => void updateSettings({ discreetWidget: v })}
            />
            <ListRow label="Shortcuts and Siri" chevron onPress={() => router.push('/shortcuts')} />
          </ListGroup>
        </>
      )}
      {Platform.OS === 'android' && (
        <ListGroup>
          <ListRow label="Shortcuts" chevron onPress={() => router.push('/shortcuts')} />
        </ListGroup>
      )}
    </SubPage>
  );
}
