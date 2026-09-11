import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fontSize, radius, spacing } from '../theme';

// How long the banner stays on screen.
const VISIBLE_MS = 2000;
// How long the fade in / fade out takes.
const ANIMATION_MS = 220;
// The banner slides down from this offset when it appears.
const SLIDE_OFFSET = -16;

interface ErrorBannerProps {
  // The text to show. Null hides the banner.
  message: string | null;
  onDismiss: () => void;
}

// A small red bar for errors that happen after an action, for example a refused update.
// It floats over the top of the screen, below the status bar, so the content does not move.
// It fades in, stays for two seconds, then fades out. A tap hides it right away.
export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  const insets = useSafeAreaInsets();
  // Animated values are created once and never change identity.
  const [opacity] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => new Animated.Value(SLIDE_OFFSET));
  // The text on screen. It keeps the last message while the banner fades out.
  const [visibleMessage, setVisibleMessage] = useState<string | null>(message);
  if (message !== null && message !== visibleMessage) {
    setVisibleMessage(message);
  }

  useEffect(() => {
    const animateTo = (shown: boolean, onDone?: () => void) =>
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: shown ? 1 : 0,
          duration: ANIMATION_MS,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: shown ? 0 : SLIDE_OFFSET,
          duration: ANIMATION_MS,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          onDone?.();
        }
      });

    if (message) {
      animateTo(true);
      const timer = setTimeout(onDismiss, VISIBLE_MS);
      return () => clearTimeout(timer);
    }

    // Fade out first, then remove the text.
    animateTo(false, () => setVisibleMessage(null));
    return undefined;
  }, [message, onDismiss, opacity, translateY]);

  if (!visibleMessage) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.banner,
        { top: insets.top + spacing.lg, opacity, transform: [{ translateY }] },
      ]}
    >
      <Pressable onPress={onDismiss} accessibilityRole="alert">
        <Text style={styles.text}>{visibleMessage}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 10,
    elevation: 4,
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    shadowColor: colors.text,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  text: {
    color: colors.danger,
    fontSize: fontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
});
