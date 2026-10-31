import { Linking, StyleSheet, View } from 'react-native';

import { SAFETY_CARD } from '../domain/safety';
import { font, space, useColors } from '../theme';
import { Body, Button, Card } from './ui';

/** Shown once per fast past 72 h. Never blocks: one tap dismisses it, another turns it off for good. */
export function SafetyCard({ onDismiss, onTurnOff }: { onDismiss: () => void; onTurnOff: () => void }) {
  const c = useColors();
  return (
    <Card>
      <Body style={[font.lg, { fontWeight: '600' }]}>{SAFETY_CARD.title}</Body>
      <Body>{SAFETY_CARD.body}</Body>
      {SAFETY_CARD.sources.map((s) => (
        <Body
          key={s.url}
          accessibilityRole="link"
          style={[font.sm, { color: c.accent }]}
          onPress={() => void Linking.openURL(s.url)}
        >
          {s.label}
        </Body>
      ))}
      <View style={styles.row}>
        <Button label="Got it" variant="secondary" onPress={onDismiss} />
        <Button label="Don't show again" variant="ghost" onPress={onTurnOff} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', gap: space[2], marginTop: space[2] } });
