import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { SubPage } from '../../components/SettingsKit';
import { Button, GroupLabel, ListGroup, ListRow } from '../../components/ui';
import { newId } from '../../domain/fast';
import { health } from '../../services/health';
import { useStore } from '../../state/store';
import { font, radius, space, strong, tabular, useColors } from '../../theme';

/** Log a weight or a height: one big field, one button, and the last few entries under it. */
export default function MeasureSettings() {
  const { kind } = useLocalSearchParams<{ kind: 'weight' | 'height' }>();
  const { weights, heights, settings, addWeight, addHeight } = useStore();
  const c = useColors();
  const [value, setValue] = useState('');
  const isWeight = kind !== 'height';
  const unit = isWeight ? 'kg' : 'cm';
  const recent = isWeight
    ? weights
        .slice(-5)
        .reverse()
        .map((w) => ({ id: w.id, at: w.at, text: `${w.kg.toFixed(1)} kg` }))
    : heights
        .slice(-5)
        .reverse()
        .map((h) => ({ id: h.id, at: h.at, text: `${Math.round(h.m * 100)} cm` }));
  const n = Number(value.replace(',', '.'));
  const valid = n > 0 && (isWeight ? n < 500 : n < 300);

  const save = async () => {
    if (!valid) return;
    const at = Date.now();
    if (isWeight) {
      await addWeight({ id: newId(), at, kg: n, source: 'manual' });
      if (settings.healthSyncEnabled) await health.writeWeight(n, at).catch(() => {});
    } else {
      await addHeight({ id: newId(), at, m: n / 100, source: 'manual' });
      if (settings.healthSyncEnabled) await health.writeHeight(n / 100, at).catch(() => {});
    }
    router.back();
  };

  return (
    <SubPage>
      <Stack.Screen options={{ title: isWeight ? 'Weight' : 'Height' }} />
      <View style={[styles.field, { backgroundColor: c.surface, borderColor: c.borderInput }]}>
        <TextInput
          autoFocus
          value={value}
          onChangeText={setValue}
          onSubmitEditing={() => void save()}
          placeholder={isWeight ? '72.5' : '175'}
          placeholderTextColor={c.textFaint}
          keyboardType="decimal-pad"
          accessibilityLabel={`${isWeight ? 'Weight' : 'Height'} in ${unit}`}
          style={[font.display, strong, tabular, styles.input, { color: c.text }]}
        />
        <Text style={[font.xl, { color: c.textMuted, fontWeight: '600' }]}>{unit}</Text>
      </View>
      <Button label="Save" size="lg" block disabled={!valid} onPress={() => void save()} />

      {recent.length > 0 && (
        <>
          <GroupLabel>Recent</GroupLabel>
          <ListGroup>
            {recent.map((r) => (
              <ListRow
                key={r.id}
                label={r.text}
                value={new Date(r.at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
              />
            ))}
          </ListGroup>
        </>
      )}
    </SubPage>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    borderRadius: radius.xl,
    borderWidth: 1.5,
    paddingHorizontal: space[6],
    paddingVertical: space[5],
  },
  input: { flex: 1, minWidth: 0 },
});
