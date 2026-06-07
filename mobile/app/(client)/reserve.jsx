/**
 * Spotix — Reserve Screen with Date/Time Picker + State Reset + Arabic locale
 */
import React, { useEffect, useState, useCallback } from 'react';
import { playSuccess } from '../../utils/sounds';
import { View, Text, StyleSheet, Alert, Pressable, Animated, Platform, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFadeIn, useFadeInDown, usePopIn } from '../../utils/animations';
import { Colors, Radius, Shadows } from '../../constants/colors';
import { FontSizes, FontWeights } from '../../constants/typography';
import { t, getLanguage } from '../../constants/i18n';
import Button from '../../components/Button';
import Card from '../../components/Card';
import PriceComparison from '../../components/PriceComparison';
import useParkingStore from '../../store/parkingStore';

export default function ReserveScreen() {
  const router = useRouter();
  const { lotId } = useLocalSearchParams();
  const { selectedLot, fetchLotDetails, createReservation, isLoading } = useParkingStore();
  const [lot, setLot] = useState(null);
  const [reserved, setReserved] = useState(false);
  const [reservationData, setReservationData] = useState(null);

  // Date/time state
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date(Date.now() + 2 * 60 * 60 * 1000));
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const lang = getLanguage();
  const locale = lang === 'ar' ? 'ar-EG' : 'en-US';

  // Reset ALL state every time this screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const now = new Date();
      setReserved(false);
      setReservationData(null);
      setFromDate(now);
      setToDate(new Date(now.getTime() + 2 * 60 * 60 * 1000));
      setShowFromPicker(false);
      setShowToPicker(false);
      // Re-fetch lot data
      if (selectedLot) {
        setLot(selectedLot);
      } else if (lotId) {
        fetchLotDetails(lotId).then(setLot);
      }
    }, [lotId, selectedLot])
  );

  const headerAnim = useFadeIn(0);
  const detailAnim = useFadeInDown(200);
  const timeAnim = useFadeInDown(400);
  const btnAnim = useFadeInDown(600);
  const successAnim = usePopIn(reserved);

  // Duration
  const durationMs = toDate.getTime() - fromDate.getTime();
  const durationHours = Math.max(0, Math.ceil(durationMs / (1000 * 60 * 60)));
  const totalPrice = lot ? durationHours * lot.pricePerHour : 0;

  // Locale-aware formatting
  const formatDate = (d) => d.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' });
  const formatTime = (d) => d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

  const handleFromChange = (event, date) => {
    if (Platform.OS === 'android') setShowFromPicker(false);
    if (date) {
      setFromDate(date);
      if (date >= toDate) setToDate(new Date(date.getTime() + 60 * 60 * 1000));
    }
  };

  const handleToChange = (event, date) => {
    if (Platform.OS === 'android') setShowToPicker(false);
    if (date) {
      if (date <= fromDate) { Alert.alert(t('error'), 'End time must be after start time'); return; }
      setToDate(date);
    }
  };

  const handleReserve = async () => {
    if (!lot) return;
    if (durationHours <= 0) { Alert.alert(t('error'), 'Please select a valid time range'); return; }
    const result = await createReservation(lot.id, fromDate, toDate);
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      playSuccess();
      setReserved(true);
      setReservationData(result.reservation);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t('error'), result.error);
    }
  };

  if (!lot) return <SafeAreaView style={styles.container}><Text style={styles.loadingText}>{t('loading')}</Text></SafeAreaView>;

  if (reserved) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <Animated.View style={successAnim}><Text style={styles.checkEmoji}>✅</Text></Animated.View>
          <Text style={styles.successTitle}>{t('success')}!</Text>
          <Text style={styles.successSubtitle}>{t('spotReserved')}</Text>
          <Card style={styles.successCard}>
            <Text style={styles.confirmLotName}>🅿️ {reservationData?.lotName}</Text>
            <Text style={styles.confirmAddress}>📍 {reservationData?.lotAddress}</Text>
            <View style={styles.confirmDivider} />
            <View style={styles.confirmRow}><Text style={styles.confirmLabel}>{t('from') || 'From'}</Text><Text style={styles.confirmValue}>{formatDate(fromDate)} {formatTime(fromDate)}</Text></View>
            <View style={styles.confirmRow}><Text style={styles.confirmLabel}>{t('to') || 'To'}</Text><Text style={styles.confirmValue}>{formatDate(toDate)} {formatTime(toDate)}</Text></View>
            <View style={styles.confirmRow}><Text style={styles.confirmLabel}>{t('duration') || 'Duration'}</Text><Text style={styles.confirmValue}>{durationHours}h</Text></View>
            <View style={styles.confirmRow}><Text style={styles.confirmLabel}>{t('total') || 'Total'}</Text><Text style={[styles.confirmValue, { color: Colors.accent }]}>{totalPrice} {t('egp')}</Text></View>
          </Card>
          <View style={{ width: '100%', marginTop: 24 }}>
            <Button title={t('viewTicket')} onPress={() => router.push(`/(client)/ticket/${reservationData.id}`)} icon="🎟️" style={{ marginBottom: 12 }} />
            <Button title={t('home')} onPress={() => router.replace('/(client)')} variant="outline" icon="🏠" />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Animated.View style={[styles.header, headerAnim]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}><Text style={styles.backArrow}>←</Text></Pressable>
        <Text style={styles.headerTitle}>{t('reserve')}</Text><View style={{ width: 44 }} />
      </Animated.View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        <Animated.View style={detailAnim}>
          <Card style={styles.detailCard}>
            <Text style={styles.lotName}>🅿️ {lot.name}</Text><Text style={styles.lotAddress}>📍 {lot.address}</Text>
            <View style={styles.statsRow}>
              <View style={styles.stat}><Text style={styles.statValue}>{lot.availableSpots}</Text><Text style={styles.statLabel}>{t('spotsAvailable')}</Text></View>
              <View style={styles.statDivider} />
              <View style={styles.stat}><Text style={styles.statValue}>{lot.pricePerHour} {t('egp')}</Text><Text style={styles.statLabel}>{t('perHour')}</Text></View>
            </View>
          </Card>
        </Animated.View>

        {/* Price Comparison */}
        {lot.oldPrice && lot.oldPrice > lot.pricePerHour && (
          <PriceComparison oldPrice={lot.oldPrice} newPrice={lot.pricePerHour} unit="/hr" />
        )}

        <Animated.View style={timeAnim}>
          <Text style={styles.sectionTitle}>⏰ {t('selectTime') || 'Select Time'}</Text>

          <Card style={styles.timeCard}>
            <View style={styles.timeRow}>
              <View><Text style={styles.timeLabel}>{t('from') || 'From'}</Text><Text style={styles.timeValue}>{formatDate(fromDate)}</Text><Text style={styles.timeValueSm}>{formatTime(fromDate)}</Text></View>
              <Pressable onPress={() => setShowFromPicker(!showFromPicker)} style={styles.changeBtn}><Text style={styles.changeBtnText}>{t('change') || 'Change'}</Text></Pressable>
            </View>
            {showFromPicker && (
              <DateTimePicker value={fromDate} mode="datetime" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={handleFromChange} minimumDate={new Date()} textColor={Colors.text} themeVariant="light" locale={locale} />
            )}
          </Card>

          <Card style={styles.timeCard}>
            <View style={styles.timeRow}>
              <View><Text style={styles.timeLabel}>{t('to') || 'To'}</Text><Text style={styles.timeValue}>{formatDate(toDate)}</Text><Text style={styles.timeValueSm}>{formatTime(toDate)}</Text></View>
              <Pressable onPress={() => setShowToPicker(!showToPicker)} style={styles.changeBtn}><Text style={styles.changeBtnText}>{t('change') || 'Change'}</Text></Pressable>
            </View>
            {showToPicker && (
              <DateTimePicker value={toDate} mode="datetime" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={handleToChange} minimumDate={new Date(fromDate.getTime() + 30 * 60 * 1000)} textColor={Colors.text} themeVariant="light" locale={locale} />
            )}
          </Card>

          <Card style={styles.summaryCard}>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>{t('duration') || 'Duration'}</Text><Text style={styles.summaryValue}>{durationHours} {lang === 'ar' ? 'ساعة' : `hour${durationHours !== 1 ? 's' : ''}`}</Text></View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>{t('rate') || 'Rate'}</Text><Text style={styles.summaryValue}>{lot.pricePerHour} {t('egp')} {t('perHour')}</Text></View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}><Text style={styles.totalLabel}>{t('total') || 'Total'}</Text><Text style={styles.totalValue}>{totalPrice} {t('egp')}</Text></View>
          </Card>
        </Animated.View>

        <Animated.View style={btnAnim}>
          <Button title={`${t('reserve')} — ${totalPrice} ${t('egp')}`} onPress={handleReserve} loading={isLoading} disabled={lot.availableSpots <= 0 || durationHours <= 0} icon="🎟️" style={{ marginBottom: 8 }} />
          <Button title={t('cancel')} onPress={() => router.back()} variant="ghost" />
        </Animated.View>
      </ScrollView>
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
  detailCard: { padding: 24, marginBottom: 20 },
  lotName: { fontSize: 20, fontWeight: FontWeights.extrabold, color: Colors.text, marginBottom: 6 },
  lotAddress: { fontSize: FontSizes.body, color: Colors.textSecondary, marginBottom: 20 },
  statsRow: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 16, borderWidth: 1, borderColor: Colors.border },
  stat: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: Colors.border },
  statValue: { fontSize: 22, fontWeight: FontWeights.extrabold, color: Colors.primary, marginBottom: 4 },
  statLabel: { fontSize: FontSizes.caption, color: Colors.textSecondary },
  sectionTitle: { fontSize: FontSizes.bodyLarge, fontWeight: FontWeights.bold, color: Colors.text, marginBottom: 12 },
  timeCard: { padding: 16, marginBottom: 12 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timeLabel: { fontSize: FontSizes.small, color: Colors.textLight, fontWeight: FontWeights.semibold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  timeValue: { fontSize: FontSizes.bodyLarge, fontWeight: FontWeights.bold, color: Colors.text },
  timeValueSm: { fontSize: FontSizes.body, color: Colors.primary, fontWeight: FontWeights.semibold, marginTop: 2 },
  changeBtn: { backgroundColor: Colors.primaryFaded, paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full },
  changeBtnText: { color: Colors.primary, fontWeight: FontWeights.semibold, fontSize: FontSizes.small },
  summaryCard: { padding: 18, marginBottom: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  summaryDivider: { height: 1, backgroundColor: Colors.border },
  summaryLabel: { fontSize: FontSizes.body, color: Colors.textSecondary },
  summaryValue: { fontSize: FontSizes.body, fontWeight: FontWeights.semibold, color: Colors.text },
  totalLabel: { fontSize: FontSizes.bodyLarge, fontWeight: FontWeights.bold, color: Colors.text },
  totalValue: { fontSize: FontSizes.bodyLarge, fontWeight: FontWeights.extrabold, color: Colors.accent },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  checkEmoji: { fontSize: 72, marginBottom: 24 },
  successTitle: { fontSize: 28, fontWeight: FontWeights.extrabold, color: Colors.success, marginBottom: 8 },
  successSubtitle: { fontSize: FontSizes.bodyLarge, color: Colors.textSecondary, marginBottom: 32 },
  successCard: { width: '100%', padding: 20, marginBottom: 8 },
  confirmLotName: { fontSize: FontSizes.subtitle, fontWeight: FontWeights.bold, color: Colors.text, marginBottom: 4 },
  confirmAddress: { fontSize: FontSizes.body, color: Colors.textSecondary, marginBottom: 16 },
  confirmDivider: { height: 1, backgroundColor: Colors.border, marginBottom: 12 },
  confirmRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  confirmLabel: { fontSize: FontSizes.body, color: Colors.textSecondary },
  confirmValue: { fontSize: FontSizes.body, fontWeight: FontWeights.semibold, color: Colors.text },
});
