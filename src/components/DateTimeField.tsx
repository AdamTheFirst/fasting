import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import { font, radius, space, useColors } from '../theme';

const fmt = (t: number) =>
  new Date(t).toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

/** A labelled field that opens the native date and time picker. */
export function DateTimeField({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: number;
  onChange: (t: number) => void;
  error?: string | null;
}) {
  const c = useColors();
  const [mode, setMode] = useState<'date' | 'time' | null>(null);

  const handle = (e: DateTimePickerEvent, d?: Date) => {
    if (e.type === 'dismissed' || !d) return setMode(null);
    onChange(d.getTime());
    // Android shows date and time as two dialogs; iOS shows one inline picker.
    setMode(Platform.OS === 'android' && mode === 'date' ? 'time' : Platform.OS === 'ios' ? mode : null);
  };

  return (
    <View style={{ gap: space[1] }}>
      <Text style={[font.sm, { color: c.textMuted, fontWeight: '500' }]}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${fmt(value)}`}
        accessibilityHint={error ?? undefined}
        onPress={() => setMode(mode ? null : Platform.OS === 'ios' ? 'time' : 'date')}
        style={{
          height: 48,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: error ? c.danger : c.borderInput,
          backgroundColor: c.surface,
          justifyContent: 'center',
          paddingHorizontal: space[3],
        }}
      >
        <Text style={[font.md, { color: c.text }]}>{fmt(value)}</Text>
      </Pressable>
      {error ? <Text style={[font.sm, { color: c.danger }]}>{error}</Text> : null}
      {mode && (
        <DateTimePicker
          value={new Date(value)}
          mode={Platform.OS === 'ios' ? 'datetime' : mode}
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          maximumDate={new Date()}
          onChange={handle}
        />
      )}
    </View>
  );
}
