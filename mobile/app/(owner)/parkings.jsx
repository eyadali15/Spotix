/**
 * Spotix — Parking Owner — My Parking
 * Single parking view with map, editable details, same card animation style as client
 */
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, Pressable, Alert, TextInput,
  Dimensions, Animated, Keyboard, Platform, InputAccessoryView, Button as RNButton,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import { Colors, Radius, Shadows } from '../../constants/colors';
import { FontSizes, FontWeights } from '../../constants/typography';
import { t } from '../../constants/i18n';
import Card from '../../components/Card';
import Badge, { getAvailabilityType } from '../../components/Badge';
import useParkingStore from '../../store/parkingStore';
import api from '../../services/api';
import PaymentCard from '../../components/PaymentCard';

const { width, height } = Dimensions.get('window');
const MAP_H = height * 0.28;
const KB_ID = 'parkKbDone';

function KBDoneBar() {
  if (Platform.OS !== 'ios') return null;
  return <InputAccessoryView nativeID={KB_ID}><View style={st.kbBar}><RNButton title="Done" onPress={() => Keyboard.dismiss()} /></View></InputAccessoryView>;
}
function DoneInput(props) { return <TextInput {...props} inputAccessoryViewID={Platform.OS === 'ios' ? KB_ID : undefined} returnKeyType="done" blurOnSubmit={true} onSubmitEditing={() => Keyboard.dismiss()} />; }

