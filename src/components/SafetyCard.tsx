import { Linking, StyleSheet, View } from 'react-native';

import { HELPLINE, SAFETY_CARD } from '../domain/safety';
import { elevation, font, radius, space, useColors } from '../theme';
import { Icon } from './Icon';
import { Body, Button, Title } from './ui';

/** Shown once per fast past 72 h. Never blocks: one tap dismisses it, another turns it off for good. */
export function SafetyCard({ onDismiss, onTurnOff }: { onDismiss: () => void; onTurnOff: () => void }) {
  const c = useColors();
  return (
    <View
      accessibilityRole="summary"
      style={[styles.card, { backgroundColor: c.surface, shadowColor: c.shadow, ...elevation }]}
    >
      <View style={styles.head}>
        <Icon name="info" color={c.text} />
        <Title size="lg">{SAFETY_CARD.title}</Title>
      </View>
      <Body style={font.sm}>{SAFETY_CARD.body}</Body>
      <View style={styles.links}>
        {[...SAFETY_CARD.sources, HELPLINE].map((s) => (
          <Body
            key={`${s.url}${c.text}`}
            accessibilityRole="link"
            style={[font.sm, { color: c.text, textDecorationLine: 'underline' }]}
            onPress={() => void Linking.openURL(s.url)}
          >
            {s.label}
          </Body>
        ))}
      </View>
      <View style={styles.row}>
        <Button label="Got it" size="sm" variant="secondary" onPress={onDismiss} />
        <Button label="Don't show again" size="sm" variant="quiet" onPress={onTurnOff} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.xl, padding: space[5], gap: space[3] },
  head: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  links: { gap: space[1] },
  row: { flexDirection: 'row', gap: space[2], flexWrap: 'wrap' },
});
