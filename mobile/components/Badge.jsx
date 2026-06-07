/**
 * Spotix — Vibrant Badge with glow
 */
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Colors, Radius, Spacing } from '../constants/colors';
import { FontSizes, FontWeights } from '../constants/typography';

const badgeConfig = {
  available: { bg: Colors.successLight, text: Colors.success, label: 'Available', dot: Colors.success, glow: 'rgba(0,255,136,0.4)' },
  limited: { bg: Colors.warningLight, text: Colors.warning, label: 'Limited', dot: Colors.warning, glow: 'rgba(255,184,0,0.4)' },
  full: { bg: Colors.errorLight, text: Colors.error, label: 'Full', dot: Colors.error, glow: 'rgba(255,68,102,0.4)' },
  active: { bg: Colors.successLight, text: Colors.success, label: 'Active', dot: Colors.success, glow: 'rgba(0,255,136,0.4)' },
  used: { bg: Colors.primaryFaded, text: Colors.textSecondary, label: 'Used', dot: Colors.textLight, glow: 'rgba(150,150,150,0.2)' },
  cancelled: { bg: Colors.errorLight, text: Colors.error, label: 'Cancelled', dot: Colors.error, glow: 'rgba(255,68,102,0.3)' },
};

export default function Badge({ type, label, style }) {
  const config = badgeConfig[type] || badgeConfig.available;
  const displayLabel = label || config.label;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (type === 'available' || type === 'active') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.4, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();
    }
  }, [type]);

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, style]}>
      <View style={styles.dotWrap}>
        <Animated.View style={[styles.dotGlow, { backgroundColor: config.glow, transform: [{ scale: pulse }] }]} />
        <View style={[styles.dot, { backgroundColor: config.dot }]} />
      </View>
      <Text style={[styles.text, { color: config.text }]}>{displayLabel}</Text>
    </View>
  );
}

export function getAvailabilityType(available, total) {
  if (available <= 0) return 'full';
  if (available / total <= 0.2) return 'limited';
  return 'available';
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: Radius.full, gap: 5, alignSelf: 'flex-start' },
  dotWrap: { width: 10, height: 10, justifyContent: 'center', alignItems: 'center' },
  dotGlow: { position: 'absolute', width: 10, height: 10, borderRadius: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: FontSizes.caption, fontWeight: FontWeights.bold, letterSpacing: 0.5 },
});
