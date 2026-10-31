import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { font, radius, strong, space, useColors } from '../theme';
import { Button } from './ui';

/**
 * A confirm card in the app's own style, instead of the platform alert box.
 * Tapping outside or the cancel button closes it; nothing happens until you confirm.
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const c = useColors();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onCancel}
    >
      <Pressable
        accessibilityLabel={cancelLabel}
        onPress={onCancel}
        style={[styles.scrim, { backgroundColor: 'rgba(21,25,32,0.35)' }]}
      >
        <Pressable
          accessibilityViewIsModal
          onPress={() => {}}
          style={[styles.card, { backgroundColor: c.surface }]}
        >
          <View style={[styles.grabber, { backgroundColor: c.border }]} />
          <Text accessibilityRole="header" style={[font.xl, styles.center, { color: c.text, ...strong }]}>
            {title}
          </Text>
          {message ? <Text style={[font.md, styles.center, { color: c.textMuted }]}>{message}</Text> : null}
          <View style={styles.actions}>
            <Button
              label={confirmLabel}
              block
              variant={destructive ? 'danger' : 'primary'}
              onPress={onConfirm}
            />
            <Button label={cancelLabel} block variant="ghost" onPress={onCancel} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, justifyContent: 'flex-end', padding: space[4], paddingBottom: space[10] },
  card: { borderRadius: radius.xl + 4, padding: space[6], paddingTop: space[3], gap: space[3] },
  grabber: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, marginBottom: space[2] },
  center: { textAlign: 'center' },
  actions: { gap: space[1], marginTop: space[3] },
});
