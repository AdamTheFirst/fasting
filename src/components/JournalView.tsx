import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Icon } from './Icon';
import { Body, Card, SectionHeader } from './ui';
import { elapsedMs, goalLabel } from '../domain/fast';
import { filterEntries, groupByFast, journalEntries, themes } from '../domain/journal';
import { noteOffsetLabel } from '../domain/notes';
import { formatShort } from '../domain/time';
import { tick } from '../services/haptics';
import { useStore } from '../state/store';
import { useNow } from '../state/useNow';
import { bold, font, radius, space, strong, tabular, useColors } from '../theme';

const shortDate = (t: number) =>
  new Date(t).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

/** History's Journal view: everything you wrote during your fasts, so past you can talk to present you. */
export function JournalView() {
  const { fasts } = useStore();
  const c = useColors();
  const now = useNow(60_000);
  const [query, setQuery] = useState('');
  const all = useMemo(() => journalEntries(fasts), [fasts]);
  const top = useMemo(() => themes(all), [all]);
  const groups = useMemo(() => groupByFast(filterEntries(all, query)), [all, query]);

  const toggleTheme = (text: string) => {
    tick();
    setQuery((q) => (q.trim().toLowerCase() === text.toLowerCase() ? '' : text));
  };

  return (
    <>
      {all.length === 0 ? (
        <Card style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: c.accentSubtle }]}>
            <Icon name="edit" size={24} color={c.text} />
          </View>
          <Text style={[font.lg, strong, { color: c.text, textAlign: 'center' }]}>
            Your notes gather here
          </Text>
          <Body muted style={{ textAlign: 'center', maxWidth: 300 }}>
            Write a line during a fast, like &ldquo;clear-headed&rdquo; or &ldquo;had electrolytes&rdquo;.
            Each note keeps the hour it was written.
          </Body>
        </Card>
      ) : (
        <>
          <View style={[styles.search, { backgroundColor: c.surface2 }]}>
            <TextInput
              accessibilityLabel="Search your notes"
              placeholder="Search your notes"
              placeholderTextColor={c.textFaint}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              autoCorrect={false}
              style={[font.md, { color: c.text, flex: 1, paddingVertical: space[3] }]}
            />
            {query ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                hitSlop={10}
                onPress={() => setQuery('')}
              >
                <Icon name="close" size={18} color={c.textMuted} />
              </Pressable>
            ) : null}
          </View>

          {top.length > 0 && (
            <View style={{ gap: space[2] }}>
              <Text style={[font.xs, styles.eyebrow, { color: c.textMuted, paddingHorizontal: space[1] }]}>
                YOU WROTE MOST
              </Text>
              <View style={styles.themes}>
                {top.map((t) => {
                  const on = query.trim().toLowerCase() === t.text.toLowerCase();
                  return (
                    <Pressable
                      key={t.text}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      accessibilityLabel={`${t.text}, ${t.count} times${t.medianHour !== null ? `, usually around hour ${t.medianHour}` : ''}`}
                      onPress={() => toggleTheme(t.text)}
                      style={[
                        styles.theme,
                        on
                          ? { backgroundColor: c.primary }
                          : {
                              backgroundColor: c.surface,
                              borderColor: c.borderInput,
                              borderWidth: StyleSheet.hairlineWidth,
                            },
                      ]}
                    >
                      <Text style={[font.sm, bold, { color: on ? c.onPrimary : c.text }]}>
                        {t.text} <Text style={tabular}>×{t.count}</Text>
                      </Text>
                      {t.medianHour !== null ? (
                        <Text style={[font.xs, tabular, { color: on ? c.onPrimary : c.textMuted }]}>
                          around hour {t.medianHour}
                        </Text>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          <SectionHeader>{query.trim() ? `${countOf(groups)} found` : 'All notes'}</SectionHeader>
          {groups.length === 0 ? (
            <Body muted style={{ paddingHorizontal: space[1] }}>
              No notes with &ldquo;{query.trim()}&rdquo;.
            </Body>
          ) : (
            groups.map(({ fast, entries }) => (
              <Card
                key={fast.id}
                onPress={() => router.push(`/fast/${fast.id}`)}
                accessibilityLabel={`Fast of ${formatShort(elapsedMs(fast, now))} from ${shortDate(fast.start)}, ${entries.length} notes`}
                style={{ gap: space[3] }}
              >
                <View style={styles.head}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[font.md, bold, tabular, { color: c.text }]}>
                      {formatShort(elapsedMs(fast, now))}
                      {fast.end === null ? ' so far' : ''}
                      {fast.goal ? (
                        <Text style={[font.sm, { color: c.textMuted, fontWeight: '400' }]}>
                          {' '}
                          · goal {goalLabel(fast.goal)}
                        </Text>
                      ) : null}
                    </Text>
                    <Text style={[font.xs, { color: c.textMuted }]}>{shortDate(fast.start)}</Text>
                  </View>
                  <Icon name="chevron" size={16} color={c.textFaint} />
                </View>
                <View style={[styles.entries, { borderLeftColor: c.border }]}>
                  {entries.map((e) => (
                    <View key={e.key} style={styles.entry}>
                      <View
                        style={[
                          styles.bullet,
                          {
                            backgroundColor: e.offsetMs === null ? c.text : c.accentStrong,
                            borderColor: c.surface,
                          },
                        ]}
                      />
                      <Text style={[font.xs, bold, tabular, { color: c.textMuted, width: 92 }]}>
                        {e.offsetMs === null ? 'After' : noteOffsetLabel(e.offsetMs)}
                      </Text>
                      <Text style={[font.sm, { color: c.text, flex: 1 }]}>{e.text}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            ))
          )}
        </>
      )}
    </>
  );
}

const countOf = (groups: { entries: unknown[] }[]) => {
  const n = groups.reduce((s, g) => s + g.entries.length, 0);
  return `${n} ${n === 1 ? 'note' : 'notes'}`;
};

const styles = StyleSheet.create({
  eyebrow: { fontWeight: '600', letterSpacing: 0.6 },
  empty: { alignItems: 'center', paddingVertical: space[8], gap: space[3] },
  emptyIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    borderRadius: radius.md,
    paddingHorizontal: space[4],
  },
  themes: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  theme: { borderRadius: radius.md, paddingHorizontal: space[3], paddingVertical: space[2], gap: 1 },
  head: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  entries: { borderLeftWidth: 2, marginLeft: 4, paddingLeft: space[3], gap: space[2] },
  entry: { flexDirection: 'row', alignItems: 'flex-start', gap: space[2] },
  bullet: {
    position: 'absolute',
    left: -space[3] - 6,
    top: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
});
