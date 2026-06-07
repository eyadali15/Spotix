/**
 * Spotix — Wash Owner Dashboard
 * Single store: editable details, services CRUD, busy control, expandable reviews
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, Alert,
  ActivityIndicator, TextInput, Dimensions, Modal, InputAccessoryView, Keyboard, Platform, Button as RNButton,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius, Shadows } from '../../constants/colors';
import api from '../../services/api';
import PaymentCard from '../../components/PaymentCard';
import { formatHourRange, formatTime } from '../../utils/timeFormat';

const { width } = Dimensions.get('window');
const BUSY_OPTIONS = [30, 60, 90, 120];
const KB_ID = 'washKbDone';

function StarRow({ rating, size = 14 }) {
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <Text key={s} style={{ fontSize: size, opacity: s <= rating ? 1 : 0.2 }}>{s <= rating ? '⭐' : '☆'}</Text>
      ))}
    </View>
  );
}

// Keyboard Done bar (iOS)
function KBDoneBar() {
  if (Platform.OS !== 'ios') return null;
  return (
    <InputAccessoryView nativeID={KB_ID}>
      <View style={st.kbBar}>
        <RNButton title="Done" onPress={() => Keyboard.dismiss()} />
      </View>
    </InputAccessoryView>
  );
}

function DoneInput(props) {
  return <TextInput {...props} inputAccessoryViewID={Platform.OS === 'ios' ? KB_ID : undefined} returnKeyType="done" blurOnSubmit={true} onSubmitEditing={() => Keyboard.dismiss()} />;
}

export default function WashDashboard() {
  const [loc, setLoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Edit store
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAddr, setEditAddr] = useState('');
  const [editOpen, setEditOpen] = useState('');
  const [editClose, setEditClose] = useState('');

  // Add service modal
  const [showAddService, setShowAddService] = useState(false);
  const [svcName, setSvcName] = useState('');
  const [svcPrice, setSvcPrice] = useState('');
  const [svcDuration, setSvcDuration] = useState('');
  const [svcOldPrice, setSvcOldPrice] = useState('');

  // Edit service modal
  const [editingSvc, setEditingSvc] = useState(null);
  const [eSvcName, setESvcName] = useState('');
  const [eSvcPrice, setESvcPrice] = useState('');
  const [eSvcDuration, setESvcDuration] = useState('');
  const [eSvcOldPrice, setESvcOldPrice] = useState('');

  // Reviews
  const [showAllReviews, setShowAllReviews] = useState(false);

  const fetchStore = async () => {
    try { const res = await api.get('/washing/owner/mine'); setLoc(res.data.location); } catch { setLoc(null); }
    setLoading(false);
  };

  useEffect(() => { fetchStore(); }, []);
  const onRefresh = useCallback(async () => { setRefreshing(true); await fetchStore(); setRefreshing(false); }, []);

  const startEdit = () => { setEditName(loc.name); setEditAddr(loc.address); setEditOpen(String(loc.openTime)); setEditClose(String(loc.closeTime)); setEditing(true); };
  const saveEdit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActionLoading(true);
    try { await api.put('/washing/owner/update', { name: editName, address: editAddr, openTime: parseInt(editOpen) || 9, closeTime: parseInt(editClose) || 21 }); setEditing(false); await fetchStore(); } catch (e) { Alert.alert('Error', e.response?.data?.error || 'Failed'); }
    setActionLoading(false);
    Keyboard.dismiss();
  };

  const addService = async () => {
    if (!svcName || !svcPrice || !svcDuration) { Alert.alert('Fill all fields'); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActionLoading(true);
    try { await api.post('/washing/owner/service', { name: svcName, price: svcPrice, duration: svcDuration, oldPrice: svcOldPrice || undefined }); setShowAddService(false); setSvcName(''); setSvcPrice(''); setSvcDuration(''); setSvcOldPrice(''); await fetchStore(); } catch (e) { Alert.alert('Error', e.response?.data?.error || 'Failed'); }
    setActionLoading(false);
    Keyboard.dismiss();
  };

  const removeService = (svcId, name) => {
    Alert.alert('Remove Service', `Remove "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => { setActionLoading(true); try { await api.delete(`/washing/owner/service/${svcId}`); await fetchStore(); } catch {} setActionLoading(false); } },
    ]);
  };

  const startEditSvc = (svc) => { setEditingSvc(svc); setESvcName(svc.name); setESvcPrice(String(svc.price)); setESvcDuration(String(svc.duration)); setESvcOldPrice(svc.oldPrice ? String(svc.oldPrice) : ''); };
  const saveEditSvc = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActionLoading(true);
    try {
      await api.delete(`/washing/owner/service/${editingSvc.id}`);
      await api.post('/washing/owner/service', { name: eSvcName, price: eSvcPrice, duration: eSvcDuration, oldPrice: eSvcOldPrice || undefined });
      setEditingSvc(null); await fetchStore();
    } catch (e) { Alert.alert('Error', e.response?.data?.error || 'Failed'); }
    setActionLoading(false);
    Keyboard.dismiss();
  };

  const setBusy = async (min) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); setActionLoading(true);
    try { const r = await api.post(`/washing/${loc.id}/busy`, { busyMinutes: min }); Alert.alert('🔴 Busy', `Busy for ${r.data.busyMinutesRemaining} more minutes`); await fetchStore(); } catch (e) { Alert.alert('Error', e.response?.data?.error || 'Failed'); }
    setActionLoading(false);
  };
  const setFree = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setActionLoading(true);
    try { await api.post(`/washing/${loc.id}/free`); await fetchStore(); } catch {} setActionLoading(false);
  };

  if (loading) return <SafeAreaView style={st.container}><ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 100 }} /></SafeAreaView>;

  if (!loc) return (
    <SafeAreaView style={st.container} edges={['top']}>
      <KBDoneBar />
      <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
        <Text style={{ fontSize: 48, textAlign: 'center', marginTop: 30 }}>🚿</Text>
        <Text style={st.emptyTitle}>Create Your Wash Store</Text>
        <Text style={{ fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: 24 }}>Set up your car wash store to start receiving bookings</Text>

        <Text style={st.inputLabel}>Store Name *</Text>
        <DoneInput style={st.input} value={editName} onChangeText={setEditName} placeholder="e.g. SparkleWash Cairo" />

        <Text style={st.inputLabel}>Address *</Text>
        <DoneInput style={st.input} value={editAddr} onChangeText={setEditAddr} placeholder="e.g. 15 Nasr Road, Heliopolis" />

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}><Text style={st.inputLabel}>Open Hour (0-23)</Text><DoneInput style={st.input} value={editOpen} onChangeText={setEditOpen} keyboardType="numeric" placeholder="9" /></View>
          <View style={{ flex: 1 }}><Text style={st.inputLabel}>Close Hour (0-23)</Text><DoneInput style={st.input} value={editClose} onChangeText={setEditClose} keyboardType="numeric" placeholder="21" /></View>
        </View>

        <Pressable
          onPress={async () => {
            if (!editName.trim() || !editAddr.trim()) { Alert.alert('Error', 'Name and address are required'); return; }
            setActionLoading(true);
            try {
              await api.post('/washing', {
                name: editName.trim(), address: editAddr.trim(),
                latitude: 30.04 + Math.random() * 0.1, longitude: 31.2 + Math.random() * 0.1,
                openTime: parseInt(editOpen) || 9, closeTime: parseInt(editClose) || 21,
              });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('✅ Store Created!', 'Your wash store is live. Start adding services.');
              await fetchStore();
            } catch (e) { Alert.alert('Error', e.response?.data?.error || 'Failed to create store'); }
            setActionLoading(false);
          }}
          style={[st.btnPrimary, { marginTop: 20 }]}
        >
          <Text style={st.btnPrimaryText}>{actionLoading ? 'Creating...' : '🚿 Create Store'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );

  const now = new Date();
  const isBusy = loc.busyUntil && new Date(loc.busyUntil) > now;
  const busyRemaining = isBusy ? Math.ceil((new Date(loc.busyUntil) - now) / 60000) : 0;
  const recentReviews = (loc.reviews || []).slice(0, 3);
  const allReviews = loc.reviews || [];

  return (
    <SafeAreaView style={st.container} edges={['top']}>
      <KBDoneBar />
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {/* Header */}
        <View style={st.header}>
          <Text style={st.headerTitle}>🚿 My Store</Text>
          <View style={[st.statusChip, { backgroundColor: isBusy ? Colors.errorLight : Colors.successLight }]}>
            <View style={[st.statusDot, { backgroundColor: isBusy ? Colors.error : Colors.success }]} />
            <Text style={[st.statusLabel, { color: isBusy ? Colors.error : Colors.success }]}>{isBusy ? 'BUSY' : 'FREE'}</Text>
          </View>
        </View>

        {/* Store Details */}
        <View style={st.card}>
          {editing ? (
            <View>
              <Text style={st.inputLabel}>Store Name</Text>
              <DoneInput style={st.input} value={editName} onChangeText={setEditName} />
              <Text style={st.inputLabel}>Address</Text>
              <DoneInput style={st.input} value={editAddr} onChangeText={setEditAddr} />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}><Text style={st.inputLabel}>Open (0-23)</Text><DoneInput style={st.input} value={editOpen} onChangeText={setEditOpen} keyboardType="numeric" /></View>
                <View style={{ flex: 1 }}><Text style={st.inputLabel}>Close (0-23)</Text><DoneInput style={st.input} value={editClose} onChangeText={setEditClose} keyboardType="numeric" /></View>
              </View>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                <Pressable onPress={() => { setEditing(false); Keyboard.dismiss(); }} style={st.btnOutline}><Text style={st.btnOutlineText}>Cancel</Text></Pressable>
                <Pressable onPress={saveEdit} style={st.btnPrimary}><Text style={st.btnPrimaryText}>💾 Save</Text></Pressable>
              </View>
            </View>
          ) : (
            <View style={st.row}>
              <View style={{ flex: 1 }}>
                <Text style={st.storeName}>{loc.name}</Text>
                <Text style={st.storeAddr}>📍 {loc.address}</Text>
                <Text style={st.storeHours}>🕐 {formatHourRange(loc.openTime, loc.closeTime)}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                  <StarRow rating={Math.round(loc.rating || 0)} />
                  <Text style={st.ratingText}>{loc.rating?.toFixed(1)} ({loc.reviewCount})</Text>
                </View>
              </View>
              <Pressable onPress={startEdit} style={st.editBtn}><Text style={st.editBtnText}>✏️ Edit</Text></Pressable>
            </View>
          )}
        </View>

        {/* Busy Controls */}
        <View style={st.card}>
          <Text style={st.sectionTitle}>⏱️ Availability</Text>
          {isBusy && (
            <View style={st.busyAlert}>
              <Text style={st.busyText}>🔴 Washing — <Text style={{ fontWeight: '800' }}>{busyRemaining} min</Text> remaining</Text>
              <Text style={st.busyUntil}>Until {formatTime(loc.busyUntil)}</Text>
            </View>
          )}
          <Text style={st.helper}>{isBusy ? 'Extend or finish:' : 'Start a wash:'}</Text>
          <View style={st.busyRow}>
            {BUSY_OPTIONS.map(m => (
              <Pressable key={m} onPress={() => setBusy(m)} style={[st.busyBtn, isBusy ? st.busyExtend : st.busyStart]}>
                <Text style={[st.busyBtnText, { color: isBusy ? Colors.warning : Colors.error }]}>{isBusy ? `+${m}m` : `${m}m`}</Text>
              </Pressable>
            ))}
          </View>
          {isBusy && <Pressable onPress={setFree} style={st.freeBtn}><Text style={st.freeBtnText}>🟢 Done — Set Free</Text></Pressable>}
        </View>

        {/* Services */}
        <View style={st.card}>
          <View style={st.row}><Text style={st.sectionTitle}>🛠️ Services & Pricing</Text><Pressable onPress={() => setShowAddService(true)} style={st.addBtn}><Text style={st.addBtnText}>＋ Add</Text></Pressable></View>
          {loc.services?.map(svc => (
            <Pressable key={svc.id} onPress={() => startEditSvc(svc)} style={st.serviceRow}>
              <View style={{ flex: 1 }}>
                <Text style={st.svcName}>{svc.name}</Text>
                <Text style={st.svcDur}>⏱️ {svc.duration} min</Text>
              </View>
              <Text style={st.svcPrice}>{svc.price} EGP</Text>
              <Pressable onPress={() => removeService(svc.id, svc.name)} style={st.removeBtn} hitSlop={8}><Text style={st.removeBtnText}>✕</Text></Pressable>
            </Pressable>
          ))}
          {(!loc.services || loc.services.length === 0) && <Text style={st.empty}>No services yet</Text>}
          <Text style={st.helper}>Tap a service to edit it</Text>
        </View>

        {/* Reviews — show 3 recent + See All */}
        <View style={st.card}>
          <View style={st.row}>
            <Text style={st.sectionTitle}>⭐ Reviews ({allReviews.length})</Text>
            {allReviews.length > 3 && (
              <Pressable onPress={() => setShowAllReviews(true)} style={st.seeAllBtn}><Text style={st.seeAllText}>See All →</Text></Pressable>
            )}
          </View>
          {recentReviews.map((r, i) => (
            <View key={r.id || i} style={st.reviewItem}>
              <View style={st.reviewHeader}>
                <View style={st.reviewAvatar}><Text style={st.reviewAvatarT}>{r.user?.name?.[0] || '?'}</Text></View>
                <View style={{ flex: 1 }}><Text style={st.reviewName}>{r.user?.name || 'Anonymous'}</Text><Text style={st.reviewDate}>{new Date(r.createdAt).toLocaleDateString()}</Text></View>
                <StarRow rating={r.rating} size={12} />
              </View>
              {r.comment && <Text style={st.reviewComment}>{r.comment}</Text>}
            </View>
          ))}
          {allReviews.length === 0 && <Text style={st.empty}>No reviews yet</Text>}
        </View>

        {/* Payment Analytics */}
        <View style={{ paddingHorizontal: 16, marginTop: 4 }}>
          <PaymentCard type="washing" />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Service Modal */}
      <Modal visible={showAddService} transparent animationType="slide">
        <Pressable style={st.modalOverlay} onPress={() => { setShowAddService(false); Keyboard.dismiss(); }}>
          <Pressable style={st.modalContent} onPress={e => e.stopPropagation()}>
            <Text style={st.modalTitle}>Add Service</Text>
            <Text style={st.inputLabel}>Service Name</Text>
            <DoneInput style={st.input} value={svcName} onChangeText={setSvcName} placeholder="e.g. Exterior Wash" placeholderTextColor={Colors.textLight} />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}><Text style={st.inputLabel}>Spotix Price (EGP)</Text><DoneInput style={st.input} value={svcPrice} onChangeText={setSvcPrice} keyboardType="numeric" placeholder="100" placeholderTextColor={Colors.textLight} /></View>
              <View style={{ flex: 1 }}><Text style={st.inputLabel}>Duration (min)</Text><DoneInput style={st.input} value={svcDuration} onChangeText={setSvcDuration} keyboardType="numeric" placeholder="30" placeholderTextColor={Colors.textLight} /></View>
            </View>
            <Text style={st.inputLabel}>Regular Price (Without Spotix) — optional</Text>
            <DoneInput style={st.input} value={svcOldPrice} onChangeText={setSvcOldPrice} keyboardType="numeric" placeholder="Leave empty if none" placeholderTextColor={Colors.textLight} />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <Pressable onPress={() => { setShowAddService(false); Keyboard.dismiss(); }} style={st.btnOutline}><Text style={st.btnOutlineText}>Cancel</Text></Pressable>
              <Pressable onPress={addService} style={st.btnPrimary}><Text style={st.btnPrimaryText}>Add Service</Text></Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Edit Service Modal */}
      <Modal visible={!!editingSvc} transparent animationType="slide">
        <Pressable style={st.modalOverlay} onPress={() => { setEditingSvc(null); Keyboard.dismiss(); }}>
          <Pressable style={st.modalContent} onPress={e => e.stopPropagation()}>
            <Text style={st.modalTitle}>Edit Service</Text>
            <Text style={st.inputLabel}>Service Name</Text>
            <DoneInput style={st.input} value={eSvcName} onChangeText={setESvcName} />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}><Text style={st.inputLabel}>Spotix Price (EGP)</Text><DoneInput style={st.input} value={eSvcPrice} onChangeText={setESvcPrice} keyboardType="numeric" /></View>
              <View style={{ flex: 1 }}><Text style={st.inputLabel}>Duration (min)</Text><DoneInput style={st.input} value={eSvcDuration} onChangeText={setESvcDuration} keyboardType="numeric" /></View>
            </View>
            <Text style={st.inputLabel}>Regular Price (Without Spotix) — optional</Text>
            <DoneInput style={st.input} value={eSvcOldPrice} onChangeText={setESvcOldPrice} keyboardType="numeric" placeholder="Leave empty if none" placeholderTextColor={Colors.textLight} />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <Pressable onPress={() => { setEditingSvc(null); Keyboard.dismiss(); }} style={st.btnOutline}><Text style={st.btnOutlineText}>Cancel</Text></Pressable>
              <Pressable onPress={saveEditSvc} style={st.btnPrimary}><Text style={st.btnPrimaryText}>Save Changes</Text></Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* All Reviews Modal */}
      <Modal visible={showAllReviews} animationType="slide" transparent>
        <View style={st.fullModalOverlay}>
          <View style={st.fullModalContent}>
            <View style={st.fullModalHeader}>
              <Text style={st.fullModalTitle}>⭐ All Reviews ({allReviews.length})</Text>
              <Pressable onPress={() => setShowAllReviews(false)} style={st.closeBtn}><Text style={st.closeBtnText}>✕</Text></Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {allReviews.map((r, i) => (
                <View key={r.id || i} style={st.reviewItem}>
                  <View style={st.reviewHeader}>
                    <View style={st.reviewAvatar}><Text style={st.reviewAvatarT}>{r.user?.name?.[0] || '?'}</Text></View>
                    <View style={{ flex: 1 }}><Text style={st.reviewName}>{r.user?.name || 'Anonymous'}</Text><Text style={st.reviewDate}>{new Date(r.createdAt).toLocaleDateString()}</Text></View>
                    <StarRow rating={r.rating} size={12} />
                  </View>
                  {r.comment && <Text style={st.reviewComment}>{r.comment}</Text>}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {actionLoading && <View style={st.loadOverlay}><ActivityIndicator size="large" color="#fff" /></View>}
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: Colors.text },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.full },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: 12, fontWeight: '800' },
  card: { marginHorizontal: 16, marginBottom: 14, backgroundColor: '#fff', borderRadius: Radius.xl, padding: 18, borderWidth: 1, borderColor: Colors.border, ...Shadows.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  inputLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4, marginTop: 10 },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: Colors.text, backgroundColor: Colors.surface },
  storeName: { fontSize: 20, fontWeight: '800', color: Colors.text },
  storeAddr: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  storeHours: { fontSize: 13, color: Colors.textLight, marginTop: 4 },
  ratingText: { fontSize: 12, color: Colors.textLight },
  editBtn: { backgroundColor: Colors.primaryFaded, paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full },
  editBtnText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  helper: { fontSize: 11, color: Colors.textLight, marginTop: 4 },
  busyAlert: { backgroundColor: Colors.errorLight, borderRadius: Radius.md, padding: 12, marginBottom: 10 },
  busyText: { fontSize: 13, color: Colors.error },
  busyUntil: { fontSize: 11, color: Colors.error, marginTop: 2, opacity: 0.7 },
  busyRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  busyBtn: { flex: 1, paddingVertical: 12, borderRadius: Radius.md, alignItems: 'center', borderWidth: 1.5 },
  busyStart: { borderColor: Colors.error, backgroundColor: Colors.errorLight },
  busyExtend: { borderColor: Colors.warning, backgroundColor: Colors.warningLight },
  busyBtnText: { fontSize: 14, fontWeight: '700' },
  freeBtn: { backgroundColor: Colors.success, paddingVertical: 14, borderRadius: Radius.md, alignItems: 'center' },
  freeBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  addBtn: { backgroundColor: Colors.secondary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full },
  addBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  serviceRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 10 },
  svcName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  svcDur: { fontSize: 11, color: Colors.textLight, marginTop: 2 },
  svcPrice: { fontSize: 16, fontWeight: '800', color: Colors.primary },
  removeBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.errorLight, justifyContent: 'center', alignItems: 'center' },
  removeBtnText: { fontSize: 14, color: Colors.error, fontWeight: '700' },
  seeAllBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: Colors.primaryFaded },
  seeAllText: { fontSize: 12, fontWeight: '600', color: Colors.primary },
  reviewItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  reviewAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primaryFaded, justifyContent: 'center', alignItems: 'center' },
  reviewAvatarT: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  reviewName: { fontSize: 13, fontWeight: '600', color: Colors.text },
  reviewDate: { fontSize: 11, color: Colors.textLight },
  reviewComment: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18, marginLeft: 42 },
  empty: { color: Colors.textLight, textAlign: 'center', paddingVertical: 16 },
  btnOutline: { flex: 1, paddingVertical: 12, borderRadius: Radius.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  btnOutlineText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  btnPrimary: { flex: 1, paddingVertical: 12, borderRadius: Radius.md, alignItems: 'center', backgroundColor: Colors.primary },
  btnPrimaryText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  fullModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  fullModalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' },
  fullModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  fullModalTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' },
  closeBtnText: { fontSize: 16, color: Colors.textSecondary, fontWeight: '700' },
  loadOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginTop: 12 },
  kbBar: { backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border, paddingHorizontal: 16, paddingVertical: 6, alignItems: 'flex-end' },
});
