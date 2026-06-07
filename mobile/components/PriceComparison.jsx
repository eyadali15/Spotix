/**
 * Spotix — Price Comparison UI
 * Shows "Without Spotix" vs "With Spotix" prices with animated reveal
 */
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Colors, Radius, Shadows } from '../constants/colors';

export default function PriceComparison({ oldPrice, newPrice, unit = '/hr' }) {
  if (!oldPrice || !newPrice || oldPrice <= newPrice) return null;

  const savings = Math.round(((oldPrice - newPrice) / oldPrice) * 100);
  const slideIn = useRef(new Animated.Value(0)).current;
  const scaleNew = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(slideIn, { toValue: 1, duration: 600, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
      Animated.spring(scaleNew, { toValue: 1, tension: 120, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const translateY = slideIn.interpolate({ inputRange: [0, 1], outputRange: [30, 0] });

  return (
    <Animated.View style={[s.container, { opacity: slideIn, transform: [{ translateY }] }]}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>💎 Spotix Advantage</Text>
        <View style={s.savingsBadge}>
          <Text style={s.savingsText}>Save {savings}%</Text>
        </View>
      </View>

      {/* Comparison Row */}
      <View style={s.compRow}>
        {/* Without Spotix */}
        <View style={s.priceBox}>
          <Text style={s.priceLabel}>🏪 Regular Price</Text>
          <Text style={s.oldPrice}>{oldPrice} EGP</Text>
          <Text style={s.perUnit}>{unit}</Text>
          <View style={s.strikethrough} />
        </View>

        {/* Arrow */}
        <View style={s.arrowWrap}>
          <Text style={s.arrowText}>→</Text>
        </View>

        {/* With Spotix */}
        <Animated.View style={[s.priceBox, s.priceBoxNew, { transform: [{ scale: scaleNew }] }]}>
          <Text style={s.priceLabel}>⚡ Spotix Price</Text>
          <Text style={s.newPrice}>{newPrice} EGP</Text>
          <Text style={[s.perUnit, { color: Colors.primary }]}>{unit}</Text>
        </Animated.View>
      </View>

      {/* Savings callout */}
      <View style={s.callout}>
        <Text style={s.calloutText}>
          You save <Text style={s.calloutBold}>{oldPrice - newPrice} EGP</Text> every time with Spotix! 🎉
        </Text>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: Radius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.md,
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
  },
  title: { fontSize: 16, fontWeight: '800', color: Colors.text },
  savingsBadge: {
    backgroundColor: 'rgba(16,185,129,0.12)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: Radius.full,
  },
  savingsText: { fontSize: 12, fontWeight: '800', color: '#10B981' },
  compRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14,
  },
  priceBox: {
    flex: 1, alignItems: 'center', padding: 14,
    backgroundColor: 'rgba(239,68,68,0.04)', borderRadius: Radius.lg,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.15)',
    position: 'relative',
  },
  priceBoxNew: {
    backgroundColor: Colors.primaryFaded,
    borderColor: Colors.primary, borderWidth: 2,
  },
  priceLabel: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4 },
  oldPrice: { fontSize: 22, fontWeight: '800', color: '#EF4444', textDecorationLine: 'line-through' },
  newPrice: { fontSize: 22, fontWeight: '800', color: Colors.primary },
  perUnit: { fontSize: 11, color: Colors.textLight, marginTop: 2 },
  strikethrough: {
    position: 'absolute', top: '50%', left: 10, right: 10,
    height: 2, backgroundColor: 'rgba(239,68,68,0.3)', transform: [{ rotate: '-8deg' }],
  },
  arrowWrap: { width: 28, alignItems: 'center' },
  arrowText: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  callout: {
    backgroundColor: 'rgba(16,185,129,0.06)', borderRadius: Radius.md,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  calloutText: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
  calloutBold: { fontWeight: '800', color: '#10B981' },
});
