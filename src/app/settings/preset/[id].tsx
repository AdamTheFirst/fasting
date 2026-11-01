import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, TextInput, View } from 'react-native';

import { kit, SubPage } from '../../../components/SettingsKit';
import { Button, Chip, GroupLabel, ListGroup, ListRow } from '../../../components/ui';
import { goalLabel } from '../../../domain/fast';
import { toggleWeekday } from '../../../domain/settings';
import { useStore } from '../../../state/store';
import { font, space, useColors } from '../../../theme';

const WEEKDAY_NAMES = Array.from({ length: 7 }, (_, i) =>
  new Date(2026, 0, 5 + i).toLocaleDateString(undefined, { weekday: 'long' }),
);
const WEEKDAY_LETTERS = WEEKDAY_NAMES.map((_, i) =>
  new Date(2026, 0, 5 + i).toLocaleDateString(undefined, { weekday: 'narrow' }),
);

/** One preset: its name, which days it's the first choice, and delete. */
export default function PresetSettings() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { presets, settings, updateSettings, savePreset, deletePreset } = useStore();
  const c = useColors();
  const preset = presets.find((p) => p.id === id);
  const [name, setName] = useState(preset?.name ?? '');
  if (!preset) return <SubPage>{null}</SubPage>;

  const saveName = () => {
    const next = name.trim();
    if (next && next !== preset.name) void savePreset({ ...preset, name: next });
    else setName(preset.name);
  };

  const confirmDelete = () =>
    Alert.alert(`Delete "${preset.name}"?`, 'Past fasts keep their goal.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void deletePreset(preset.id);
          router.back();
        },
      },
    ]);

  return (
    <SubPage>
      <Stack.Screen options={{ title: preset.name }} />
      <GroupLabel>Name</GroupLabel>
      <ListGroup>
        <View style={kit.pad}>
          <TextInput
            style={[font.md, kit.input, { color: c.text, backgroundColor: c.surface2, fontWeight: '600' }]}
            value={name}
            onChangeText={setName}
            onEndEditing={saveName}
            accessibilityLabel="Preset name"
            returnKeyType="done"
          />
        </View>
        <ListRow label="Goal" value={goalLabel(preset.goal)} />
      </ListGroup>

      <GroupLabel>First choice on</GroupLabel>
      <ListGroup footer="On these days the Fast screen picks this preset for you. You can still choose another.">
        <View style={[kit.pad, kit.days, { justifyContent: 'space-between' }]}>
          {WEEKDAY_LETTERS.map((letter, day) => (
            <Chip
              key={day}
              compact
              label={letter}
              accessibilityLabel={WEEKDAY_NAMES[day]}
              selected={settings.weekdayPresets[day] === preset.id}
              onPress={() =>
                void updateSettings({
                  weekdayPresets: toggleWeekday(settings.weekdayPresets, day, preset.id),
                })
              }
            />
          ))}
        </View>
      </ListGroup>

      <View style={{ marginTop: space[4] }}>
        <Button label="Delete preset" variant="danger" block onPress={confirmDelete} />
      </View>
    </SubPage>
  );
}
