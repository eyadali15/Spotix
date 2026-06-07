/**
 * Spotix — My Tickets (Parking + Wash toggle with QR codes)
 */
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Pressable, Animated, Alert, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFadeIn, useFadeInDown } from '../../utils/animations';
import { Colors, Radius, Shadows } from '../../constants/colors';
import { FontSizes, FontWeights } from '../../constants/typography';
import { t } from '../../constants/i18n';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import useParkingStore from '../../store/parkingStore';
import api from '../../services/api';
import QRCode from 'react-native-qrcode-svg';
import { formatDateTime } from '../../utils/timeFormat';

const { width } = Dimensions.get('window');

function ParkingTicketCard({ reservation, onViewTicket, onCancel, onExtend, index }) {
  const anim = useFadeInDown(index * 60);
  const fmt = (d) => formatDateTime(d);
  const statusMap = { ACTIVE: 'active', USED: 'used', CANCELLED: 'cancelled' };
  return (
    <Animated.View style={anim}>
      <Card style={s.card}>
        <View style={s.cardHeader}>
          <View style={{ flex: 1 }}><Text style={s.cardLot}>🅿️ {reservation.lotName}</Text><Text style={s.cardAddr}>📍 {reservation.lotAddress}</Text></View>
          <Badge type={statusMap[reservation.status]} />
        </View>
        <View style={s.cardMeta}>
          <View style={s.metaItem}><Text style={s.metaLabel}>{t('startTime')}</Text><Text style={s.metaValue}>{fmt(reservation.createdAt)}</Text></View>
          {reservation.endTime && <View style={s.metaItem}><Text style={s.metaLabel}>End</Text><Text style={s.metaValue}>{fmt(reservation.endTime)}</Text></View>}
          <View style={s.metaItem}><Text style={s.metaLabel}>{t('price')}</Text><Text style={s.metaValue}>{reservation.price || '—'} {t('egp')}</Text></View>
        </View>
        {reservation.status === 'ACTIVE' && (
          <View style={s.cardActions}>
            <Button title={t('viewTicket')} onPress={onViewTicket} icon="🎟️" style={{ flex: 1 }} />
            <Pressable onPress={() => onExtend?.(reservation)} style={s.extendBtn}><Text style={s.extendText}>⏰ {t('extendTime')}</Text></Pressable>
            <Pressable onPress={onCancel} style={s.cancelBtn}><Text style={s.cancelText}>{t('cancel')}</Text></Pressable>
          </View>
        )}
      </Card>
    </Animated.View>
  );
}

