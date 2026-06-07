/**
 * Spotix — Animated Parking Grid
 * Shows exact totalSpots as car icons. Available = green glow, Occupied = red glow.
 * Used in both client and parking owner dashboards.
 */
import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Colors, Radius, Shadows } from '../constants/colors';
import { FontWeights } from '../constants/typography';
import { t } from '../constants/i18n';

function CarSpot({ available, index }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const delay = Math.min(index * 30, 600);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 350, delay, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 80, friction: 10, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  const bgColor = available ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)';
  const borderColor = available ? '#10B981' : '#EF4444';
  const shadowColor = available ? '#10B981' : '#EF4444';

  return (
    <Animated.View style={[styles.spot, {
      backgroundColor: bgColor,
      borderColor,
      opacity,
      transform: [{ scale }],
      shadowColor,
      shadowOpacity: 0.4,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: available ? 4 : 2,
    }]}>
      <Text style={styles.carEmoji}>🚗</Text>
    </Animated.View>
  );
}

export default function ParkingGrid({ totalSpots, availableSpots, name }) {
  const displayMax = 40;
  const displaySpots = Math.min(totalSpots, displayMax);
  const occupiedCount = totalSpots - availableSpots;
  const cols = Math.min(8, Math.max(4, Math.ceil(Math.sqrt(displaySpots))));

  // Scale available/occupied proportionally if capped
  const scaledAvail = totalSpots > displayMax
    ? Math.round((availableSpots / totalSpots) * displayMax)
    : availableSpots;

  const spots = useMemo(() => {
    const arr = [];
    const occupiedSet = new Set();
    const occ = displaySpots - scaledAvail;
    while (occupiedSet.size < Math.min(occ, displaySpots)) {
      occupiedSet.add(Math.floor(Math.random() * displaySpots));
    }
    for (let i = 0; i < displaySpots; i++) {
      arr.push({ id: i, available: !occupiedSet.has(i) });
    }
    return arr;
  }, [totalSpots, availableSpots]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🏗️ {t('parkingLayout')}</Text>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendLabel}>{t('free')} ({availableSpots})</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendLabel}>{t('taken')} ({occupiedCount})</Text>
          </View>
        </View>
      </View>

      {/* 3D Perspective Grid */}
      <View style={styles.perspectiveWrap}>
        <View style={styles.isometricView}>
          <View style={styles.road} />
          <View style={[styles.grid, { width: cols * 44 }]}>
            {spots.map(spot => (
              <CarSpot key={spot.id} available={spot.available} index={spot.id} />
            ))}
          </View>
          <View style={styles.road} />
        </View>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: '#10B981' }]}>{availableSpots}</Text>
          <Text style={styles.statLabel}>{t('available')}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: '#EF4444' }]}>{occupiedCount}</Text>
          <Text style={styles.statLabel}>{t('occupied')}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: Colors.accent }]}>{totalSpots}</Text>
          <Text style={styles.statLabel}>{t('total')}</Text>
        </View>
      </View>

      {totalSpots > displayMax && (
        <Text style={styles.moreText}>{t('showing')} {displayMax} {t('of')} {totalSpots} {t('spots')}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 14, fontWeight: FontWeights.bold, color: Colors.text },
  legend: { flexDirection: 'row', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 10, color: Colors.textLight, fontWeight: '500' },

  perspectiveWrap: { alignItems: 'center', paddingVertical: 8 },
  isometricView: {
    transform: [{ perspective: 600 }, { rotateX: '35deg' }, { rotateZ: '-5deg' }],
    alignItems: 'center',
  },
  road: { width: '110%', height: 3, backgroundColor: Colors.textLight, opacity: 0.15, borderRadius: 2, marginVertical: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4 },
  spot: {
    width: 38, height: 38,
    borderRadius: 8,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carEmoji: { fontSize: 16 },

  stats: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 14, marginTop: 16, borderWidth: 1, borderColor: Colors.border },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: Colors.border },
  statNum: { fontSize: 20, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 10, color: Colors.textLight, fontWeight: '500' },
  moreText: { fontSize: 10, color: Colors.textLight, textAlign: 'center', marginTop: 8, fontStyle: 'italic' },
});
