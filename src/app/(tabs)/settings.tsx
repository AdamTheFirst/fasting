import Constants from 'expo-constants';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { BrandMark } from '../../components/Icon';
import { ListGroup, ListRow, Screen } from '../../components/ui';
import { APP_NAME } from '../../config/identity';
import { health } from '../../services/health';
import { useStore } from '../../state/store';
import { font, space, strong, themes, useColors } from '../../theme';

const MODE = { system: 'Auto', light: 'Light', dark: 'Dark' } as const;

/** Five doors, nothing else. Every setting lives one tap in, on its own page. */
export default function SettingsScreen() {
  const { fasts, presets, settings } = useStore();
  const c = useColors();
  const ms = settings.milestones;
  const alertsOn =
    ms.enabledIds.length + ms.custom.length + Number(ms.notifyGoal) + Number(ms.notifyPersonalBest);

  return (
    <Screen title="Settings">
      <ListGroup>
        <ListRow
          icon="sun"
          label="Appearance"
          value={`${themes[settings.theme].name} · ${MODE[settings.appearance]}`}
          chevron
          onPress={() => router.push('/settings/appearance')}
        />
        <ListRow
          icon="fast"
          label="Fasting"
          value={
            presets.length ? `${presets.length} ${presets.length === 1 ? 'preset' : 'presets'}` : undefined
          }
          chevron
          onPress={() => router.push('/settings/fasting')}
        />
        <ListRow
          icon="bell"
          label="Reminders"
          value={alertsOn ? `${alertsOn} on` : 'Off'}
          chevron
          onPress={() => router.push('/settings/reminders')}
        />
      </ListGroup>

      <ListGroup>
        <ListRow
          icon="heart"
          label={health.name}
          value={settings.healthSyncEnabled ? 'On' : 'Off'}
          chevron
          onPress={() => router.push('/settings/health')}
        />
        <ListRow
          icon="folder"
          label="Your data"
          value={`${fasts.length} ${fasts.length === 1 ? 'fast' : 'fasts'}`}
          chevron
          onPress={() => router.push('/settings/data')}
        />
      </ListGroup>

      <View style={styles.about}>
        <BrandMark size={36} color={c.text} accent={c.accentStrong} />
        <Text style={[font.md, strong, { color: c.text }]}>{APP_NAME}</Text>
        <Text style={[font.xs, { color: c.textMuted, textAlign: 'center' }]}>
          Version {Constants.expoConfig?.version ?? '0.1.0'} · No account, no ads, no tracking.{'\n'}A fasting
          log, not medical advice.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  about: { alignItems: 'center', gap: space[2], marginTop: space[10] },
});
