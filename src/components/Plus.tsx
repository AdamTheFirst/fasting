import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PLUS_FALLBACK_PRICE } from '../domain/plus';
import { plusPrice } from '../services/purchases';
import { font, radius, space, useColors } from '../theme';
import { Icon } from './Icon';
import { Body, Button, Card } from './ui';

/** The small tag on anything that comes with Plus. Quiet: no colour that shouts, no countdown. */
export function PlusTag() {
  const c = useColors();
  return (
    <View
      accessibilityLabel="Comes with Plus"
      style={[styles.tag, { backgroundColor: c.surface2, borderColor: c.border }]}
    >
      <Icon name="lock" size={12} color={c.textMuted} />
      <Text style={[font.xs, { color: c.textMuted, fontWeight: '600' }]}>Plus</Text>
    </View>
  );
}

/** The local price from the store, or the fallback until it answers. */
export function usePlusPrice(): string {
  const [price, setPrice] = useState(PLUS_FALLBACK_PRICE);
  useEffect(() => {
    let live = true;
    void plusPrice().then((p) => {
      if (live && p) setPrice(p);
    });
    return () => {
      live = false;
    };
  }, []);
  return price;
}

export const openPlus = () => router.push('/plus');

/** In place of a Plus screen: what it holds, and one way in. Nothing else on the page is blocked. */
export function PlusGate({ title, detail }: { title: string; detail: string }) {
  const price = usePlusPrice();
  const c = useColors();
  return (
    <Card>
      <View style={{ gap: space[2] }}>
        <PlusTag />
        <Text style={[font.lg, { color: c.text, fontWeight: '700' }]}>{title}</Text>
        <Body muted>{detail}</Body>
      </View>
      <Button label={`See Plus · ${price} once`} variant="secondary" block onPress={openPlus} />
    </Card>
  );
}

const styles = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    alignSelf: 'flex-start',
    paddingHorizontal: space[2],
    paddingVertical: 2,
    borderRadius: radius.xs,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
