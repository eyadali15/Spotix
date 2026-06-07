/**
 * Spotix — Parking Owner Dashboard
 * Revenue calendar (expandable), Recent activity (expandable)
 */
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Animated, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useFadeIn, useFadeInDown } from '../../utils/animations';
import { Colors, Radius, Shadows } from '../../constants/colors';
import { FontSizes, FontWeights } from '../../constants/typography';
import { t, getLanguage } from '../../constants/i18n';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import useAuthStore from '../../store/authStore';
import useParkingStore from '../../store/parkingStore';
import api from '../../services/api';
import { formatDateTime, formatFullDateTime } from '../../utils/timeFormat';

const SPOTIX_COMMISSION = 0.20;

function StatCard({ emoji, label, value, color, delay }) {
  const anim = useFadeInDown(delay, 400);
  return (
    <Animated.View style={[st.statWrap, anim]}>
      <Card style={st.statCard}>
        <View style={[st.statIcon, { backgroundColor: color + '15' }]}><Text style={{ fontSize: 22 }}>{emoji}</Text></View>
        <Text style={[st.statValue, { color }]}>{value}</Text>
        <Text style={st.statLabel}>{label}</Text>
      </Card>
    </Animated.View>
  );
}

function ActivityCard({ reservation, onPress }) {
  const lang = getLanguage(); const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
  const fmt = (d) => formatDateTime(d);
  const statusMap = { ACTIVE: 'active', USED: 'used', CANCELLED: 'cancelled' };
  const price = reservation.price || 0;
  return (
    <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(reservation); }}>
      <Card style={st.actCard}>
        <View style={st.actHeader}>
          <View style={{ flex: 1 }}>
            <Text style={st.actUser}>👤 {reservation.user?.name || 'Unknown'}</Text>
            <Text style={st.actLot}>🅿️ {reservation.lot?.name || 'Unknown'}</Text>
          </View>
          <Badge type={statusMap[reservation.status]} />
        </View>
        <View style={st.actMeta}>
          <View style={{ flex: 1 }}>
            <Text style={st.actTime}>📅 {t('from')}: {fmt(reservation.startTime || reservation.createdAt)}</Text>
            {reservation.endTime && <Text style={st.actTime}>📅 {t('to')}: {fmt(reservation.endTime)}</Text>}
          </View>
          <Text style={st.actPrice}>{price > 0 ? `${price} ${t('egp')}` : '—'}</Text>
        </View>
      </Card>
    </Pressable>
  );
}

