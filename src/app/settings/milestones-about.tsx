import { Text, View } from 'react-native';

import { Detail, SubPage } from '../../components/SettingsKit';
import { Card } from '../../components/ui';
import { AUTOPHAGY_NOTE, BUILT_IN_MILESTONES } from '../../domain/milestones';
import { font, strong, useColors } from '../../theme';

/** What each milestone likely means, with its source. Kept here so the switches stay one line each. */
export default function MilestonesAbout() {
  const c = useColors();
  return (
    <SubPage>
      {BUILT_IN_MILESTONES.map((m) => (
        <Card key={m.id}>
          <View style={{ gap: 2 }}>
            <Text style={[font.xs, { color: c.textMuted, fontWeight: '600', letterSpacing: 0.6 }]}>
              {m.title.toUpperCase()}
            </Text>
            <Text style={[font.lg, strong, { color: c.text }]}>{m.short}</Text>
          </View>
          <Detail text={m.body} source={m.source} />
        </Card>
      ))}
      <Card tone="flat">
        <Text style={[font.md, strong, { color: c.text }]}>Autophagy</Text>
        <Text style={[font.sm, { color: c.textMuted }]}>{AUTOPHAGY_NOTE}</Text>
      </Card>
      <Text style={[font.xs, { color: c.textMuted, textAlign: 'center' }]}>
        Times are likely and vary by person. Fastaway is not a medical device.
      </Text>
    </SubPage>
  );
}
