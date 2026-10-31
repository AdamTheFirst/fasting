import { router } from 'expo-router';
import { Alert, Linking } from 'react-native';

import { SubPage } from '../../components/SettingsKit';
import { ListGroup, ListRow } from '../../components/ui';
import { APP_NAME } from '../../config/identity';
import { fastsToCsv } from '../../domain/csv';
import { importFasts, mergeImported } from '../../domain/importers';
import { HELPLINE } from '../../domain/safety';
import { pickCsv, shareCsv } from '../../services/files';
import { useStore } from '../../state/store';

export default function DataSettings() {
  const { fasts, replaceAllFasts, addFasts, deleteEverything } = useStore();

  const importCsv = async () => {
    const text = await pickCsv();
    if (text === null) return;
    try {
      const now = Date.now();
      const result = importFasts(text, now);
      if (result.source === 'fastaway') {
        Alert.alert(`Replace your history with ${result.fasts.length} fasts from this file?`, undefined, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Replace', style: 'destructive', onPress: () => void replaceAllFasts(result.fasts) },
        ]);
        return;
      }
      // Another app's file: add to your history, never replace it.
      const { added, duplicates } = mergeImported(fasts, result.fasts, now);
      const notes = [
        duplicates ? `${duplicates} already in your history.` : null,
        result.skipped.length ? `${result.skipped.length} rows without a usable time were skipped.` : null,
      ].filter(Boolean);
      if (added.length === 0) {
        Alert.alert('Nothing new to add from this file.', notes.join(' ') || undefined);
        return;
      }
      Alert.alert(
        `Add ${added.length} ${added.length === 1 ? 'fast' : 'fasts'} to your history?`,
        notes.join(' ') || undefined,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add', onPress: () => void addFasts(added) },
        ],
      );
    } catch (e) {
      Alert.alert(
        "Couldn't read that file. Nothing was changed.",
        e instanceof Error ? e.message : undefined,
      );
    }
  };

  const confirmDeleteEverything = () =>
    Alert.alert(
      'Delete everything?',
      'Every fast, note, preset, weight and setting on this phone. Export a CSV first if you want a copy. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete everything', style: 'destructive', onPress: () => void deleteEverything() },
      ],
    );

  return (
    <SubPage>
      <ListGroup footer="A Fastaway file replaces your history after you confirm. A file from another app, such as a Zero CSV or any spreadsheet with start and end times, is added to it.">
        <ListRow
          label="Export CSV"
          value={`${fasts.length} ${fasts.length === 1 ? 'fast' : 'fasts'}`}
          chevron
          onPress={() => void shareCsv(`${APP_NAME.toLowerCase()}-fasts.csv`, fastsToCsv(fasts))}
        />
        <ListRow label="Import CSV" chevron onPress={() => void importCsv()} />
      </ListGroup>

      <ListGroup>
        <ListRow label="Privacy policy" chevron onPress={() => router.push('/privacy')} />
        <ListRow
          label="Find a helpline"
          detail="If food or eating feels hard"
          chevron
          onPress={() => void Linking.openURL(HELPLINE.url)}
        />
      </ListGroup>

      <ListGroup>
        <ListRow label="Delete everything" destructive onPress={confirmDeleteEverything} />
      </ListGroup>
    </SubPage>
  );
}
