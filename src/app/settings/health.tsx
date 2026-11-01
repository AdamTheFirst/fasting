import { router } from 'expo-router';
import { Alert } from 'react-native';

import { SubPage } from '../../components/SettingsKit';
import { GroupLabel, ListGroup, ListRow, SwitchRow } from '../../components/ui';
import { APP_NAME } from '../../config/identity';
import { bmi } from '../../domain/stats';
import { health } from '../../services/health';
import { useStore } from '../../state/store';

export default function HealthSettings() {
  const { weights, heights, settings, updateSettings } = useStore();
  const latestWeight = weights.at(-1);
  const latestHeight = heights.at(-1);
  const currentBmi = latestWeight && latestHeight ? bmi(latestWeight.kg, latestHeight.m) : null;

  const ask = async (signals: boolean) => {
    if (!(await health.isAvailable())) {
      Alert.alert(`${health.name} isn't available on this phone.`);
      return false;
    }
    const ok = signals ? await health.requestSignalsAccess() : await health.requestAccess();
    if (!ok) Alert.alert(`${APP_NAME} wasn't given access to ${health.name}.`);
    return ok;
  };

  return (
    <SubPage>
      <ListGroup footer="Weight and height only. Nothing else leaves this phone.">
        <SwitchRow
          label={`Sync with ${health.name}`}
          value={settings.healthSyncEnabled}
          onChange={async (on) => {
            if (on && !(await ask(false))) return;
            void updateSettings({ healthSyncEnabled: on });
          }}
        />
      </ListGroup>

      <GroupLabel>You</GroupLabel>
      <ListGroup>
        <ListRow
          label="Weight"
          value={latestWeight ? `${latestWeight.kg.toFixed(1)} kg` : 'Add'}
          chevron
          onPress={() => router.push({ pathname: '/settings/measure', params: { kind: 'weight' } })}
        />
        <ListRow
          label="Height"
          value={latestHeight ? `${Math.round(latestHeight.m * 100)} cm` : 'Add'}
          chevron
          onPress={() => router.push({ pathname: '/settings/measure', params: { kind: 'height' } })}
        />
      </ListGroup>

      <GroupLabel>Show in Insights</GroupLabel>
      <ListGroup footer="Body signals are sleep, resting heart rate and HRV, read only.">
        <SwitchRow
          label="BMI chart"
          detail={currentBmi ? `${currentBmi.toFixed(1)} now` : 'Needs a weight and a height'}
          value={settings.showBmi}
          onChange={(v) => void updateSettings({ showBmi: v })}
        />
        <SwitchRow
          label="Body signals"
          value={settings.healthSignals}
          onChange={async (on) => {
            if (on && !(await ask(true))) return;
            void updateSettings({ healthSignals: on });
          }}
        />
      </ListGroup>
    </SubPage>
  );
}
