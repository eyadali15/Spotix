/**
 * Spotix — Wash Owner Bookings
 * Lists all bookings with scan/start/complete actions
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl, Pressable, Alert,
  ActivityIndicator, TextInput, Modal, Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius, Shadows } from '../../constants/colors';
import { FontSizes, FontWeights } from '../../constants/typography';
import api from '../../services/api';
import { playSuccess, playFail } from '../../utils/sounds';
import { formatDateTime } from '../../utils/timeFormat';

const { width } = Dimensions.get('window');
const SCAN_SIZE = width * 0.7;

export default function WashBookingsScreen() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [actionLoading, setActionLoading] = useState(null);

  // Scanner modal
  const [showScanner, setShowScanner] = useState(false);
  const [scanTarget, setScanTarget] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [manualCode, setManualCode] = useState('');

  const fetchBookings = async () => {
    try {
      const res = await api.get('/washing/owner/mine');
      setBookings(res.data.bookings || []);
    } catch { setBookings([]); }
    setLoading(false);
  };

  useEffect(() => { fetchBookings(); }, []);
  const onRefresh = useCallback(async () => { setRefreshing(true); await fetchBookings(); setRefreshing(false); }, []);

  const handleScan = async (qrToken) => {
    if (!qrToken) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setActionLoading('scan');
    try {
      const res = await api.post('/washing/owner/scan', { qrToken: qrToken.trim() });
      playSuccess();
      Alert.alert('✅ Wash Started', res.data.message);
      setShowScanner(false);
      setManualCode('');
      setScanTarget(null);
      await fetchBookings();
    } catch (e) {
      playFail();
      Alert.alert('❌ Error', e.response?.data?.error || 'Scan failed');
    }
    setActionLoading(null);
    setScanned(false);
  };

  const handleComplete = (bookingId) => {
    Alert.alert('Complete Wash', 'Mark this wash as completed?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Complete', onPress: async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setActionLoading(bookingId);
        try {
          await api.post(`/washing/owner/complete/${bookingId}`);
          playSuccess();
          await fetchBookings();
        } catch (e) { Alert.alert('Error', e.response?.data?.error || 'Failed'); }
        setActionLoading(null);
      }},
    ]);
  };

  const openScanner = (booking) => {
    setScanTarget(booking);
    setScanned(false);
    setManualCode('');
    setShowScanner(true);
  };

  const handleBarcodeScanned = ({ data }) => {
    if (scanned) return;
    setScanned(true);
    handleScan(data);
  };

  const filters = ['ALL', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
  const filtered = filter === 'ALL' ? bookings : bookings.filter(b => b.status === filter);

  const statusColors = {
    PENDING: { bg: Colors.warningLight, text: Colors.warning, label: 'Pending' },
    CONFIRMED: { bg: Colors.primaryFaded, text: Colors.primary, label: 'Confirmed' },
    IN_PROGRESS: { bg: 'rgba(59,130,246,0.12)', text: Colors.secondary, label: 'Washing' },
    COMPLETED: { bg: Colors.successLight, text: Colors.success, label: 'Done' },
    CANCELLED: { bg: Colors.errorLight, text: Colors.error, label: 'Cancelled' },
  };

  const fmtTime = (d) => formatDateTime(d);

  const renderBooking = ({ item: b, index }) => {
    const sc = statusColors[b.status] || statusColors.PENDING;
    let services = [];
    try { services = JSON.parse(b.services); } catch {}

    return (
      <View style={s.bookingCard}>
        {/* Header */}
        <View style={s.bookingHeader}>
          <View style={{ flex: 1 }}>
            <Text style={s.clientName}>👤 {b.user?.name || 'Client'}</Text>
            <Text style={s.clientPhone}>📱 {b.user?.phone || '-'}</Text>
          </View>
          <View style={[s.statusPill, { backgroundColor: sc.bg }]}>
            <Text style={[s.statusPillText, { color: sc.text }]}>{sc.label}</Text>
          </View>
        </View>

        {/* Services */}
        <View style={s.serviceChips}>
          {(Array.isArray(services) ? services : []).map((svc, i) => (
            <View key={i} style={s.serviceChip}><Text style={s.serviceChipText}>{svc}</Text></View>
          ))}
        </View>

        {/* Meta */}
        <View style={s.metaRow}>
          <View style={s.metaItem}><Text style={s.metaLabel}>Time</Text><Text style={s.metaValue}>{formatDateTime(b.bookingTime)}</Text></View>
          <View style={s.metaItem}><Text style={s.metaLabel}>Duration</Text><Text style={s.metaValue}>{b.totalDuration} min</Text></View>
          <View style={s.metaItem}><Text style={s.metaLabel}>Price</Text><Text style={[s.metaValue, { color: Colors.primary, fontWeight: '800' }]}>{b.totalPrice} EGP</Text></View>
        </View>

        {/* Actions */}
        {b.status === 'CONFIRMED' && (
          <Pressable onPress={() => openScanner(b)} style={({ pressed }) => [s.scanBtn, pressed && { opacity: 0.85 }]}>
            {actionLoading === b.id ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.scanBtnText}>📷 Scan QR & Start Wash</Text>}
          </Pressable>
        )}
        {b.status === 'IN_PROGRESS' && (
          <Pressable onPress={() => handleComplete(b.id)} style={({ pressed }) => [s.completeBtn, pressed && { opacity: 0.85 }]}>
            {actionLoading === b.id ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.completeBtnText}>✅ Mark as Completed</Text>}
          </Pressable>
        )}

        {/* QR Token (small) */}
        {b.status !== 'COMPLETED' && b.status !== 'CANCELLED' && (
          <Text style={s.qrTokenLabel}>QR: <Text style={s.qrTokenText}>{b.qrToken?.substring(0, 18)}...</Text></Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <Text style={s.headerTitle}>📋 Bookings</Text>
        <Text style={s.headerCount}>{bookings.length} total</Text>
      </View>

      {/* Filters */}
      <FlatList
        horizontal data={filters} keyExtractor={f => f} showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filterRow}
        renderItem={({ item: f }) => {
          const labels = { ALL: `All (${bookings.length})`, CONFIRMED: 'Confirmed', IN_PROGRESS: 'In Progress', COMPLETED: 'Completed', CANCELLED: 'Cancelled' };
          return (
            <Pressable onPress={() => { setFilter(f); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} style={[s.filterChip, filter === f && s.filterChipActive]}>
              <Text style={[s.filterText, filter === f && s.filterTextActive]}>{labels[f] || f}</Text>
            </Pressable>
          );
        }}
      />

      <FlatList
        data={filtered} keyExtractor={b => b.id} renderItem={renderBooking}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={<View style={s.emptyWrap}><Text style={{ fontSize: 48 }}>📋</Text><Text style={s.emptyTitle}>No bookings</Text></View>}
      />

      {/* Scanner Modal */}
      <Modal visible={showScanner} animationType="slide" transparent={false}>
        <SafeAreaView style={s.scannerContainer}>
          <View style={s.scannerHeader}>
            <Pressable onPress={() => { setShowScanner(false); setScanned(false); }} style={s.scannerClose}>
              <Text style={s.scannerCloseText}>✕ Close</Text>
            </Pressable>
            <Text style={s.scannerTitle}>Scan Booking QR</Text>
          </View>

          {scanTarget && (
            <View style={s.scanTargetInfo}>
              <Text style={s.scanTargetName}>👤 {scanTarget.user?.name}</Text>
              <Text style={s.scanTargetTime}>{formatDateTime(scanTarget.bookingTime)} · {scanTarget.totalPrice} EGP</Text>
            </View>
          )}

          {permission?.granted ? (
            <View style={s.cameraWrap}>
              <CameraView
                style={s.camera}
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
              />
              <View style={s.scanOverlay}>
                <View style={s.scanFrame} />
              </View>
            </View>
          ) : (
            <View style={s.permWrap}>
              <Text style={s.permText}>Camera permission needed</Text>
              <Pressable onPress={requestPermission} style={s.permBtn}><Text style={s.permBtnText}>Grant Access</Text></Pressable>
            </View>
          )}

          <View style={s.manualWrap}>
            <Text style={s.manualLabel}>Or enter QR code manually:</Text>
            <View style={s.manualRow}>
              <TextInput style={s.manualInput} value={manualCode} onChangeText={setManualCode} placeholder="Paste QR token" placeholderTextColor={Colors.textLight} returnKeyType="done" blurOnSubmit />
              <Pressable onPress={() => handleScan(manualCode)} style={s.manualBtn}>
                {actionLoading === 'scan' ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.manualBtnText}>Start</Text>}
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: Colors.text },
  headerCount: { fontSize: 13, color: Colors.textLight },
  filterRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 12, height: 40 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, height: 34, justifyContent: 'center' },
  filterChipActive: { backgroundColor: Colors.primaryFaded, borderColor: Colors.primary },
  filterText: { fontSize: 11, color: Colors.textLight, fontWeight: '600' },
  filterTextActive: { color: Colors.primary, fontWeight: '700' },
  list: { paddingHorizontal: 16, paddingBottom: 100, gap: 12 },
  bookingCard: { backgroundColor: '#fff', borderRadius: Radius.xl, padding: 16, borderWidth: 1, borderColor: Colors.border, ...Shadows.sm },
  bookingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  clientName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  clientPhone: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  statusPillText: { fontSize: 10, fontWeight: '800' },
  serviceChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  serviceChip: { backgroundColor: Colors.primaryFaded, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  serviceChipText: { fontSize: 11, color: Colors.primary, fontWeight: '600' },
  metaRow: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  metaItem: {},
  metaLabel: { fontSize: 10, color: Colors.textLight, marginBottom: 2 },
  metaValue: { fontSize: 13, fontWeight: '600', color: Colors.text },
  scanBtn: { backgroundColor: Colors.secondary, paddingVertical: 14, borderRadius: Radius.md, alignItems: 'center', marginBottom: 6 },
  scanBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  completeBtn: { backgroundColor: Colors.success, paddingVertical: 14, borderRadius: Radius.md, alignItems: 'center', marginBottom: 6 },
  completeBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  qrTokenLabel: { fontSize: 10, color: Colors.textLight },
  qrTokenText: { fontFamily: 'monospace', color: Colors.textSecondary },
  emptyWrap: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginTop: 12 },
  // Scanner modal
  scannerContainer: { flex: 1, backgroundColor: '#000' },
  scannerHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  scannerClose: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full },
  scannerCloseText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  scannerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  scanTargetInfo: { backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 16, padding: 12, borderRadius: Radius.md, marginBottom: 12 },
  scanTargetName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  scanTargetTime: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },
  cameraWrap: { flex: 1, position: 'relative' },
  camera: { flex: 1 },
  scanOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  scanFrame: { width: SCAN_SIZE, height: SCAN_SIZE, borderWidth: 2, borderColor: Colors.secondary, borderRadius: 16 },
  permWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  permText: { color: '#fff', fontSize: 16, marginBottom: 16 },
  permBtn: { backgroundColor: Colors.secondary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radius.full },
  permBtnText: { color: '#fff', fontWeight: '700' },
  manualWrap: { padding: 16 },
  manualLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 8 },
  manualRow: { flexDirection: 'row', gap: 10 },
  manualInput: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 10, color: '#fff', fontSize: 13 },
  manualBtn: { backgroundColor: Colors.secondary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: Radius.md, justifyContent: 'center' },
  manualBtnText: { color: '#fff', fontWeight: '700' },
});