export default function ParkingsScreen() {
  const { ownerLots, fetchOwnerLots } = useParkingStore();
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const mapRef = useRef(null);

  // Edit fields
  const [eName, setEName] = useState('');
  const [eAddr, setEAddr] = useState('');
  const [eTotal, setETotal] = useState('');
  const [eAvail, setEAvail] = useState('');
  const [ePrice, setEPrice] = useState('');
  const [eOldPrice, setEOldPrice] = useState('');
  const [eParkType, setEParkType] = useState('UNCOVERED');

  // Card expand animation
  const cardScale = useRef(new Animated.Value(0.95)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => { fetchOwnerLots(); }, []);
  useEffect(() => {
    Animated.parallel([
      Animated.spring(cardScale, { toValue: 1, tension: 60, friction: 12, useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [ownerLots]);

  const onRefresh = useCallback(async () => { setRefreshing(true); await fetchOwnerLots(); setRefreshing(false); }, []);

  // Get first parking lot (single parking per owner)
  const lot = ownerLots.length > 0 ? ownerLots[0] : null;

  const startEdit = () => {
    if (!lot) return;
    setEName(lot.name); setEAddr(lot.address); setETotal(String(lot.totalSpots)); setEAvail(String(lot.availableSpots)); setEPrice(String(lot.pricePerHour));
    setEOldPrice(lot.oldPrice ? String(lot.oldPrice) : ''); setEParkType(lot.parkingType || 'UNCOVERED');
    setEditing(true);
  };

  const cancelEdit = () => { setEditing(false); Keyboard.dismiss(); };

  const saveEdit = async () => {
    if (!lot) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    try {
      await api.put(`/parking/${lot.id}`, {
        name: eName, address: eAddr,
        totalSpots: parseInt(eTotal) || lot.totalSpots,
        availableSpots: parseInt(eAvail) || lot.availableSpots,
        pricePerHour: parseFloat(ePrice) || lot.pricePerHour,
        oldPrice: eOldPrice ? parseFloat(eOldPrice) : null,
        parkingType: eParkType,
      });
      setEditing(false);
      await fetchOwnerLots();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Failed to save');
    }
    setSaving(false);
    Keyboard.dismiss();
  };

  const focusOnMap = () => {
    if (lot && mapRef.current) {
      mapRef.current.animateToRegion({ latitude: lot.latitude, longitude: lot.longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 }, 500);
    }
  };

  return (
    <SafeAreaView style={st.container} edges={['top']}>
      <KBDoneBar />
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {/* Map */}
        <View style={st.mapWrap}>
          <MapView
            ref={mapRef}
            style={st.map}
            initialRegion={lot ? { latitude: lot.latitude, longitude: lot.longitude, latitudeDelta: 0.015, longitudeDelta: 0.015 } : { latitude: 30.0444, longitude: 31.2357, latitudeDelta: 0.08, longitudeDelta: 0.08 }}
          >
            {lot && <Marker coordinate={{ latitude: lot.latitude, longitude: lot.longitude }} title={lot.name}><View style={st.marker}><Text style={{ fontSize: 18 }}>🅿️</Text></View></Marker>}
          </MapView>
        </View>

        <View style={st.header}>
          <Text style={st.headerTitle}>🅿️ My Parking</Text>
          {lot && <Badge type={getAvailabilityType(lot.availableSpots, lot.totalSpots)} />}
        </View>

        {!lot ? (
          <View style={{ padding: 20 }}>
            <Text style={{ fontSize: 48, textAlign: 'center', marginTop: 10 }}>🅿️</Text>
            <Text style={st.emptyTitle}>Create Your Parking Lot</Text>
            <Text style={st.emptyDesc}>Set up your parking lot to start receiving reservations</Text>
            <View style={{ marginTop: 16 }}>
              <Text style={st.label}>Parking Name *</Text>
              <DoneInput style={st.input} value={eName} onChangeText={setEName} placeholder="e.g. Downtown Garage" />
              <Text style={st.label}>Address *</Text>
              <DoneInput style={st.input} value={eAddr} onChangeText={setEAddr} placeholder="e.g. 10 Tahrir St, Cairo" />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}><Text style={st.label}>Total Spots *</Text><DoneInput style={st.input} value={eTotal} onChangeText={setETotal} keyboardType="numeric" placeholder="20" /></View>
                <View style={{ flex: 1 }}><Text style={st.label}>Price/hr (EGP) *</Text><DoneInput style={st.input} value={ePrice} onChangeText={setEPrice} keyboardType="numeric" placeholder="15" /></View>
              </View>
              <Text style={st.label}>Old Price (Without Spotix) — optional</Text>
              <DoneInput style={st.input} value={eOldPrice} onChangeText={setEOldPrice} keyboardType="numeric" placeholder="Leave empty if none" />
              <Text style={st.label}>Parking Type</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
                {['COVERED', 'UNCOVERED'].map(pt => (
                  <Pressable key={pt} onPress={() => { setEParkType(pt); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} style={[st.typeChip, eParkType === pt && st.typeChipActive]}>
                    <Text style={{ fontSize: 18 }}>{pt === 'COVERED' ? '🏗️' : '☀️'}</Text>
                    <Text style={[st.typeChipText, eParkType === pt && st.typeChipTextActive]}>{pt === 'COVERED' ? 'Covered' : 'Uncovered'}</Text>
                  </Pressable>
                ))}
              </View>
              <Pressable
                onPress={async () => {
                  if (!eName.trim() || !eAddr.trim() || !eTotal || !ePrice) { Alert.alert('Error', 'Name, address, total spots, and price are required'); return; }
                  setSaving(true);
                  try {
                    await api.post('/parking', {
                      name: eName.trim(), address: eAddr.trim(),
                      latitude: 30.04 + Math.random() * 0.1, longitude: 31.2 + Math.random() * 0.1,
                      totalSpots: parseInt(eTotal), availableSpots: parseInt(eTotal),
                      pricePerHour: parseFloat(ePrice),
                      oldPrice: eOldPrice ? parseFloat(eOldPrice) : null,
                      parkingType: eParkType,
                    });
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    Alert.alert('✅ Parking Created!', 'Your parking lot is now live.');
                    await fetchOwnerLots();
                  } catch (e) { Alert.alert('Error', e.response?.data?.error || 'Failed'); }
                  setSaving(false);
                }}
                style={[st.btnPrimary, { marginTop: 16 }]}
              >
                <Text style={st.btnPrimaryText}>{saving ? 'Creating...' : '🅿️ Create Parking Lot'}</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Animated.View style={[st.cardWrap, { opacity: cardOpacity, transform: [{ scale: cardScale }] }]}>
            <Card style={st.card}>
              {editing ? (
                /* EDIT MODE */
                <View>
                  <Text style={st.label}>Parking Name</Text>
                  <DoneInput style={st.input} value={eName} onChangeText={setEName} />

                  <Text style={st.label}>Address</Text>
                  <DoneInput style={st.input} value={eAddr} onChangeText={setEAddr} />

                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}><Text style={st.label}>Total Spots</Text><DoneInput style={st.input} value={eTotal} onChangeText={setETotal} keyboardType="numeric" /></View>
                    <View style={{ flex: 1 }}><Text style={st.label}>Available</Text><DoneInput style={st.input} value={eAvail} onChangeText={setEAvail} keyboardType="numeric" /></View>
                  </View>

                  <Text style={st.label}>Price per Hour (EGP) — With Spotix</Text>
                  <DoneInput style={st.input} value={ePrice} onChangeText={setEPrice} keyboardType="numeric" />

                  <Text style={st.label}>Old Price (Without Spotix) — optional</Text>
                  <DoneInput style={st.input} value={eOldPrice} onChangeText={setEOldPrice} keyboardType="numeric" placeholder="Leave empty if none" />

                  <Text style={st.label}>Parking Type</Text>
                  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
                    {['COVERED', 'UNCOVERED'].map(pt => (
                      <Pressable key={pt} onPress={() => { setEParkType(pt); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} style={[st.typeChip, eParkType === pt && st.typeChipActive]}>
                        <Text style={{ fontSize: 18 }}>{pt === 'COVERED' ? '🏗️' : '☀️'}</Text>
                        <Text style={[st.typeChipText, eParkType === pt && st.typeChipTextActive]}>{pt === 'COVERED' ? 'Covered' : 'Uncovered'}</Text>
                      </Pressable>
                    ))}
                  </View>

                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                    <Pressable onPress={cancelEdit} style={st.btnOutline}><Text style={st.btnOutlineText}>Cancel</Text></Pressable>
                    <Pressable onPress={saveEdit} style={st.btnPrimary}><Text style={st.btnPrimaryText}>{saving ? 'Saving...' : '💾 Save'}</Text></Pressable>
                  </View>
                </View>
              ) : (
                /* VIEW MODE */
                <View>
                  <View style={st.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={st.lotName}>{lot.name}</Text>
                      <Text style={st.lotAddr}>📍 {lot.address}</Text>
                    </View>
                    <Pressable onPress={startEdit} style={st.editBtn}><Text style={st.editBtnText}>✏️ Edit</Text></Pressable>
                  </View>

                  {/* Stats row */}
                  <View style={st.statsRow}>
                    <View style={st.statBox}>
                      <Text style={st.statBoxValue}>{lot.availableSpots}</Text>
                      <Text style={st.statBoxLabel}>Available</Text>
                    </View>
                    <View style={st.statDivider} />
                    <View style={st.statBox}>
                      <Text style={st.statBoxValue}>{lot.totalSpots}</Text>
                      <Text style={st.statBoxLabel}>Total Spots</Text>
                    </View>
                    <View style={st.statDivider} />
                    <View style={st.statBox}>
                      <Text style={[st.statBoxValue, { color: Colors.primary }]}>{lot.pricePerHour}</Text>
                      <Text style={st.statBoxLabel}>EGP/hr</Text>
                    </View>
                  </View>

                  {/* Details */}
                  <View style={st.detailsSection}>
                    <View style={st.detailRow}><Text style={st.detailLabel}>📍 Location</Text><Pressable onPress={focusOnMap}><Text style={st.detailLink}>Show on Map</Text></Pressable></View>
                    <View style={st.detailRow}><Text style={st.detailLabel}>📐 Coordinates</Text><Text style={st.detailVal}>{lot.latitude?.toFixed(4)}, {lot.longitude?.toFixed(4)}</Text></View>
                    <View style={st.detailRow}><Text style={st.detailLabel}>🆔 Lot ID</Text><Text style={st.detailValSmall}>{lot.id?.substring(0, 12)}...</Text></View>
                    <View style={st.detailRow}>
                      <Text style={st.detailLabel}>📊 Occupancy</Text>
                      <View style={st.occBar}>
                        <View style={[st.occFill, { width: `${((lot.totalSpots - lot.availableSpots) / lot.totalSpots * 100) || 0}%` }]} />
                      </View>
                      <Text style={st.occText}>{Math.round((lot.totalSpots - lot.availableSpots) / lot.totalSpots * 100)}%</Text>
                    </View>
                  </View>
                </View>
              )}
            </Card>
          </Animated.View>
        )}

        {/* Payment Analytics */}
        {lot && (
          <View style={{ paddingHorizontal: 16, marginTop: 4 }}>
            <PaymentCard type="parking" lotId={lot.id} />
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  mapWrap: { height: MAP_H, overflow: 'hidden' },
  map: { flex: 1 },
  marker: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', ...Shadows.sm },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.text },
  cardWrap: { paddingHorizontal: 16 },
  card: { padding: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  lotName: { fontSize: 22, fontWeight: '800', color: Colors.text },
  lotAddr: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  editBtn: { backgroundColor: Colors.primaryFaded, paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full },
  editBtnText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  statsRow: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: Radius.lg, marginTop: 16, padding: 16 },
  statBox: { flex: 1, alignItems: 'center' },
  statBoxValue: { fontSize: 28, fontWeight: '800', color: Colors.text },
  statBoxLabel: { fontSize: 11, color: Colors.textLight, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: Colors.border, marginVertical: 4 },
  detailsSection: { marginTop: 16 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  detailLabel: { fontSize: 13, color: Colors.textSecondary },
  detailVal: { fontSize: 13, fontWeight: '600', color: Colors.text },
  detailValSmall: { fontSize: 11, fontWeight: '500', color: Colors.textLight, fontFamily: 'monospace' },
  detailLink: { fontSize: 13, fontWeight: '600', color: Colors.secondary },
  occBar: { width: 60, height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
  occFill: { height: 6, backgroundColor: Colors.primary, borderRadius: 3 },
  occText: { fontSize: 12, fontWeight: '700', color: Colors.text, marginLeft: 6, width: 36 },
  // Edit mode
  label: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4, marginTop: 12 },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: Colors.text, backgroundColor: Colors.surface },
  btnOutline: { flex: 1, paddingVertical: 12, borderRadius: Radius.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  btnOutlineText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  btnPrimary: { flex: 1, paddingVertical: 12, borderRadius: Radius.md, alignItems: 'center', backgroundColor: Colors.primary },
  btnPrimaryText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  kbBar: { backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border, paddingHorizontal: 16, paddingVertical: 6, alignItems: 'flex-end' },
  emptyWrap: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginTop: 12 },
  emptyDesc: { fontSize: 13, color: Colors.textLight, marginTop: 4 },
  typeChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface },
  typeChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryFaded },
  typeChipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  typeChipTextActive: { color: Colors.primary },
});
