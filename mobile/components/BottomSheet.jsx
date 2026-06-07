/**
 * Spotix — BottomSheet (Fixed close + drag)
 * Drag handle only captures swipe, content is freely scrollable
 */
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable, Animated, PanResponder } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Radius, Shadows } from '../constants/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function BottomSheet({ children, visible, onClose, snapPoints = [0.4], style }) {
  const sheetHeight = SCREEN_HEIGHT * snapPoints[0];
  const translateY = useRef(new Animated.Value(sheetHeight)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 16, bounciness: 8 }),
        Animated.timing(overlayOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(translateY, { toValue: sheetHeight, useNativeDriver: true, speed: 20, bounciness: 4 }),
        Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  // Pan responder ONLY on the drag handle area
  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 8,
    onPanResponderMove: (_, gs) => { if (gs.dy > 0) translateY.setValue(gs.dy); },
    onPanResponderRelease: (_, gs) => {
      if (gs.dy > sheetHeight * 0.25 || gs.vy > 0.5) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Animated.spring(translateY, { toValue: sheetHeight, useNativeDriver: true }).start();
        Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
        onClose?.();
      } else {
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
      }
    },
  })).current;

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose?.();
  };

  if (!visible) return null;

  return (
    <>
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} pointerEvents="auto">
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>
      <Animated.View style={[styles.sheet, { height: sheetHeight, transform: [{ translateY }] }, style]}>
        {/* Drag handle + Close button */}
        <View {...panResponder.panHandlers} style={styles.handleArea}>
          <View style={styles.handle} />
        </View>
        {/* Close X button */}
        <Pressable onPress={handleClose} style={styles.closeBtn} hitSlop={12}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
        <View style={styles.content}>{children}</View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.overlay, zIndex: 10 },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.white, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, paddingHorizontal: 20, zIndex: 11, ...Shadows.xl },
  handleArea: { paddingTop: 12, paddingBottom: 8, alignItems: 'center' },
  handle: { width: 40, height: 4, backgroundColor: Colors.textMuted, borderRadius: 2 },
  closeBtn: { position: 'absolute', top: 14, right: 18, width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, zIndex: 20 },
  closeText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '700' },
  content: { flex: 1 },
});
