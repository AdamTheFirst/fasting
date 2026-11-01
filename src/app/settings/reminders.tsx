import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, TextInput, View } from 'react-native';

import { kit, SubPage } from '../../components/SettingsKit';
import { Button, GroupLabel, ListGroup, ListRow, SwitchRow } from '../../components/ui';
import { newId } from '../../domain/fast';
import { BUILT_IN_MILESTONES, customMilestone } from '../../domain/milestones';
import { ensureNotificationPermission } from '../../services/notifications';
import { useStore } from '../../state/store';
import { font, useColors } from '../../theme';

export default function ReminderSettings() {
  const { settings, updateSettings } = useStore();
  const c = useColors();
  const [mHours, setMHours] = useState('');
  const [mNote, setMNote] = useState('');
  const ms = settings.milestones;
  const input = [font.md, kit.input, { color: c.text, backgroundColor: c.surface2 }];

  const setMilestones = async (patch: Partial<typeof ms>) => {
    const next = { ...ms, ...patch };
    const anyOn =
      next.enabledIds.length > 0 || next.custom.length > 0 || next.notifyGoal || next.notifyPersonalBest;
    // Permission is asked the first time something is turned on, never at install.
    if (anyOn && !(await ensureNotificationPermission())) {
      Alert.alert(
        'Notifications are off for this app',
        'Turn them on in system settings to get milestone alerts.',
      );
    }
    await updateSettings({ milestones: next });
  };

  const addCustomMilestone = async () => {
    const m = customMilestone(Number(mHours.replace(',', '.')), mNote, newId());
    if (!m) return Alert.alert('Enter the hours as a number, like 36 or 4.5.');
    await setMilestones({ custom: [...ms.custom, m].sort((a, b) => a.hours - b.hours) });
    setMHours('');
    setMNote('');
  };

  return (
    <SubPage>
      <GroupLabel>Alerts</GroupLabel>
      <ListGroup footer="All off until you turn them on.">
        <SwitchRow
          label="Goal reached"
          value={ms.notifyGoal}
          onChange={(v) => void setMilestones({ notifyGoal: v })}
        />
        <SwitchRow
          label="New longest fast"
          value={ms.notifyPersonalBest}
          onChange={(v) => void setMilestones({ notifyPersonalBest: v })}
        />
      </ListGroup>

      <GroupLabel>Milestones</GroupLabel>
      <ListGroup>
        {BUILT_IN_MILESTONES.map((m) => (
          <SwitchRow
            key={m.id}
            label={m.title}
            detail={m.short}
            value={ms.enabledIds.includes(m.id)}
            onChange={(on) =>
              void setMilestones({
                enabledIds: on ? [...ms.enabledIds, m.id] : ms.enabledIds.filter((x) => x !== m.id),
              })
            }
          />
        ))}
        <ListRow label="What these mean" chevron onPress={() => router.push('/settings/milestones-about')} />
      </ListGroup>

      <GroupLabel>Your own</GroupLabel>
      <ListGroup footer="Any hour, any note, e.g. 36 h: walk and electrolytes.">
        {ms.custom.map((m) => (
          <ListRow
            key={m.id}
            label={m.title}
            detail={m.body}
            right={
              <Button
                label="Remove"
                size="sm"
                variant="quiet"
                onPress={() => void setMilestones({ custom: ms.custom.filter((x) => x.id !== m.id) })}
              />
            }
          />
        ))}
        <View style={[kit.inline, kit.pad]}>
          <TextInput
            style={[input, kit.hours]}
            value={mHours}
            onChangeText={setMHours}
            placeholder="Hours"
            accessibilityLabel="Milestone hours"
            placeholderTextColor={c.textFaint}
            keyboardType="decimal-pad"
          />
          <TextInput
            style={input}
            value={mNote}
            onChangeText={setMNote}
            placeholder="Note (optional)"
            accessibilityLabel="Milestone note"
            placeholderTextColor={c.textFaint}
          />
          <Button
            label="Add"
            size="sm"
            variant="quiet"
            disabled={!mHours}
            onPress={() => void addCustomMilestone()}
          />
        </View>
      </ListGroup>
    </SubPage>
  );
}
