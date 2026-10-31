import { Linking, ScrollView, StyleSheet, Text } from 'react-native';

import { Card } from '../components/ui';
import { PRIVACY_SECTIONS, PRIVACY_UPDATED } from '../config/privacy';
import { HELPLINE } from '../domain/safety';
import { font, space, strong, useColors } from '../theme';

export default function Privacy() {
  const c = useColors();
  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={styles.screen}>
      <Text style={[font.sm, { color: c.textMuted }]}>Last updated {PRIVACY_UPDATED}</Text>
      {PRIVACY_SECTIONS.map((s) => (
        <Card key={s.title}>
          <Text accessibilityRole="header" style={[font.lg, strong, { color: c.text }]}>
            {s.title}
          </Text>
          <Text style={[font.md, { color: c.text }]}>{s.body}</Text>
        </Card>
      ))}
      <Text
        accessibilityRole="link"
        style={[font.sm, { color: c.text, textDecorationLine: 'underline', textAlign: 'center' }]}
        onPress={() => void Linking.openURL(HELPLINE.url)}
      >
        {HELPLINE.label}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 20, gap: space[3], paddingBottom: space[12] },
});
