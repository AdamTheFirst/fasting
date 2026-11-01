import { Icon } from '../../components/Icon';
import { openPlus } from '../../components/Plus';
import { SubPage, ThemeRow } from '../../components/SettingsKit';
import { GroupLabel, ListGroup, ListRow } from '../../components/ui';
import { effectiveTheme, isThemeFree } from '../../domain/plus';
import { tick } from '../../services/haptics';
import { useStore } from '../../state/store';
import { type Appearance, themes, type ThemeId, useColors } from '../../theme';

const MODES: { value: Appearance; label: string }[] = [
  { value: 'system', label: 'Match the phone' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function AppearanceSettings() {
  const { plus, settings, updateSettings } = useStore();
  const shown = effectiveTheme(settings.theme, plus);
  const c = useColors();
  return (
    <SubPage>
      <GroupLabel>Colour</GroupLabel>
      <ListGroup footer={plus ? undefined : 'Butter is free. Sage and Powder come with Plus.'}>
        {(Object.keys(themes) as ThemeId[]).map((id) => {
          const locked = !plus && !isThemeFree(id);
          return (
            <ThemeRow
              key={id}
              id={id}
              selected={shown === id}
              locked={locked}
              onPress={() => {
                tick();
                if (locked) openPlus();
                else void updateSettings({ theme: id });
              }}
            />
          );
        })}
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
