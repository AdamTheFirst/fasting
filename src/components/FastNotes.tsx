import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { type Fast, goalLabel } from '../domain/fast';
import { addNote, noteOffsetLabel, type PastNote, QUICK_NOTES, removeNote } from '../domain/notes';
import { tick } from '../services/haptics';
import { bold, font, radius, space, useColors } from '../theme';
import { Icon } from './Icon';
import { Button, Card } from './ui';

/** Read at the moment you tap, so the note carries the time it was written. */
const clock = () => Date.now();

const shortDate = (t: number) =>
  new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

/** "Hour 40 of your 3 days fast on 12 Sep 2026, you wrote: …" Tapping opens that fast. */
export function PastYouCard({ past, onHide }: { past: PastNote; onHide: () => void }) {
  const c = useColors();
  const which = past.fast.goal ? `your ${goalLabel(past.fast.goal)} fast` : 'a fast';
  return (
    <Card
      tone="accent"
      onPress={() => router.push(`/fast/${past.fast.id}`)}
      accessibilityLabel={`From past you. ${noteOffsetLabel(past.offsetMs)} of ${which}, you wrote: ${past.note.text}`}
    >
      <View style={styles.row}>
        <Text style={[font.xs, bold, { color: c.textMuted, flex: 1, letterSpacing: 0.6 }]}>
          FROM PAST YOU
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Hide for this fast"
          hitSlop={12}
          onPress={onHide}
        >
          <Icon name="close" size={18} color={c.textMuted} />
        </Pressable>
      </View>
      <Text style={[font.lg, { color: c.text }]}>“{past.note.text}”</Text>
      <Text style={[font.sm, { color: c.textMuted }]}>
        {noteOffsetLabel(past.offsetMs)} of {which} on {shortDate(past.fast.start)}
      </Text>
    </Card>
  );
}

/** Quick, timestamped notes on the running fast. They show up for future you at the same hour. */
export function FastNotesCard({ fast, onSave }: { fast: Fast; onSave: (f: Fast) => void }) {
  const c = useColors();
  const [text, setText] = useState('');
  const save = (value: string) => {
    const next = addNote(fast, value, clock());
    if (next === fast) return;
    tick();
    onSave(next);
    setText('');
  };
  return (
    <Card>
      <View style={styles.quick}>
        {QUICK_NOTES.map((q) => (
          <Pressable
            key={q}
            accessibilityRole="button"
            accessibilityLabel={`Note: ${q}`}
            onPress={() => save(q)}
            style={({ pressed }) => [
              styles.quickChip,
              { backgroundColor: c.surface2 },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={[font.sm, { color: c.text }]}>{q}</Text>
          </Pressable>
        ))}
      </View>
      <View style={[styles.inputRow, { backgroundColor: c.surface2 }]}>
        <TextInput
          accessibilityLabel="Write a note"
          placeholder="How is it going?"
          placeholderTextColor={c.textFaint}
          value={text}
          onChangeText={setText}
          onSubmitEditing={() => save(text)}
          returnKeyType="done"
          style={[font.md, styles.input, { color: c.text }]}
        />
        <Button label="Add" size="sm" disabled={!text.trim()} onPress={() => save(text)} />
      </View>
      {fast.log.length > 0 && (
        <View style={{ gap: space[2] }}>
          {[...fast.log].reverse().map((n) => (
            <View key={n.id} style={styles.noteRow}>
              <Text style={[font.xs, bold, { color: c.textMuted, width: 92 }]}>
                {noteOffsetLabel(n.at - fast.start)}
              </Text>
              <Text style={[font.sm, { color: c.text, flex: 1 }]}>{n.text}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Delete note: ${n.text}`}
                hitSlop={10}
                onPress={() => onSave(removeNote(fast, n.id))}
              >
                <Icon name="close" size={16} color={c.textFaint} />
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  quick: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  quickChip: { borderRadius: radius.full, paddingHorizontal: space[3], paddingVertical: space[2] },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    borderRadius: radius.md,
    paddingLeft: space[4],
    paddingRight: space[1],
    paddingVertical: space[1],
  },
  input: { flex: 1, paddingVertical: space[2] },
  noteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space[2] },
});
