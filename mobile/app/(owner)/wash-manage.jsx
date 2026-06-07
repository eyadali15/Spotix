/**
 * Spotix — Owner Wash Management Dashboard
 * Set busy/free status, extend busy time, view bookings
 */
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius, Shadows } from '../../constants/colors';
import { FontSizes, FontWeights } from '../../constants/typography';
import { t } from '../../constants/i18n';
import api from '../../services/api';

const BUSY_OPTIONS = [30, 60, 90, 120];

export default function WashManageScreen() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchLocations = async () => {
    try {
      const res = await api.get('/washing/owner/mine');
      setLocations(res.data.locations || []);
    } catch (e) {
      setLocations([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchLocations(); }, []);
  const onRefresh = useCallback(async () => { setRefreshing(true); await fetchLocations(); setRefreshing(false); }, []);

  const setBusy = async (locId, minutes) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setActionLoading(locId);
    try {
      const res = await api.post(`/washing/${locId}/busy`, { busyMinutes: minutes });
      Alert.alert('🔴 Busy', `Busy for ${res.data.busyMinutesRemaining} more minutes`);
      await fetchLocations();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Failed');
    }
    setActionLoading(null);
  };

  const setFree = async (locId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActionLoading(locId);
    try {
      await api.post(`/washing/${locId}/free`);
      Alert.alert('🟢 Free', 'Location is now available');
      await fetchLocations();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Failed');
    }
    setActionLoading(null);
  };

  const now = new Date();

  if (loading) return <SafeAreaView style={s.container}><ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 100 }} /></SafeAreaView>;

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={s.header}>
          <Text style={s.title}>🚿 {t('washManagement') || 'Wash Management'}</Text>
          <Text style={s.subtitle}>{t('manageStatus') || 'Manage your wash stations'}</Text>
        </View>

        {locations.length === 0 && (
          <View style={s.emptyState}><Text style={{ fontSize: 48 }}>🚿</Text><Text style={s.emptyText}>No washing locations yet</Text></View>
        )}

        {locations.map((loc) => {
          const isBusy = loc.busyUntil && new Date(loc.busyUntil) > now;
          const busyRemaining = isBusy ? Math.ceil((new Date(loc.busyUntil) - now) / 60000) : 0;
          const isActioning = actionLoading === loc.id;

          return (
            <View key={loc.id} style={s.card}>
              {/* Header */}
              <View style={s.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardName}>{loc.name}</Text>
                  <Text style={s.cardAddr}>📍 {loc.address}</Text>
                </View>
                <View style={[s.statusBadge, { backgroundColor: isBusy ? Colors.errorLight : Colors.successLight }]}>
                  <View style={[s.statusDot, { backgroundColor: isBusy ? Colors.error : Colors.success }]} />
                  <Text style={[s.statusLabel, { color: isBusy ? Colors.error : Colors.success }]}>
                    {isBusy ? 'BUSY' : 'FREE'}
                  </Text>
                </View>
              </View>

              {/* Busy info */}
              {isBusy && (
                <View style={s.busyInfo}>
                  <Text style={s.busyText}>🔴 Busy for <Text style={s.busyBold}>{busyRemaining} min</Text> more</Text>
                  <Text style={s.busyUntil}>Until {new Date(loc.busyUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
              )}

              {/* Action buttons */}
              {isActioning ? (
                <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 16 }} />
              ) : (
                <View>
                  {isBusy ? (
                    <View>
                      {/* Extend busy */}
                      <Text style={s.sectionLabel}>Extend busy time:</Text>
                      <View style={s.optionsRow}>
                        {BUSY_OPTIONS.map((min) => (
                          <Pressable key={min} onPress={() => setBusy(loc.id, min)} style={({ pressed }) => [s.optionBtn, s.optionExtend, pressed && { opacity: 0.8 }]}>
                            <Text style={s.optionExtendText}>+{min}m</Text>
                          </Pressable>
                        ))}
                      </View>
                      {/* Set free */}
                      <Pressable onPress={() => setFree(loc.id)} style={({ pressed }) => [s.freeBtn, pressed && { opacity: 0.85 }]}>
                        <Text style={s.freeBtnText}>🟢 Set Free (Done Washing)</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <View>
                      {/* Start washing */}
                      <Text style={s.sectionLabel}>Start washing (walk-in or app):</Text>
                      <View style={s.optionsRow}>
                        {BUSY_OPTIONS.map((min) => (
                          <Pressable key={min} onPress={() => setBusy(loc.id, min)} style={({ pressed }) => [s.optionBtn, s.optionBusy, pressed && { opacity: 0.8 }]}>
                            <Text style={s.optionBusyText}>{min}m</Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* Today's bookings */}
              {loc.bookings?.length > 0 && (
                <View style={s.bookingsSection}>
                  <Text style={s.sectionLabel}>📋 Today's Bookings ({loc.bookings.length})</Text>
                  {loc.bookings.map((b) => {
                    let services = [];
                    try { services = JSON.parse(b.services); } catch {}
                    return (
                      <View key={b.id} style={s.bookingItem}>
                        <View style={{ flex: 1 }}>
                          <Text style={s.bookingUser}>👤 {b.user?.name || 'Client'}</Text>
                          <Text style={s.bookingServices}>{Array.isArray(services) ? services.join(', ') : 'Services'}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={s.bookingTime}>{new Date(b.bookingTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                          <View style={[s.bookingStatus, { backgroundColor: b.status === 'COMPLETED' ? Colors.successLight : Colors.warningLight }]}>
                            <Text style={[s.bookingStatusText, { color: b.status === 'COMPLETED' ? Colors.success : Colors.warning }]}>{b.status}</Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: Colors.textLight, marginTop: 12 },
  card: { marginHorizontal: 16, marginBottom: 16, backgroundColor: Colors.white, borderRadius: Radius.xl, padding: 18, borderWidth: 1, borderColor: Colors.border, ...Shadows.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardName: { fontSize: 18, fontWeight: '700', color: Colors.text },
  cardAddr: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: 12, fontWeight: '800' },
  busyInfo: { backgroundColor: Colors.errorLight, borderRadius: Radius.md, padding: 12, marginBottom: 12 },
  busyText: { fontSize: 14, color: Colors.error },
  busyBold: { fontWeight: '800' },
  busyUntil: { fontSize: 12, color: Colors.error, marginTop: 2, opacity: 0.7 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8, marginTop: 8 },
  optionsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  optionBtn: { flex: 1, paddingVertical: 12, borderRadius: Radius.md, alignItems: 'center', borderWidth: 1.5 },
  optionBusy: { borderColor: Colors.error, backgroundColor: Colors.errorLight },
  optionBusyText: { fontSize: 14, fontWeight: '700', color: Colors.error },
  optionExtend: { borderColor: Colors.warning, backgroundColor: Colors.warningLight },
  optionExtendText: { fontSize: 14, fontWeight: '700', color: Colors.warning },
  freeBtn: { backgroundColor: Colors.success, paddingVertical: 14, borderRadius: Radius.md, alignItems: 'center', marginTop: 4 },
  freeBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  bookingsSection: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12, marginTop: 8 },
  bookingItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  bookingUser: { fontSize: 14, fontWeight: '600', color: Colors.text },
  bookingServices: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  bookingTime: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  bookingStatus: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full, marginTop: 4 },
  bookingStatusText: { fontSize: 10, fontWeight: '700' },
});