// Revenue Calendar component (used in both inline and modal)
function RevenueCalendar({ reservations, compact }) {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const lang = getLanguage(); const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
  const year = selectedMonth.getFullYear(); const month = selectedMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const monthName = selectedMonth.toLocaleString(locale, { month: 'long', year: 'numeric' });
  const weekDays = [t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat')];

  const dailyRevenue = {}; let monthTotal = 0; let monthCount = 0;
  reservations.forEach(r => {
    if (r.status === 'CANCELLED') return;
    const d = new Date(r.createdAt);
    if (d.getMonth() === month && d.getFullYear() === year) {
      const day = d.getDate(); const price = r.price || 0;
      dailyRevenue[day] = (dailyRevenue[day] || 0) + price;
      monthTotal += price; monthCount++;
    }
  });
  const maxDaily = Math.max(...Object.values(dailyRevenue), 1);
  const spotixFee = monthTotal * SPOTIX_COMMISSION;
  const netRevenue = monthTotal - spotixFee;
  const avgDaily = Object.keys(dailyRevenue).length > 0 ? monthTotal / Object.keys(dailyRevenue).length : 0;

  const prevMonth = () => { setSelectedMonth(new Date(year, month - 1, 1)); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); };
  const nextMonth = () => { setSelectedMonth(new Date(year, month + 1, 1)); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(<View key={`e${i}`} style={st.calCell} />);
  for (let d = 1; d <= daysInMonth; d++) {
    const rev = dailyRevenue[d] || 0;
    const intensity = rev > 0 ? Math.max(0.15, rev / maxDaily) : 0;
    const isToday = d === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
    cells.push(
      <View key={d} style={[st.calCell, isToday && st.calCellToday]}>
        <Text style={[st.calDay, isToday && st.calDayToday]}>{d}</Text>
        {rev > 0 && <View style={[st.calDot, { backgroundColor: Colors.success, opacity: intensity }]} />}
        {rev > 0 && <Text style={st.calRev}>{rev}</Text>}
      </View>
    );
  }

  return (
    <View>
      <View style={st.calHeader}>
        <Pressable onPress={prevMonth} style={st.calArr}><Text style={st.calArrT}>‹</Text></Pressable>
        <Text style={st.calMonth}>{monthName}</Text>
        <Pressable onPress={nextMonth} style={st.calArr}><Text style={st.calArrT}>›</Text></Pressable>
      </View>
      <View style={st.calWeekRow}>{weekDays.map(d => <Text key={d} style={st.calWeekDay}>{d}</Text>)}</View>
      <View style={st.calGrid}>{cells}</View>
      <View style={st.revSummary}>
        <View style={st.revRow}><Text style={st.revLabel}>💰 {t('totalRevenue')}</Text><Text style={[st.revVal, { color: Colors.success }]}>{monthTotal.toFixed(0)} {t('egp')}</Text></View>
        <View style={st.revDivider} />
        <View style={st.revRow}><Text style={st.revLabel}>📊 {t('spotixFee')} (20%)</Text><Text style={[st.revVal, { color: Colors.error }]}>-{spotixFee.toFixed(0)} {t('egp')}</Text></View>
        <View style={st.revDivider} />
        <View style={st.revRow}><Text style={[st.revLabel, { fontWeight: '700', color: Colors.text }]}>💵 {t('netRevenue')}</Text><Text style={[st.revVal, { color: Colors.primary, fontWeight: '800', fontSize: 18 }]}>{netRevenue.toFixed(0)} {t('egp')}</Text></View>
        {!compact && (
          <>
            <View style={st.revDivider} />
            <View style={st.revRow}><Text style={st.revLabel}>📋 Transactions</Text><Text style={st.revVal}>{monthCount}</Text></View>
            <View style={st.revDivider} />
            <View style={st.revRow}><Text style={st.revLabel}>📊 Avg/Day</Text><Text style={st.revVal}>{avgDaily.toFixed(0)} {t('egp')}</Text></View>
          </>
        )}
      </View>
    </View>
  );
}

// Activity Detail Modal
function ActivityDetailModal({ visible, reservation, onClose }) {
  if (!reservation) return null;
  const lang = getLanguage(); const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
  const fmt = (d) => formatFullDateTime(d);
  const statusMap = { ACTIVE: 'active', USED: 'used', CANCELLED: 'cancelled' };
  const from = reservation.startTime || reservation.createdAt; const to = reservation.endTime;
  const price = reservation.price || 0; const spotixFee = price * SPOTIX_COMMISSION;
  let dur = '-';
  if (from && to) { const h = Math.round((new Date(to) - new Date(from)) / 3600000 * 10) / 10; dur = `${h} hr`; }
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={st.modalOverlay}>
        <ScrollView style={{ maxHeight: '85%' }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}>
          <View style={st.modalContent}>
            <View style={st.modalHandle} />
            <Text style={st.modalTitle}>{t('reservationDetails')}</Text>
            <Card style={st.detailSection}>
              <Text style={st.detailSecTitle}>👤 {t('clientInfo')}</Text>
              <View style={st.dRow}><Text style={st.dLabel}>{t('clientName')}</Text><Text style={st.dValue}>{reservation.user?.name || '—'}</Text></View>
              <View style={st.dRow}><Text style={st.dLabel}>{t('clientEmail')}</Text><Text style={st.dValue}>{reservation.user?.email || '—'}</Text></View>
              <View style={st.dRow}><Text style={st.dLabel}>{t('clientPhone')}</Text><Text style={st.dValue}>{reservation.user?.phone || '—'}</Text></View>
            </Card>
            <Card style={st.detailSection}>
              <Text style={st.detailSecTitle}>🎟️ {t('reservationInfo')}</Text>
              <View style={st.dRow}><Text style={st.dLabel}>{t('parkingLot')}</Text><Text style={st.dValue}>{reservation.lot?.name || '—'}</Text></View>
              <View style={st.dRow}><Text style={st.dLabel}>{t('from')}</Text><Text style={st.dValue}>{fmt(from)}</Text></View>
              <View style={st.dRow}><Text style={st.dLabel}>{t('to')}</Text><Text style={st.dValue}>{to ? fmt(to) : '—'}</Text></View>
              <View style={st.dRow}><Text style={st.dLabel}>{t('duration')}</Text><Text style={st.dValue}>{dur}</Text></View>
              <View style={st.dRow}><Text style={st.dLabel}>{t('status')}</Text><Badge type={statusMap[reservation.status]} /></View>
            </Card>
            <Card style={st.detailSection}>
              <Text style={st.detailSecTitle}>💰 {t('financial')}</Text>
              <View style={st.dRow}><Text style={st.dLabel}>{t('amountPaid')}</Text><Text style={[st.dValue, { color: Colors.success, fontWeight: '700' }]}>{price} {t('egp')}</Text></View>
              <View style={st.dRow}><Text style={st.dLabel}>{t('spotixFee')}</Text><Text style={[st.dValue, { color: Colors.error }]}>-{spotixFee.toFixed(0)} {t('egp')}</Text></View>
              <View style={st.dRow}><Text style={st.dLabel}>{t('yourEarnings')}</Text><Text style={[st.dValue, { color: Colors.primary, fontWeight: '700' }]}>{(price - spotixFee).toFixed(0)} {t('egp')}</Text></View>
            </Card>
            <Pressable onPress={onClose} style={st.closeBtn}><Text style={st.closeBtnText}>{t('close')}</Text></Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function OwnerDashboard() {
  const { user } = useAuthStore();
  const { ownerLots, fetchOwnerLots } = useParkingStore();
  const [refreshing, setRefreshing] = useState(false);
  const [allReservations, setAllReservations] = useState([]);
  const [selectedRes, setSelectedRes] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [showRevenueFull, setShowRevenueFull] = useState(false);
  const headerAnim = useFadeIn(0);
  const calAnim = useFadeInDown(300);
  const secAnim = useFadeInDown(500);

  useEffect(() => { fetchOwnerLots(); loadActivity(); }, []);
  const loadActivity = async () => { try { const r = await api.get('/reservation/owner/all'); setAllReservations(r.data.reservations || []); } catch {} };
  const onRefresh = useCallback(async () => { setRefreshing(true); await fetchOwnerLots(); await loadActivity(); setRefreshing(false); }, []);

  const totalSpots = ownerLots.reduce((s, l) => s + l.totalSpots, 0);
  const occupied = ownerLots.reduce((s, l) => s + (l.totalSpots - l.availableSpots), 0);
  const activeRes = allReservations.filter(r => r.status === 'ACTIVE').length;
  const totalRev = allReservations.filter(r => r.status !== 'CANCELLED').reduce((s, r) => s + (r.price || 0), 0);
  const recentOnly = allReservations.slice(0, 5);

  return (
    <SafeAreaView style={st.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.secondary} />}>
        <Animated.View style={[st.header, headerAnim]}>
          <View><Text style={st.greeting}>👋 {user?.name?.split(' ')[0] || 'Hey'}</Text><Text style={st.headerTitle}>{t('dashboard')}</Text></View>
        </Animated.View>

        <View style={st.statsGrid}>
          <StatCard emoji="🅿️" label={t('totalSpots')} value={totalSpots} color={Colors.secondary} delay={100} />
          <StatCard emoji="🚗" label={t('occupiedSpots')} value={occupied} color={Colors.warning} delay={200} />
          <StatCard emoji="🎟️" label={t('activeReservations')} value={activeRes} color={Colors.success} delay={300} />
          <StatCard emoji="💰" label={t('revenue')} value={`${totalRev}`} color={Colors.primary} delay={400} />
        </View>

        {/* Revenue Calendar */}
        <Animated.View style={[st.section, calAnim]}>
          <View style={st.sectionHeader}>
            <Text style={st.sectionTitle}>📅 {t('revenueCalendar')}</Text>
            <Pressable onPress={() => { setShowRevenueFull(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} style={st.expandBtn}><Text style={st.expandBtnText}>Expand →</Text></Pressable>
          </View>
          <Card style={{ padding: 16 }}><RevenueCalendar reservations={allReservations} compact /></Card>
        </Animated.View>

        {/* Recent Activity */}
        <Animated.View style={[st.section, secAnim]}>
          <View style={st.sectionHeader}>
            <Text style={st.sectionTitle}>{t('recentActivity')}</Text>
            {allReservations.length > 5 && (
              <Pressable onPress={() => { setShowAllActivity(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} style={st.expandBtn}><Text style={st.expandBtnText}>See All ({allReservations.length}) →</Text></Pressable>
            )}
          </View>
          {recentOnly.length === 0 ? (
            <Card style={st.emptyCard}><Text style={st.emptyText}>📋 {t('noActivityYet')}</Text></Card>
          ) : recentOnly.map(r => <ActivityCard key={r.id} reservation={r} onPress={(res) => { setSelectedRes(res); setShowDetail(true); }} />)}
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <ActivityDetailModal visible={showDetail} reservation={selectedRes} onClose={() => setShowDetail(false)} />

      {/* Full Revenue Modal */}
      <Modal visible={showRevenueFull} animationType="slide" transparent>
        <View style={st.fullOverlay}>
          <View style={st.fullContent}>
            <View style={st.fullHeader}>
              <Text style={st.fullTitle}>📅 Revenue Details</Text>
              <Pressable onPress={() => setShowRevenueFull(false)} style={st.xBtn}><Text style={st.xBtnT}>✕</Text></Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <RevenueCalendar reservations={allReservations} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* All Activity Modal */}
      <Modal visible={showAllActivity} animationType="slide" transparent>
        <View style={st.fullOverlay}>
          <View style={st.fullContent}>
            <View style={st.fullHeader}>
              <Text style={st.fullTitle}>📋 All Activity ({allReservations.length})</Text>
              <Pressable onPress={() => setShowAllActivity(false)} style={st.xBtn}><Text style={st.xBtnT}>✕</Text></Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {allReservations.map(r => <ActivityCard key={r.id} reservation={r} onPress={(res) => { setSelectedRes(res); setShowDetail(true); setShowAllActivity(false); }} />)}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  greeting: { fontSize: FontSizes.body, color: Colors.textSecondary, marginBottom: 2 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: Colors.text },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14 },
  statWrap: { width: '50%', padding: 6 },
  statCard: { alignItems: 'center', paddingVertical: 18 },
  statIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  statValue: { fontSize: 26, fontWeight: '800', marginBottom: 4 },
  statLabel: { fontSize: FontSizes.caption, color: Colors.textSecondary },
  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: FontSizes.subtitle, fontWeight: '700', color: Colors.text },
  expandBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: Colors.primaryFaded },
  expandBtnText: { fontSize: 12, fontWeight: '600', color: Colors.primary },
  emptyCard: { alignItems: 'center', paddingVertical: 30 },
  emptyText: { fontSize: FontSizes.body, color: Colors.textLight },
  actCard: { padding: 14, marginBottom: 10 },
  actHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  actUser: { fontSize: FontSizes.body, fontWeight: '600', color: Colors.text, marginBottom: 2 },
  actLot: { fontSize: FontSizes.small, color: Colors.textSecondary },
  actMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  actTime: { fontSize: FontSizes.caption, color: Colors.textLight, marginBottom: 2 },
  actPrice: { fontSize: FontSizes.bodyLarge, fontWeight: '700', color: Colors.success },
  // Calendar
  calHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  calArr: { width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' },
  calArrT: { fontSize: 20, color: Colors.text, fontWeight: '700' },
  calMonth: { fontSize: FontSizes.bodyLarge, fontWeight: '700', color: Colors.text },
  calWeekRow: { flexDirection: 'row', marginBottom: 8 },
  calWeekDay: { flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '600', color: Colors.textLight, textTransform: 'uppercase' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: '14.28%', alignItems: 'center', paddingVertical: 6, minHeight: 48 },
  calCellToday: { backgroundColor: Colors.secondaryFaded, borderRadius: 10 },
  calDay: { fontSize: 12, color: Colors.textSecondary },
  calDayToday: { color: Colors.secondary, fontWeight: '700' },
  calDot: { width: 6, height: 6, borderRadius: 3, marginTop: 2 },
  calRev: { fontSize: 8, color: Colors.success, fontWeight: '700', marginTop: 1 },
  revSummary: { marginTop: 14, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 14 },
  revRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  revDivider: { height: 1, backgroundColor: Colors.border },
  revLabel: { fontSize: FontSizes.small, color: Colors.textSecondary },
  revVal: { fontSize: FontSizes.body, fontWeight: '600' },
  // Modals
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay || 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, backgroundColor: Colors.textMuted, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 16 },
  modalTitle: { fontSize: FontSizes.title, fontWeight: '700', color: Colors.text, marginBottom: 16 },
  detailSection: { marginBottom: 12, padding: 14 },
  detailSecTitle: { fontSize: FontSizes.body, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  dRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  dLabel: { fontSize: FontSizes.small, color: Colors.textSecondary },
  dValue: { fontSize: FontSizes.body, fontWeight: '600', color: Colors.text },
  closeBtn: { marginTop: 8, backgroundColor: Colors.surface, paddingVertical: 14, borderRadius: Radius.lg, alignItems: 'center' },
  closeBtnText: { color: Colors.text, fontWeight: '700', fontSize: FontSizes.body },
  fullOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  fullContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%' },
  fullHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  fullTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  xBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' },
  xBtnT: { fontSize: 16, color: Colors.textSecondary, fontWeight: '700' },
});