function WashTicketCard({ booking, index }) {
  const anim = useFadeInDown(index * 60);
  const fmt = (d) => formatDateTime(d);
  let services = [];
  try { services = JSON.parse(booking.services); } catch {}
  const statusColors = {
    CONFIRMED: { bg: Colors.primaryFaded, text: Colors.primary, label: 'Confirmed' },
    IN_PROGRESS: { bg: 'rgba(59,130,246,0.12)', text: Colors.secondary, label: 'Washing...' },
    COMPLETED: { bg: Colors.successLight, text: Colors.success, label: 'Completed' },
    CANCELLED: { bg: Colors.errorLight, text: Colors.error, label: 'Cancelled' },
  };
  const sc = statusColors[booking.status] || statusColors.CONFIRMED;

  return (
    <Animated.View style={anim}>
      <Card style={s.card}>
        <View style={s.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={s.cardLot}>🚿 {booking.location?.name || 'Car Wash'}</Text>
            <Text style={s.cardAddr}>📍 {booking.location?.address || ''}</Text>
          </View>
          <View style={[s.statusPill, { backgroundColor: sc.bg }]}>
            <Text style={[s.statusPillText, { color: sc.text }]}>{sc.label}</Text>
          </View>
        </View>
        <View style={s.servicesList}>
          {(Array.isArray(services) ? services : []).map((svc, i) => (
            <View key={i} style={s.serviceChip}><Text style={s.serviceChipText}>{svc}</Text></View>
          ))}
        </View>
        <View style={s.cardMeta}>
          <View style={s.metaItem}><Text style={s.metaLabel}>Time</Text><Text style={s.metaValue}>{fmt(booking.bookingTime)}</Text></View>
          <View style={s.metaItem}><Text style={s.metaLabel}>Duration</Text><Text style={s.metaValue}>{booking.totalDuration || 0} min</Text></View>
          <View style={s.metaItem}><Text style={s.metaLabel}>Total</Text><Text style={[s.metaValue, { color: Colors.primary, fontWeight: '800' }]}>{booking.totalPrice || 0} EGP</Text></View>
        </View>

        {/* QR Code — real rendered QR */}
        {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && booking.qrToken && (
          <View style={s.qrSection}>
            <View style={s.qrBadge}>
              <Text style={s.qrLabel}>🎟️ Show this QR code at the wash store</Text>
              <View style={s.qrCodeWrap}>
                <QRCode value={booking.qrToken} size={180} color={Colors.primary} backgroundColor="#fff" />
              </View>
              <Text style={s.qrHint}>The staff will scan this to start your wash</Text>
            </View>
          </View>
        )}
      </Card>
    </Animated.View>
  );
}

export default function ReservationsScreen() {
  const router = useRouter();
  const { reservations, fetchReservations, cancelReservation } = useParkingStore();
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('parking');
  const [filter, setFilter] = useState('ALL');
  const [washBookings, setWashBookings] = useState([]);
  const headerAnim = useFadeIn(0);
  const pillAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { fetchReservations(); fetchWashBookings(); }, []);
  const fetchWashBookings = async () => { try { const res = await api.get('/washing/bookings/mine'); setWashBookings(res.data.bookings || []); } catch { setWashBookings([]); } };
  const onRefresh = useCallback(async () => { setRefreshing(true); await Promise.all([fetchReservations(), fetchWashBookings()]); setRefreshing(false); }, []);

  const switchTab = (t) => {
    if (t === tab) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.spring(pillAnim, { toValue: t === 'parking' ? 0 : 1, tension: 180, friction: 14, useNativeDriver: false }).start();
    setTab(t); setFilter('ALL');
  };
  const pillLeft = pillAnim.interpolate({ inputRange: [0, 1], outputRange: [3, (width - 40) / 2 - 1] });

  const parkingFiltered = filter === 'ALL' ? reservations : reservations.filter(r => r.status === filter);
  const washFiltered = filter === 'ALL' ? washBookings : washBookings.filter(b => b.status === filter);
  const listData = tab === 'parking' ? parkingFiltered : washFiltered;

  const handleCancel = (resId) => {
    Alert.alert(t('cancelReservation'), t('confirmDelete'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('confirm'), style: 'destructive', onPress: async () => { const r = await cancelReservation(resId); if (r.success) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); else Alert.alert(t('error'), r.error); } },
    ]);
  };

  const handleExtend = (reservation) => {
    const hours = [1, 2, 3, 5];
    Alert.alert(
      `⏰ ${t('extendTime')}`,
      'How many extra hours do you need?',
      hours.map(h => ({
        text: `+${h} hour${h > 1 ? 's' : ''}`,
        onPress: async () => {
          try {
            const baseEnd = reservation.endTime ? new Date(reservation.endTime) : new Date();
            const newEnd = new Date(baseEnd.getTime() + h * 3600000);
            await api.put(`/reservation/${reservation.id}/extend`, { newEndTime: newEnd.toISOString() });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('✅', `Booking extended by ${h} hour${h > 1 ? 's' : ''}!`);
            fetchReservations();
          } catch (e) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert(t('error'), e.response?.data?.error || 'Failed to extend');
          }
        },
      })).concat([{ text: t('cancel'), style: 'cancel' }]),
    );
  };

  const parkingFilters = ['ALL', 'ACTIVE', 'USED', 'CANCELLED'];
  const washFilters = ['ALL', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'];

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <Animated.View style={[s.header, headerAnim]}><Text style={s.headerTitle}>My Tickets</Text></Animated.View>
      <View style={s.toggleContainer}>
        <Animated.View style={[s.togglePill, { left: pillLeft, width: (width - 40) / 2 - 2 }]} />
        <Pressable style={s.toggleTab} onPress={() => switchTab('parking')}><Text style={[s.toggleText, tab === 'parking' && s.toggleTextActive]}>🅿️ Parking</Text></Pressable>
        <Pressable style={s.toggleTab} onPress={() => switchTab('wash')}><Text style={[s.toggleText, tab === 'wash' && s.toggleTextActive]}>🚿 Car Wash</Text></Pressable>
      </View>
      <View style={s.filters}>
        {(tab === 'parking' ? parkingFilters : washFilters).map(f => (
          <Pressable key={f} onPress={() => { setFilter(f); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} style={[s.filterChip, filter === f && s.filterChipActive]}>
            <Text style={[s.filterText, filter === f && s.filterTextActive]}>{f === 'ALL' ? 'All' : f.replace('_', ' ')}</Text>
          </Pressable>
        ))}
      </View>
      <FlatList data={listData} keyExtractor={i => i.id}
        renderItem={({ item, index }) => tab === 'parking'
          ? <ParkingTicketCard reservation={item} index={index} onViewTicket={() => router.push(`/(client)/ticket/${item.id}`)} onCancel={() => handleCancel(item.id)} onExtend={handleExtend} />
          : <WashTicketCard booking={item} index={index} />}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={<View style={s.emptyState}><Text style={{ fontSize: 48 }}>{tab === 'parking' ? '🅿️' : '🚿'}</Text><Text style={s.emptyTitle}>{tab === 'parking' ? 'No parking tickets' : 'No wash bookings'}</Text></View>}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingVertical: 12 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.text },
  toggleContainer: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 12, backgroundColor: Colors.surface, borderRadius: Radius.full, height: 44, position: 'relative', borderWidth: 1, borderColor: Colors.border },
  togglePill: { position: 'absolute', top: 3, height: 38, backgroundColor: Colors.primary, borderRadius: Radius.full },
  toggleTab: { flex: 1, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  toggleText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  toggleTextActive: { color: '#fff' },
  filters: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 14 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  filterChipActive: { backgroundColor: Colors.primaryFaded, borderColor: Colors.primary },
  filterText: { fontSize: 11, color: Colors.textLight, fontWeight: '600' },
  filterTextActive: { color: Colors.primary, fontWeight: '700' },
  list: { paddingHorizontal: 20, paddingBottom: 100, gap: 14 },
  card: { padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardLot: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  cardAddr: { fontSize: 12, color: Colors.textSecondary },
  cardMeta: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  metaItem: {},
  metaLabel: { fontSize: 11, color: Colors.textLight, marginBottom: 2 },
  metaValue: { fontSize: 13, fontWeight: '600', color: Colors.text },
  cardActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.error },
  cancelText: { fontSize: 13, fontWeight: '600', color: Colors.error },
  extendBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.primary, backgroundColor: Colors.primaryFaded },
  extendText: { fontSize: 12, fontWeight: '600', color: Colors.primary },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  statusPillText: { fontSize: 10, fontWeight: '700' },
  servicesList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  serviceChip: { backgroundColor: Colors.primaryFaded, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  serviceChipText: { fontSize: 11, color: Colors.primary, fontWeight: '600' },
  qrSection: { marginTop: 4 },
  qrBadge: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 20, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  qrLabel: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 16 },
  qrCodeWrap: { padding: 12, backgroundColor: '#fff', borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, marginBottom: 12 },
  qrHint: { fontSize: 11, color: Colors.textLight },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginTop: 12 },
});
