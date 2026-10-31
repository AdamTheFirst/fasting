import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '../components/ui';
import { APP_SCHEME } from '../config/identity';
import { font, radius, space, strong, useColors } from '../theme';
import { useStore } from '../state/store';

/** The links that start and end a fast, for Shortcuts, Siri, Back Tap and the Action Button. */
export default function Shortcuts() {
  const c = useColors();
  const { presets } = useStore();
  const links = [
    { label: 'Start an open-ended fast', url: `${APP_SCHEME}://action/start` },
    { label: 'Start a 16 hour fast', url: `${APP_SCHEME}://action/start?hours=16` },
    { label: 'Start a 3 day fast', url: `${APP_SCHEME}://action/start?days=3` },
    ...presets.map((p) => ({
      label: `Start "${p.name}"`,
      url: `${APP_SCHEME}://action/start?preset=${p.id}`,
    })),
    { label: 'End the running fast', url: `${APP_SCHEME}://action/end` },
  ];
  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={styles.screen}>
      <Card>
        <Text style={[font.lg, strong, { color: c.text }]}>How to set it up</Text>
        <Text style={[font.md, { color: c.text }]}>
          iPhone: in the Shortcuts app, make a shortcut with the &quot;Open URLs&quot; action and paste one of
          the links below. Name it, for example &quot;Start fast&quot;, and say &quot;Hey Siri, start
          fast&quot;. You can also put it on Back Tap (Settings → Accessibility → Touch) or the Action Button.
        </Text>
        <Text style={[font.md, { color: c.text }]}>
          Android: any automation app that opens a link (for example a home screen shortcut, Tasker or an NFC
          tag) can use the same links.
        </Text>
        <Text style={[font.sm, { color: c.textMuted }]}>
          Starting while a fast runs, or ending when none runs, does nothing.
        </Text>
      </Card>
      {links.map((l) => (
        <View key={l.url} style={[styles.link, { backgroundColor: c.surface }]}>
          <Text style={[font.sm, { color: c.textMuted }]}>{l.label}</Text>
          <Text
            selectable
            style={[
              font.md,
              { color: c.text, fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }) },
            ]}
          >
            {l.url}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 20, gap: space[3], paddingBottom: space[12] },
  link: { borderRadius: radius.lg, padding: space[4], gap: space[1] },
});
