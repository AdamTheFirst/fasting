import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { font, radius, serif, space, useColors } from '../theme';
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
        style={[styles.scrim, { backgroundColor: 'rgba(22,20,26,0.55)' }]}
      >
        <Pressable
          accessibilityViewIsModal
          onPress={() => {}}
          style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}
        >
          <Text
            accessibilityRole="header"
            style={[font.xl, { color: c.text, fontFamily: serif, fontWeight: '600' }]}
          >
            {title}
          </Text>
          {message ? <Text style={[font.md, { color: c.textMuted }]}>{message}</Text> : null}
          <View style={styles.actions}>
            <Button
              label={confirmLabel}
              block
              variant={destructive ? 'danger' : 'primary'}
              onPress={onConfirm}
            />
            <Button label={cancelLabel} block variant="secondary" onPress={onCancel} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, justifyContent: 'flex-end', padding: space[4], paddingBottom: space[10] },
  card: { borderRadius: radius.xl, borderWidth: StyleSheet.hairlineWidth, padding: space[6], gap: space[3] },
  actions: { gap: space[2], marginTop: space[2] },
});
