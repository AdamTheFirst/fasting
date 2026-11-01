import { router } from 'expo-router';
import { Platform, Pressable, Text, View } from 'react-native';

import { Icon } from '../../components/Icon';
import { openPlus, PlusTag } from '../../components/Plus';
import { SubPage } from '../../components/SettingsKit';
import { GroupLabel, ListGroup, ListRow, SwitchRow } from '../../components/ui';
import { goalLabel } from '../../domain/fast';
import { tick } from '../../services/haptics';
import { useStore } from '../../state/store';
import { font, radius, space, tabular, useColors } from '../../theme';

// Monday first, in the phone's language.
const WEEKDAY_SHORT = Array.from({ length: 7 }, (_, i) =>
  new Date(2026, 0, 5 + i).toLocaleDateString(undefined, { weekday: 'short' }),
);

export default function FastingSettings() {
  const { plus, presets, settings, updateSettings } = useStore();
  const c = useColors();
  const streak = settings.streakMinHours;
  const setStreak = (h: number) => {
    tick();
    void updateSettings({ streakMinHours: Math.min(24, Math.max(1, h)) });
  };
  const daysFor = (id: string) =>
    WEEKDAY_SHORT.filter((_, day) => settings.weekdayPresets[day] === id).join(', ');

  return (
    <SubPage>
      <GroupLabel>Presets</GroupLabel>
      <ListGroup footer="Save a preset from Custom on the Fast screen, or right after a fast ends.">
        {presets.length === 0 ? (
          <ListRow label="No presets yet" />
        ) : (
          presets.map((p) => (
            <ListRow
              key={p.id}
              label={p.name}
              detail={daysFor(p.id) || undefined}
              value={goalLabel(p.goal)}
              chevron
              onPress={() => router.push(`/settings/preset/${p.id}`)}
            />
          ))
        )}
      </ListGroup>

      <GroupLabel>Streaks</GroupLabel>
      <ListGroup footer="A day counts toward your streak once you fasted this long in it.">
        <ListRow
          label="Streak day"
          right={
            <View style={styles.stepper}>
              <StepButton
                icon="minus"
                label="Fewer hours"
                disabled={streak <= 1}
                onPress={() => setStreak(streak - 1)}
              />
              <Text
                style={[
                  font.md,
                  tabular,
                  { color: c.text, fontWeight: '600', minWidth: 48, textAlign: 'center' },
                ]}
              >
                {streak} h
              </Text>
              <StepButton
                icon="plus"
                label="More hours"
                disabled={streak >= 24}
                onPress={() => setStreak(streak + 1)}
              />
            </View>
          }
        />
      </ListGroup>

      <GroupLabel>While fasting</GroupLabel>
      <ListGroup>
        <SwitchRow
          label="Notes from past you"
          value={settings.showPastNotes}
          onChange={(v) => void updateSettings({ showPastNotes: v })}
        />
        <SwitchRow
          label="Safety card after 72 h"
          value={!settings.safetyCardDisabled}
          onChange={(v) => void updateSettings({ safetyCardDisabled: !v })}
        />
      </ListGroup>

      <GroupLabel>{Platform.OS === 'ios' ? 'Widget and Siri' : 'Shortcuts'}</GroupLabel>
      <ListGroup>
        {Platform.OS === 'ios' && !plus ? (
          <ListRow label="Widget and Live Activity" detail={<PlusTag />} chevron onPress={openPlus} />
        ) : null}
        {Platform.OS === 'ios' ? (
          <SwitchRow
            label="Discreet widget"
            detail="Shows the time only"
            value={settings.discreetWidget}
            onChange={(v) => void updateSettings({ discreetWidget: v })}
          />
        ) : null}
        <ListRow
          label={Platform.OS === 'ios' ? 'Shortcuts and Siri' : 'Shortcuts'}
          chevron
          onPress={() => router.push('/shortcuts')}
        />
      </ListGroup>
    </SubPage>
  );
}

function StepButton({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: 'plus' | 'minus';
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [
        styles.step,
        { borderColor: c.borderInput, backgroundColor: c.surface },
        pressed && { backgroundColor: c.surface2 },
        disabled && { opacity: 0.35 },
      ]}
    >
      <Icon name={icon} size={18} color={c.text} />
    </Pressable>
  );
}

const styles = {
  stepper: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: space[1] },
  step: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
};
