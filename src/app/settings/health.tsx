import { useState } from 'react';
import { Alert } from 'react-native';

import { MeasureInput, SubPage } from '../../components/SettingsKit';
import { ListGroup, ListRow, SwitchRow } from '../../components/ui';
import { APP_NAME } from '../../config/identity';
import { newId } from '../../domain/fast';
import { bmi } from '../../domain/stats';
import { health } from '../../services/health';
import { useStore } from '../../state/store';

export default function HealthSettings() {
  const { weights, heights, settings, updateSettings, addWeight, addHeight } = useStore();
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const latestWeight = weights.at(-1);
  const latestHeight = heights.at(-1);
  const currentBmi = latestWeight && latestHeight ? bmi(latestWeight.kg, latestHeight.m) : null;

  const toggleHealth = async (on: boolean) => {
    if (on) {
      if (!(await health.isAvailable())) return Alert.alert(`${health.name} isn't available on this phone.`);
      if (!(await health.requestAccess()))
        return Alert.alert(`${APP_NAME} wasn't given access to ${health.name}.`);
    }
    await updateSettings({ healthSyncEnabled: on });
  };

  const toggleSignals = async (on: boolean) => {
    if (on) {
      if (!(await health.isAvailable())) return Alert.alert(`${health.name} isn't available on this phone.`);
      if (!(await health.requestSignalsAccess()))
        return Alert.alert(`${APP_NAME} wasn't given access to ${health.name}.`);
    }
    await updateSettings({ healthSignals: on });
  };

  const saveWeight = async () => {
    const kg = Number(weight.replace(',', '.'));
    if (!(kg > 0)) return;
    const at = Date.now();
    await addWeight({ id: newId(), at, kg, source: 'manual' });
    if (settings.healthSyncEnabled) await health.writeWeight(kg, at).catch(() => {});
    setWeight('');
  };

  const saveHeight = async () => {
    const cm = Number(height.replace(',', '.'));
    if (!(cm > 0)) return;
    const at = Date.now();
    await addHeight({ id: newId(), at, m: cm / 100, source: 'manual' });
    if (settings.healthSyncEnabled) await health.writeHeight(cm / 100, at).catch(() => {});
    setHeight('');
  };

  return (
    <SubPage>
      <ListGroup footer="Reads and writes weight and height only. Nothing leaves this phone otherwise.">
        <SwitchRow
          label={`Sync with ${health.name}`}
          value={settings.healthSyncEnabled}
          onChange={(v) => void toggleHealth(v)}
        />
      </ListGroup>

      <ListGroup>
        <ListRow
          label="Weight"
          value={latestWeight ? `${latestWeight.kg.toFixed(1)} kg` : '–'}
          detail={latestWeight ? `Updated ${new Date(latestWeight.at).toLocaleDateString()}` : undefined}
        >
          <MeasureInput label="Weight" unit="kg" value={weight} setValue={setWeight} onSave={saveWeight} />
        </ListRow>
        <ListRow label="Height" value={latestHeight ? `${Math.round(latestHeight.m * 100)} cm` : '–'}>
          <MeasureInput label="Height" unit="cm" value={height} setValue={setHeight} onSave={saveHeight} />
        </ListRow>
      </ListGroup>

      <ListGroup footer="Body signals shows sleep, resting heart rate and HRV next to your fasts in History. Read only.">
        <SwitchRow
          label="BMI chart"
          detail={currentBmi ? `BMI ${currentBmi.toFixed(1)} now` : 'Needs a weight and a height'}
          value={settings.showBmi}
          onChange={(v) => void updateSettings({ showBmi: v })}
        />
        <SwitchRow
          label="Body signals"
          value={settings.healthSignals}
          onChange={(v) => void toggleSignals(v)}
        />
      </ListGroup>
    </SubPage>
  );
}
