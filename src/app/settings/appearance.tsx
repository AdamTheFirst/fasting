import { Icon } from '../../components/Icon';
import { SubPage, ThemeRow } from '../../components/SettingsKit';
import { GroupLabel, ListGroup, ListRow } from '../../components/ui';
import { tick } from '../../services/haptics';
import { useStore } from '../../state/store';
import { type Appearance, themes, type ThemeId, useColors } from '../../theme';

const MODES: { value: Appearance; label: string }[] = [
  { value: 'system', label: 'Match the phone' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function AppearanceSettings() {
  const { settings, updateSettings } = useStore();
  const c = useColors();
  return (
    <SubPage>
      <GroupLabel>Colour</GroupLabel>
      <ListGroup>
        {(Object.keys(themes) as ThemeId[]).map((id) => (
          <ThemeRow
            key={id}
            id={id}
            selected={settings.theme === id}
            onPress={() => {
              tick();
              void updateSettings({ theme: id });
            }}
          />
        ))}
      </ListGroup>

      <GroupLabel>Mode</GroupLabel>
      <ListGroup>
        {MODES.map((m) => (
          <ListRow
            key={m.value}
            label={m.label}
            onPress={() => {
              tick();
              void updateSettings({ appearance: m.value });
            }}
            right={settings.appearance === m.value ? <Icon name="check" size={22} color={c.text} /> : null}
          />
        ))}
      </ListGroup>
    </SubPage>
  );
}
