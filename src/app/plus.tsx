import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BrandMark, Icon } from '../components/Icon';
import { usePlusPrice } from '../components/Plus';
import { Body, Button, Card } from '../components/ui';
import { APP_NAME } from '../config/identity';
import { ALWAYS_FREE, PLUS_FEATURES } from '../domain/plus';
import { buyPlus, restorePlus } from '../services/purchases';
import { useStore } from '../state/store';
import { font, layout, space, strong, useColors } from '../theme';

/**
 * The only place Plus is sold. It opens when you tap a Plus tag or the Settings row, never on its
 * own. One price, paid once, and an easy way out.
 */
export default function PlusScreen() {
  const { plus, setPlus, purchaseError, clearPurchaseError } = useStore();
  const c = useColors();
  const price = usePlusPrice();
  const [busy, setBusy] = useState<'buy' | 'restore' | null>(null);

  const buy = async () => {
    clearPurchaseError();
    setBusy('buy');
    try {
      await buyPlus();
    } catch (e) {
      Alert.alert("Couldn't open the store", e instanceof Error ? e.message : 'Try again in a moment.');
    } finally {
      setBusy(null);
    }
  };

  const restore = async () => {
    clearPurchaseError();
    setBusy('restore');
    const owned = await restorePlus();
    setBusy(null);
    if (owned) {
      await setPlus(true);
      return;
    }
    Alert.alert(
      owned === null ? "Couldn't reach the store" : 'No Plus purchase found',
      owned === null
        ? 'Check the connection and try again.'
        : 'Plus was not bought with the store account on this phone.',
    );
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={styles.page}>
      <View style={styles.head}>
        <BrandMark size={44} color={c.text} accent={c.accentStrong} />
        <Text
          accessibilityRole="header"
          style={[font['2xl'], strong, { color: c.text, textAlign: 'center' }]}
        >
          {APP_NAME} Plus
        </Text>
        <Body muted style={{ textAlign: 'center' }}>
          {plus
            ? `Unlocked. Thank you for supporting ${APP_NAME}.`
            : `One payment of ${price}. Yours for good. No subscription, no trial, nothing renews.`}
        </Body>
      </View>

      <Card>
        {PLUS_FEATURES.map((f) => (
          <View key={f.title} style={styles.feature}>
            <Icon name="check" size={20} color={c.text} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[font.md, { color: c.text, fontWeight: '600' }]}>{f.title}</Text>
              <Text style={[font.sm, { color: c.textMuted }]}>{f.detail}</Text>
            </View>
          </View>
        ))}
      </Card>

      <Text style={[font.sm, { color: c.textMuted, textAlign: 'center' }]}>{ALWAYS_FREE}</Text>

      {purchaseError ? (
        <Text accessibilityLiveRegion="polite" style={[font.sm, { color: c.danger, textAlign: 'center' }]}>
          {purchaseError}
        </Text>
      ) : null}

      {plus ? (
        <Button label="Done" block onPress={() => router.back()} />
      ) : (
        <View style={{ gap: space[3] }}>
          <Button
            label={busy === 'buy' ? 'Opening the store…' : `Unlock for ${price}`}
            block
            disabled={busy !== null}
            onPress={() => void buy()}
          />
          <Button
            label={busy === 'restore' ? 'Checking…' : 'Restore purchase'}
            variant="secondary"
            block
            disabled={busy !== null}
            onPress={() => void restore()}
          />
          <Button label="Not now" variant="ghost" block onPress={() => router.back()} />
        </View>
      )}

      {__DEV__ ? (
        <Button
          label={plus ? 'Lock Plus again (development build)' : 'Unlock without paying (development build)'}
          variant="ghost"
          size="sm"
          onPress={() => void setPlus(!plus)}
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: layout.gutter, gap: space[5], paddingBottom: space[12] },
  head: { alignItems: 'center', gap: space[2], paddingTop: space[4] },
  feature: { flexDirection: 'row', gap: space[3], alignItems: 'flex-start' },
});
