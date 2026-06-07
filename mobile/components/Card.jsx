/**
 * Spotix — Card (Light Mode, Clean & Elevated)
 */
import React, { useRef } from 'react';
import { StyleSheet, Pressable, Animated, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Radius, Shadows } from '../constants/colors';

export default function Card({ children, style, onPress, pressable = false }) {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () => { if (!pressable) return; Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft); Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 4 }).start(); };
  const onPressOut = () => { if (!pressable) return; Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }).start(); };

  const content = (
    <Animated.View style={[styles.card, { transform: [{ scale }] }, style]}>
      {children}
    </Animated.View>
  );

  if (pressable && onPress) {
    return <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>{content}</Pressable>;
  }
  return content;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    ...Shadows.md,
  },
});
