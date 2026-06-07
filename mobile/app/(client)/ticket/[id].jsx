/**
 * Spotix — Ticket Screen (Premium Dark)
 */
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { useFadeIn, useFadeInDown } from '../../../utils/animations';
import { Colors, Radius, Shadows } from '../../../constants/colors';
import { FontSizes, FontWeights } from '../../../constants/typography';
import { t } from '../../../constants/i18n';
import Card from '../../../components/Card';
import Badge from '../../../components/Badge';
import useParkingStore from '../../../store/parkingStore';

export default function TicketScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { reservations } = useParkingStore();
  const res = reservations.find(r => r.id === id);

  const headerAnim = useFadeIn(0);
  const qrAnim = useFadeInDown(200);
  const infoAnim = useFadeInDown(400);

  const formatDate = (d) => d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
  const statusMap = { ACTIVE: 'active', USED: 'used', CANCELLED: 'cancelled' };

  if (!res) return <SafeAreaView style={styles.container}><Text style={styles.loadingText}>{t('loading')}</Text></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Animated.View style={[styles.header, headerAnim]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}><Text style={styles.backArrow}>←</Text></Pressable>
        <Text style={styles.headerTitle}>{t('yourTicket')}</Text>
        <View style={{ width: 44 }} />
      </Animated.View>

      <Animated.View style={[styles.qrSection, qrAnim]}>
        <Card style={styles.qrCard}>
          <View style={styles.qrBg}>
            <QRCode value={res.qrToken || res.id} size={180} color={Colors.primary} backgroundColor={Colors.white} />
          </View>
          <Text style={styles.scanHint}>{t('scanAtEntry')}</Text>
        </Card>
      </Animated.View>

      <Animated.View style={[styles.infoSection, infoAnim]}>
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>{t('parkingLot')}</Text><Text style={styles.infoValue}>🅿️ {res.lotName}</Text></View>
          <View style={styles.divider} />
          <View style={styles.infoRow}><Text style={styles.infoLabel}>{t('reservationId')}</Text><Text style={styles.infoValueSmall}>{res.id?.slice(0, 8)}</Text></View>
          <View style={styles.divider} />
          <View style={styles.infoRow}><Text style={styles.infoLabel}>{t('startTime')}</Text><Text style={styles.infoValue}>{formatDate(res.createdAt)}</Text></View>
          <View style={styles.divider} />
          <View style={styles.infoRow}><Text style={styles.infoLabel}>{t('status')}</Text><Badge type={statusMap[res.status]} /></View>
        </Card>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingText: { textAlign: 'center', marginTop: 100, color: Colors.textSecondary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  backButton: { width: 48, height: 48, borderRadius: 14, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, ...Shadows.md },
  backArrow: { fontSize: 20, color: Colors.text },
  headerTitle: { fontSize: FontSizes.subtitle, fontWeight: FontWeights.bold, color: Colors.text },
  qrSection: { paddingHorizontal: 20, marginBottom: 20 },
  qrCard: { alignItems: 'center', paddingVertical: 32 },
  qrBg: { padding: 20, backgroundColor: Colors.white, borderRadius: Radius.xl, marginBottom: 16, ...Shadows.glow },
  scanHint: { fontSize: FontSizes.body, color: Colors.textSecondary, textAlign: 'center' },
  infoSection: { paddingHorizontal: 20 },
  infoCard: { padding: 0, overflow: 'hidden' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14 },
  infoLabel: { fontSize: FontSizes.body, color: Colors.textSecondary },
  infoValue: { fontSize: FontSizes.body, fontWeight: FontWeights.semibold, color: Colors.text },
  infoValueSmall: { fontSize: FontSizes.small, fontWeight: FontWeights.medium, color: Colors.textLight, fontFamily: 'monospace' },
  divider: { height: 1, backgroundColor: Colors.border, marginHorizontal: 18 },
});
