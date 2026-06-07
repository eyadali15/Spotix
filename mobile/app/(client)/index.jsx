/**
 * Spotix — Dual-Mode Client Home (Premium)
 * 1/3 Map + Mode Switch + 2/3 List
 * Washing: Service selection → Real-time time slots → Checkout
 */
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl, Pressable,
  Dimensions, Animated, Linking, Platform, ScrollView, TextInput, Alert, ActivityIndicator, Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { useFadeIn, useFadeInDown } from '../../utils/animations';
import { Colors, Radius, Shadows } from '../../constants/colors';
import { FontSizes, FontWeights } from '../../constants/typography';
import { t } from '../../constants/i18n';
import Card from '../../components/Card';
import Badge, { getAvailabilityType } from '../../components/Badge';
import Button from '../../components/Button';
import BottomSheet from '../../components/BottomSheet';
import ParkingGrid from '../../components/ParkingGrid';
import PriceComparison from '../../components/PriceComparison';
import useParkingStore from '../../store/parkingStore';
import useWashingStore from '../../store/washingStore';
import useReviewStore from '../../store/reviewStore';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';
import { playSuccess } from '../../utils/sounds';

const { width, height } = Dimensions.get('window');
const MAP_HEIGHT = height * 0.28;
const CAIRO_REGION = { latitude: 30.0444, longitude: 31.2357, latitudeDelta: 0.08, longitudeDelta: 0.08 };

const SERVICE_ICONS = { 'Internal Wash': '🧹', 'External Wash': '💧', 'Chemical Wash': '🧪', 'Polishing': '✨' };
const getServiceIcon = (name) => SERVICE_ICONS[name] || '🔧';

// ==================== MODE SWITCH ====================
function ModeSwitchToggle({ mode, onSwitch }) {
  const slideAnim = useRef(new Animated.Value(mode === 'parking' ? 0 : 1)).current;
  useEffect(() => {
    Animated.spring(slideAnim, { toValue: mode === 'parking' ? 0 : 1, tension: 180, friction: 14, useNativeDriver: false }).start();
  }, [mode]);
  const pillLeft = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [3, (width - 40) / 2 - 1] });
  return (
    <View style={ms.container}>
      <Animated.View style={[ms.pill, { left: pillLeft, width: (width - 40) / 2 - 2 }]} />
      <Pressable style={ms.tab} onPress={() => { onSwitch('parking'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}>
        <Text style={[ms.tabText, mode === 'parking' && ms.tabTextActive]}>🅿️ {t('parkingMode')}</Text>
      </Pressable>
      <Pressable style={ms.tab} onPress={() => { onSwitch('washing'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}>
        <Text style={[ms.tabText, mode === 'washing' && ms.tabTextActive]}>🚿 {t('washingMode')}</Text>
      </Pressable>
    </View>
  );
}
const ms = StyleSheet.create({
  container: { flexDirection: 'row', marginHorizontal: 20, marginVertical: 10, backgroundColor: Colors.surface, borderRadius: Radius.full, height: 48, position: 'relative', borderWidth: 1, borderColor: Colors.border, ...Shadows.sm },
  pill: { position: 'absolute', top: 3, height: 42, backgroundColor: Colors.primary, borderRadius: Radius.full },
  tab: { flex: 1, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  tabText: { fontSize: FontSizes.body, fontWeight: FontWeights.bold, color: Colors.textSecondary },
  tabTextActive: { color: '#FFFFFF' },
});

// ==================== STAR RATING ====================
function StarRating({ rating, size = 16, onRate, interactive = false }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Pressable key={s} onPress={() => interactive && onRate?.(s)} disabled={!interactive}>
          <Text style={{ fontSize: size, opacity: s <= rating ? 1 : 0.25 }}>{s <= rating ? '⭐' : '☆'}</Text>
        </Pressable>
      ))}
    </View>
  );
}

// ==================== PARKING CARD ====================
function ParkingCard({ lot, onPress, index }) {
  const anim = useFadeInDown(index * 60);
  return (
    <Animated.View style={anim}>
      <Card onPress={onPress} pressable style={styles.card}>
        <View style={styles.cardRow}>
          <View style={styles.cardIcon}><Text style={{ fontSize: 20 }}>🅿️</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardName}>{lot.name}</Text>
            <Text style={styles.cardAddr}>📍 {lot.address}</Text>
          </View>
          <Badge type={getAvailabilityType(lot.availableSpots, lot.totalSpots)} />
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.cardStat}><Text style={styles.cardStatBold}>{lot.availableSpots}</Text>/{lot.totalSpots} {t('spots')}</Text>
          <View style={{ alignItems: 'flex-end' }}>
            {lot.oldPrice && lot.oldPrice > lot.pricePerHour && (
              <Text style={styles.oldPrice}>{lot.oldPrice} {t('egp')}</Text>
            )}
            <Text style={styles.cardPrice}>{lot.pricePerHour} {t('egp')}<Text style={styles.cardPriceSub}>/{t('perHour')}</Text></Text>
          </View>
        </View>
        {lot.parkingType && <View style={styles.typeBadge}><Text style={styles.typeText}>{lot.parkingType === 'COVERED' ? '🏗️ Covered' : '☀️ Open'}</Text></View>}
      </Card>
    </Animated.View>
  );
}

// ==================== WASHING CARD ====================
function WashingCard({ location, onPress, index }) {
  const anim = useFadeInDown(index * 60);
  const isBusy = location.busyUntil && new Date(location.busyUntil) > new Date();
  return (
    <Animated.View style={anim}>
      <Card onPress={onPress} pressable style={styles.card}>
        <View style={styles.cardRow}>
          <View style={[styles.cardIcon, { backgroundColor: 'rgba(59,130,246,0.1)' }]}><Text style={{ fontSize: 20 }}>🚿</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardName}>{location.name}</Text>
            <Text style={styles.cardAddr}>📍 {location.address}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <StarRating rating={Math.round(location.rating || 0)} size={12} />
            <View style={[styles.statusBadge, { backgroundColor: isBusy ? Colors.errorLight : Colors.successLight }]}>
              <View style={[styles.statusDot, { backgroundColor: isBusy ? Colors.error : Colors.success }]} />
              <Text style={[styles.statusText, { color: isBusy ? Colors.error : Colors.success }]}>{isBusy ? 'Busy' : 'Free'}</Text>
            </View>
          </View>
        </View>
        <View style={styles.servicesPreview}>
          {(location.services || []).map((s) => (
            <View key={s.id} style={styles.servicePreviewItem}>
              <Text style={styles.servicePreviewIcon}>{getServiceIcon(s.name)}</Text>
              <Text style={styles.servicePreviewName} numberOfLines={1}>{s.name}</Text>
              <Text style={styles.servicePreviewPrice}>{s.price} EGP</Text>
            </View>
          ))}
        </View>
      </Card>
    </Animated.View>
  );
}

// ==================== REVIEWS LIST ====================
function ReviewsList({ locationType, locationId }) {
  const { fetchReviews, getReviews, addReview } = useReviewStore();
  const { user } = useAuthStore();
  const [nr, setNr] = useState(0);
  const [nc, setNc] = useState('');
  const reviews = getReviews(locationType, locationId);
  useEffect(() => { fetchReviews(locationType, locationId); }, [locationType, locationId]);
  const submit = async () => {
    if (nr === 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await addReview(locationType, locationId, nr, nc, user?.name || 'You');
    setNr(0); setNc('');
  };
  return (
    <View style={rv.container}>
      <Text style={rv.title}>⭐ {t('reviews')} ({reviews.length})</Text>
      <View style={rv.form}>
        <StarRating rating={nr} size={24} interactive onRate={setNr} />
        <TextInput style={rv.input} placeholder={t('writeReview')} value={nc} onChangeText={setNc} placeholderTextColor={Colors.textLight} multiline maxLength={200} />
        <Button title={t('submitReview')} onPress={submit} disabled={nr === 0} icon="✍️" style={{ marginTop: 8 }} />
      </View>
      {reviews.map((r, i) => (
        <View key={r.id || i} style={rv.item}>
          <View style={rv.itemHeader}>
            <View style={rv.avatar}><Text style={rv.avatarText}>{r.user?.name?.[0] || '?'}</Text></View>
            <View style={{ flex: 1 }}><Text style={rv.name}>{r.user?.name || 'Anonymous'}</Text><Text style={rv.date}>{new Date(r.createdAt).toLocaleDateString()}</Text></View>
            <StarRating rating={r.rating} size={12} />
          </View>
          {r.comment && <Text style={rv.comment}>{r.comment}</Text>}
        </View>
      ))}
      {reviews.length === 0 && <Text style={rv.empty}>{t('noReviews')}</Text>}
    </View>
  );
}
const rv = StyleSheet.create({
  container: { marginTop: 20 },
  title: { fontSize: FontSizes.subtitle, fontWeight: FontWeights.bold, color: Colors.text, marginBottom: 14 },
  form: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: 12, marginTop: 10, fontSize: FontSizes.body, color: Colors.text, minHeight: 60, textAlignVertical: 'top' },
  item: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primaryFaded, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 14, fontWeight: FontWeights.bold, color: Colors.primary },
  name: { fontSize: FontSizes.body, fontWeight: FontWeights.semibold, color: Colors.text },
  date: { fontSize: FontSizes.small, color: Colors.textLight },
  comment: { fontSize: FontSizes.body, color: Colors.textSecondary, lineHeight: 20 },
  empty: { textAlign: 'center', color: Colors.textLight, paddingVertical: 20 },
});

// ==================== WASHING MULTI-STEP SHEET ====================
function WashingMultiStepSheet({ location, visible, onClose }) {
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState({});
  const [selectedHour, setSelectedHour] = useState(null);
  const [bookingDate, setBookingDate] = useState('today');
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => { if (visible) { setStep(1); setSelected({}); setSelectedHour(null); setBookingDate('today'); setSlots([]); } }, [visible]);

  const toggleService = (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected((p) => ({ ...p, [id]: !p[id] }));
  };

  const locServices = (location?.services || []).map(s => ({ ...s, icon: getServiceIcon(s.name) }));
  const selectedServices = locServices.filter((s) => selected[s.id]);
  const totalPrice = selectedServices.reduce((a, s) => a + s.price, 0);
  const totalDuration = selectedServices.reduce((a, s) => a + s.duration, 0);

  // Fetch real availability from backend
  const fetchAvailability = async (dateParam = bookingDate) => {
    if (!location) return;
    setLoadingSlots(true);
    try {
      const res = await api.get(`/washing/${location.id}/availability?date=${dateParam}`);
      setSlots(res.data.slots || []);
    } catch (e) {
      setSlots([]);
    }
    setLoadingSlots(false);
  };

  const handleDateChange = (date) => {
    setBookingDate(date);
    setSelectedHour(null);
    fetchAvailability(date);
  };

  const goToStep = (s) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
    if (s === 2) fetchAvailability(bookingDate);
    setStep(s);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleConfirm = async () => {
    if (!selectedHour && selectedHour !== 0) {
      Alert.alert('Select a time', 'Please pick an available time slot');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      await api.post('/washing/book', {
        locationId: location.id,
        services: selectedServices.map(s => s.name),
        totalDuration,
        totalPrice,
        bookingHour: selectedHour,
        bookingDate,
      });
      playSuccess();
      Alert.alert('✅ Booked!', `${selectedServices.map(s => s.name).join(', ')}\n💰 ${totalPrice} EGP\n⏱️ ${totalDuration} min\n🕐 ${String(selectedHour).padStart(2, '0')}:00 (${bookingDate === 'today' ? 'Today' : 'Tomorrow'})`);
      onClose();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Booking failed');
    }
  };

  if (!location) return null;

  const getSlotStyle = (s) => {
    if (s.status === 'free') return { bg: Colors.successLight, border: Colors.success, text: Colors.success };
    if (s.status === 'busy') return { bg: Colors.warningLight, border: Colors.warning, text: Colors.warning };
    if (s.status === 'booked') return { bg: Colors.errorLight, border: Colors.error, text: Colors.error };
    return { bg: Colors.surface, border: Colors.border, text: Colors.textLight }; // past
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} snapPoints={[0.72]}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Animated.View style={{ opacity: fadeAnim, paddingBottom: 30 }}>
          {/* Header */}
          <View style={ws.header}>
            <View style={{ flex: 1 }}>
              <Text style={ws.name}>🚿 {location.name}</Text>
              <Text style={ws.addr}>📍 {location.address}</Text>
              <Text style={ws.hours}>🕐 {location.openHours}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <StarRating rating={Math.round(location.rating || 0)} size={14} />
              <Text style={{ fontSize: 10, color: Colors.textLight, marginTop: 2 }}>{location.reviewCount} reviews</Text>
            </View>
          </View>

          {/* Steps */}
          <View style={ws.steps}>
            {['Services', 'Time', 'Checkout'].map((label, i) => (
              <View key={i} style={ws.stepRow}>
                <View style={[ws.stepDot, step >= i + 1 && ws.stepDotActive]}>
                  <Text style={[ws.stepNum, step >= i + 1 && ws.stepNumActive]}>{i + 1}</Text>
                </View>
                <Text style={[ws.stepLabel, step >= i + 1 && ws.stepLabelActive]}>{label}</Text>
                {i < 2 && <View style={[ws.stepLine, step > i + 1 && ws.stepLineActive]} />}
              </View>
            ))}
          </View>

          {/* STEP 1: Services */}
          {step === 1 && (
            <View>
              <Text style={ws.sectionTitle}>Select Services</Text>
              {locServices.map((service) => {
                const on = selected[service.id];
                return (
                  <Pressable key={service.id} onPress={() => toggleService(service.id)} style={[ws.serviceCard, on && ws.serviceCardOn]}>
                    <View style={[ws.serviceIcon, on && ws.serviceIconOn]}><Text style={{ fontSize: 24 }}>{service.icon}</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={ws.serviceName}>{service.name}</Text>
                      <Text style={ws.serviceDur}>⏱️ {service.duration} min</Text>
                    </View>
                    <View style={ws.servicePriceCol}>
                      {service.oldPrice && service.oldPrice > service.price && (
                        <Text style={{ fontSize: 10, color: Colors.textLight, textDecorationLine: 'line-through' }}>{service.oldPrice}</Text>
                      )}
                      <Text style={[ws.servicePrice, on && { color: Colors.secondary }]}>{service.price}</Text>
                      <Text style={ws.serviceCurrency}>EGP</Text>
                    </View>
                    <View style={[ws.checkbox, on && ws.checkboxOn]}>{on && <Text style={ws.check}>✓</Text>}</View>
                  </Pressable>
                );
              })}
              {locServices.length === 0 && <Text style={{ color: Colors.textLight, textAlign: 'center', padding: 20 }}>No services available</Text>}

              {/* Price Comparison — show best savings */}
              {(() => {
                const withOld = locServices.filter(s => s.oldPrice && s.oldPrice > s.price);
                if (withOld.length === 0) return null;
                const best = withOld.reduce((a, b) => (a.oldPrice - a.price) > (b.oldPrice - b.price) ? a : b);
                return <PriceComparison oldPrice={best.oldPrice} newPrice={best.price} unit={`/ ${best.name}`} />;
              })()}
              {selectedServices.length > 0 && (
                <View style={ws.totalBar}>
                  <View><Text style={ws.totalLabel}>{selectedServices.length} service{selectedServices.length > 1 ? 's' : ''}</Text><Text style={ws.totalPrice}>{totalPrice} EGP · {totalDuration} min</Text></View>
                  <Pressable onPress={() => goToStep(2)} style={({ pressed }) => [ws.nextBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}>
                    <Text style={ws.nextBtnText}>Next →</Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}

          {/* STEP 2: Time slots from backend */}
          {step === 2 && (
            <View>
              <Text style={ws.sectionTitle}>Select Time</Text>

              {/* Date Selector Segmented Control */}
              <View style={ws.dateSelector}>
                <Pressable
                  onPress={() => handleDateChange('today')}
                  style={[ws.dateTab, bookingDate === 'today' && ws.dateTabActive]}
                >
                  <Text style={[ws.dateTabText, bookingDate === 'today' && ws.dateTabTextActive]}>
                    📅 Today
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => handleDateChange('tomorrow')}
                  style={[ws.dateTab, bookingDate === 'tomorrow' && ws.dateTabActive]}
                >
                  <Text style={[ws.dateTabText, bookingDate === 'tomorrow' && ws.dateTabTextActive]}>
                    🌅 Tomorrow
                  </Text>
                </Pressable>
              </View>

              {/* Legend */}
              <View style={ws.legend}>
                <View style={ws.legendItem}><View style={[ws.legendDot, { backgroundColor: Colors.success }]} /><Text style={ws.legendText}>Free</Text></View>
                <View style={ws.legendItem}><View style={[ws.legendDot, { backgroundColor: Colors.warning }]} /><Text style={ws.legendText}>Busy</Text></View>
                <View style={ws.legendItem}><View style={[ws.legendDot, { backgroundColor: Colors.error }]} /><Text style={ws.legendText}>Booked</Text></View>
                <View style={ws.legendItem}><View style={[ws.legendDot, { backgroundColor: Colors.textLight }]} /><Text style={ws.legendText}>Past</Text></View>
              </View>

              {loadingSlots ? (
                <ActivityIndicator size="large" color={Colors.secondary} style={{ marginVertical: 30 }} />
              ) : (
                <View style={ws.timeGrid}>
                  {slots.map((slot) => {
                    const st = getSlotStyle(slot);
                    const isFree = slot.status === 'free';
                    const isSelected = selectedHour === slot.hour;
                    return (
                      <Pressable
                        key={slot.hour}
                        disabled={!isFree}
                        onPress={() => { setSelectedHour(slot.hour); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                        style={[ws.timeSlot, { backgroundColor: isSelected ? Colors.secondary : st.bg, borderColor: isSelected ? Colors.secondary : st.border }]}
                      >
                        <Text style={[ws.timeText, { color: isSelected ? '#fff' : st.text }]}>{slot.time}</Text>
                        {!isFree && <Text style={[ws.timeStatus, { color: st.text }]}>{slot.status}</Text>}
                      </Pressable>
                    );
                  })}
                  {slots.length === 0 && <Text style={{ color: Colors.textLight, textAlign: 'center', padding: 20 }}>No slots available</Text>}
                </View>
              )}

              <Pressable onPress={fetchAvailability} style={ws.refreshBtn}>
                <Text style={ws.refreshText}>🔄 Refresh availability</Text>
              </Pressable>

              <View style={ws.navRow}>
                <Pressable onPress={() => goToStep(1)} style={ws.backBtn}><Text style={ws.backBtnText}>← Back</Text></Pressable>
                <Pressable onPress={() => { if (!selectedHour && selectedHour !== 0) { Alert.alert('Pick a time'); return; } goToStep(3); }} style={({ pressed }) => [ws.nextBtn, pressed && { opacity: 0.85 }]}>
                  <Text style={ws.nextBtnText}>Next →</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* STEP 3: Checkout */}
          {step === 3 && (
            <View>
              <Text style={ws.sectionTitle}>Checkout</Text>
              <View style={ws.checkoutCard}>
                <Text style={ws.checkoutTitle}>📋 Order Summary</Text>
                {selectedServices.map((s) => (
                  <View key={s.id} style={ws.checkoutRow}>
                    <Text style={{ fontSize: 16 }}>{s.icon}</Text>
                    <Text style={ws.checkoutName}>{s.name}</Text>
                    <Text style={ws.checkoutItemPrice}>{s.price} EGP</Text>
                  </View>
                ))}
                <View style={ws.divider} />
                <View style={ws.checkoutRow}><Text style={{ fontSize: 16 }}>🕐</Text><Text style={ws.checkoutName}>Time</Text><Text style={ws.checkoutItemPrice}>{selectedHour != null ? `${String(selectedHour).padStart(2, '0')}:00 (${bookingDate === 'today' ? 'Today' : 'Tomorrow'})` : 'Not set'}</Text></View>
                <View style={ws.checkoutRow}><Text style={{ fontSize: 16 }}>⏱️</Text><Text style={ws.checkoutName}>Duration</Text><Text style={ws.checkoutItemPrice}>{totalDuration} min</Text></View>
                <View style={ws.checkoutTotalRow}><Text style={ws.checkoutTotalLabel}>Total</Text><Text style={ws.checkoutTotalPrice}>{totalPrice} EGP</Text></View>
              </View>
              <View style={ws.locationCard}><Text style={{ fontSize: 16 }}>📍</Text><View style={{ flex: 1 }}><Text style={ws.locationName}>{location.name}</Text><Text style={ws.locationAddr}>{location.address}</Text></View></View>
              <View style={ws.navRow}>
                <Pressable onPress={() => goToStep(2)} style={ws.backBtn}><Text style={ws.backBtnText}>← Back</Text></Pressable>
                <Pressable onPress={handleConfirm} style={({ pressed }) => [ws.confirmBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}>
                  <LinearGradient colors={['#3B82F6', '#6366F1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={ws.confirmGrad}>
                    <Text style={ws.confirmText}>Confirm Booking ✓</Text>
                  </LinearGradient>
                </Pressable>
              </View>
              <ReviewsList locationType="WASHING" locationId={location.id} />
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </BottomSheet>
  );
}

const ws = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  name: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  addr: { fontSize: 13, color: Colors.textSecondary },
  hours: { fontSize: 12, color: Colors.textLight, marginTop: 4 },
  steps: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24, gap: 4 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.surface, borderWidth: 2, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  stepDotActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  stepNum: { fontSize: 12, fontWeight: '700', color: Colors.textLight },
  stepNumActive: { color: '#fff' },
  stepLabel: { fontSize: 11, color: Colors.textLight, fontWeight: '600' },
  stepLabelActive: { color: Colors.primary },
  stepLine: { width: 20, height: 2, backgroundColor: Colors.border, marginHorizontal: 2 },
  stepLineActive: { backgroundColor: Colors.primary },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 14 },
  serviceCard: { flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 10, borderRadius: Radius.lg, backgroundColor: '#fff', borderWidth: 1.5, borderColor: Colors.border, gap: 12, ...Shadows.sm },
  serviceCardOn: { borderColor: Colors.secondary, backgroundColor: 'rgba(59,130,246,0.04)' },
  serviceIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' },
  serviceIconOn: { backgroundColor: 'rgba(59,130,246,0.12)' },
  serviceName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  serviceDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  serviceDur: { fontSize: 11, color: Colors.textLight, marginTop: 3 },
  servicePriceCol: { alignItems: 'flex-end', marginRight: 8 },
  servicePrice: { fontSize: 20, fontWeight: '800', color: Colors.text },
  serviceCurrency: { fontSize: 11, color: Colors.textLight },
  checkbox: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  checkboxOn: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  check: { color: '#fff', fontSize: 14, fontWeight: '800' },
  totalBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surface, padding: 16, borderRadius: Radius.lg, marginTop: 10, borderWidth: 1, borderColor: Colors.border },
  totalLabel: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  totalPrice: { fontSize: 18, fontWeight: '800', color: Colors.primary, marginTop: 2 },
  nextBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radius.full },
  nextBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  // Time
  dateSelector: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: Radius.full, padding: 4, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  dateTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: Radius.full },
  dateTabActive: { backgroundColor: Colors.secondary, ...Shadows.sm },
  dateTabText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  dateTabTextActive: { color: '#fff' },
  legend: { flexDirection: 'row', gap: 14, marginBottom: 14, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: Colors.textSecondary },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  timeSlot: { width: (width - 100) / 4, paddingVertical: 10, borderRadius: Radius.md, borderWidth: 1.5, alignItems: 'center' },
  timeText: { fontSize: 14, fontWeight: '700' },
  timeStatus: { fontSize: 9, fontWeight: '600', marginTop: 2 },
  refreshBtn: { alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: Radius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  refreshText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, gap: 12 },
  backBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border },
  backBtnText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  // Checkout
  checkoutCard: { backgroundColor: '#fff', borderRadius: Radius.lg, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: Colors.border, ...Shadows.sm },
  checkoutTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 14 },
  checkoutRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 },
  checkoutName: { flex: 1, fontSize: 14, fontWeight: '500', color: Colors.text },
  checkoutItemPrice: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 4 },
  checkoutTotalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 2, borderTopColor: Colors.primary },
  checkoutTotalLabel: { fontSize: 18, fontWeight: '800', color: Colors.text },
  checkoutTotalPrice: { fontSize: 24, fontWeight: '900', color: Colors.primary },
  locationCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: 14, borderRadius: Radius.lg, marginBottom: 14, gap: 10, borderWidth: 1, borderColor: Colors.border },
  locationName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  locationAddr: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  confirmBtn: { flex: 1, borderRadius: Radius.full, overflow: 'hidden' },
  confirmGrad: { paddingVertical: 14, alignItems: 'center' },
  confirmText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});

// ==================== MAIN SCREEN ====================
export default function ClientHomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { lots, fetchLots, selectedLot, setSelectedLot, clearSelectedLot } = useParkingStore();
  const { locations, fetchLocations, selectedLocation, selectLocation, clearSelected } = useWashingStore();

  const [mode, setMode] = useState('parking');
  const [refreshing, setRefreshing] = useState(false);
  const [showParkingSheet, setShowParkingSheet] = useState(false);
  const [showWashingSheet, setShowWashingSheet] = useState(false);
  const [showFullMap, setShowFullMap] = useState(false);
  const mapRef = useRef(null);
  const fullMapRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => { fetchLots(); fetchLocations(); }, []);
  const onRefresh = useCallback(async () => { setRefreshing(true); await Promise.all([fetchLots(), fetchLocations()]); setRefreshing(false); }, []);

  const switchMode = (m) => {
    if (m === mode) return;
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    setMode(m);
    mapRef.current?.animateToRegion(CAIRO_REGION, 400);
  };

  const handleParkingPress = (lot) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedLot(lot); setShowParkingSheet(true); mapRef.current?.animateToRegion({ latitude: lot.latitude, longitude: lot.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 500); };
  const handleReserve = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); setShowParkingSheet(false); router.push({ pathname: '/(client)/reserve', params: { lotId: selectedLot.id } }); };
  const handleWashingPress = (loc) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); selectLocation(loc); setShowWashingSheet(true); mapRef.current?.animateToRegion({ latitude: loc.latitude, longitude: loc.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 500); };
  const handleGetDirections = (loc) => {
    if (!loc) return; Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const label = encodeURIComponent(loc.name);
    const url = Platform.select({ ios: `maps:0,0?q=${label}@${loc.latitude},${loc.longitude}`, android: `geo:${loc.latitude},${loc.longitude}?q=${loc.latitude},${loc.longitude}(${label})` });
    Linking.openURL(url).catch(() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${loc.latitude},${loc.longitude}`));
  };
  const getMarkerColor = (lot) => { const t = getAvailabilityType(lot.availableSpots, lot.totalSpots); return t === 'available' ? Colors.markerAvailable : t === 'limited' ? Colors.markerLimited : Colors.markerFull; };

  const listData = mode === 'parking' ? lots : locations;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View><Text style={styles.greeting}>👋 {user?.name?.split(' ')[0] || 'Hey'}</Text><Text style={styles.headerTitle}>{mode === 'parking' ? t('findParking') : t('findWashing')}</Text></View>
        <View style={styles.badge}><Text style={styles.badgeText}>{listData.length} {mode === 'parking' ? '🅿️' : '🚿'}</Text></View>
      </View>

      <View style={styles.mapContainer}>
        <MapView ref={mapRef} style={styles.map} initialRegion={CAIRO_REGION} showsUserLocation showsCompass>
          {mode === 'parking'
            ? lots.map(lot => <Marker key={lot.id} coordinate={{ latitude: lot.latitude || 30.0444, longitude: lot.longitude || 31.2357 }} title={lot.name} onPress={() => handleParkingPress(lot)}><View style={styles.emojiMarker}><Text style={{ fontSize: 18 }}>🅿️</Text></View></Marker>)
            : locations.map(loc => <Marker key={loc.id} coordinate={{ latitude: loc.latitude, longitude: loc.longitude }} title={loc.name} onPress={() => handleWashingPress(loc)}><View style={styles.emojiMarker}><Text style={{ fontSize: 18 }}>🚿</Text></View></Marker>)
          }
        </MapView>
        <Pressable onPress={() => { setShowFullMap(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} style={styles.expandMapBtn}>
          <Text style={styles.expandMapText}>⛶</Text>
        </Pressable>
      </View>

      <ModeSwitchToggle mode={mode} onSwitch={switchMode} />

      <Animated.View style={[{ flex: 2, opacity: fadeAnim }]}>
        <View style={styles.listHeader}><Text style={styles.listTitle}>{t('nearYou')}</Text><Text style={styles.listCount}>{listData.length} {mode === 'parking' ? t('spots') : t('locations')}</Text></View>
        <FlatList
          data={listData} keyExtractor={(i) => i.id}
          renderItem={({ item, index }) => mode === 'parking' ? <ParkingCard lot={item} onPress={() => handleParkingPress(item)} index={index} /> : <WashingCard location={item} onPress={() => handleWashingPress(item)} index={index} />}
          contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          ListEmptyComponent={<View style={styles.emptyState}><Text style={{ fontSize: 48 }}>{mode === 'parking' ? '🅿️' : '🚿'}</Text><Text style={styles.emptyText}>{t('noData')}</Text></View>}
        />
      </Animated.View>

      {/* PARKING */}
      <BottomSheet visible={showParkingSheet} onClose={() => { setShowParkingSheet(false); clearSelectedLot(); }} snapPoints={[0.75]}>
        {selectedLot && (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.sheetContent}>
              <View style={styles.sheetHeader}><View style={{ flex: 1 }}><Text style={styles.sheetName}>🅿️ {selectedLot.name}</Text><Text style={styles.sheetAddr}>📍 {selectedLot.address}</Text></View><Badge type={getAvailabilityType(selectedLot.availableSpots, selectedLot.totalSpots)} /></View>
              <ParkingGrid totalSpots={selectedLot.totalSpots} availableSpots={selectedLot.availableSpots} name={selectedLot.name} />
              <View style={styles.sheetStats}>
                <View style={styles.sheetStat}><Text style={styles.sheetStatNum}>{selectedLot.pricePerHour}</Text><Text style={styles.sheetStatLabel}>{t('egp')}/{t('perHour')}</Text></View>
                <View style={styles.sheetStatDivider} />
                <View style={styles.sheetStat}><Text style={styles.sheetStatNum}>{selectedLot.availableSpots}</Text><Text style={styles.sheetStatLabel}>{t('available')}</Text></View>
                <View style={styles.sheetStatDivider} />
                <View style={styles.sheetStat}><Text style={styles.sheetStatNum}>{selectedLot.totalSpots}</Text><Text style={styles.sheetStatLabel}>{t('total')}</Text></View>
              </View>
              <Button title={t('reserve')} onPress={handleReserve} disabled={selectedLot.availableSpots <= 0} icon="🎟️" style={{ marginBottom: 10 }} />
              <Button title={`📍 ${t('getDirections')}`} onPress={() => handleGetDirections(selectedLot)} variant="outline" />
              <ReviewsList locationType="PARKING" locationId={selectedLot.id} />
            </View>
          </ScrollView>
        )}
      </BottomSheet>

      {/* WASHING */}
      <WashingMultiStepSheet location={selectedLocation} visible={showWashingSheet} onClose={() => { setShowWashingSheet(false); clearSelected(); }} />

      {/* FULL SCREEN MAP */}
      <Modal visible={showFullMap} animationType="slide" statusBarTranslucent>
        <View style={styles.fullMapWrap}>
          <MapView
            ref={fullMapRef}
            style={StyleSheet.absoluteFill}
            initialRegion={CAIRO_REGION}
            showsUserLocation
            showsMyLocationButton
            showsCompass
          >
            {mode === 'parking'
              ? lots.map(lot => <Marker key={lot.id} coordinate={{ latitude: lot.latitude || 30.0444, longitude: lot.longitude || 31.2357 }} title={lot.name} onPress={() => { setShowFullMap(false); handleParkingPress(lot); }}><View style={styles.emojiMarker}><Text style={{ fontSize: 18 }}>🅿️</Text></View></Marker>)
              : locations.map(loc => <Marker key={loc.id} coordinate={{ latitude: loc.latitude, longitude: loc.longitude }} title={loc.name} onPress={() => { setShowFullMap(false); handleWashingPress(loc); }}><View style={styles.emojiMarker}><Text style={{ fontSize: 18 }}>🚿</Text></View></Marker>)
            }
          </MapView>
          {/* Done button */}
          <Pressable onPress={() => setShowFullMap(false)} style={styles.fullMapDoneBtn}>
            <Text style={styles.fullMapDoneText}>Done</Text>
          </Pressable>
          {/* My Location button */}
          <Pressable onPress={() => { fullMapRef.current?.animateToRegion(CAIRO_REGION, 500); }} style={styles.fullMapLocBtn}>
            <Text style={styles.fullMapLocText}>📍</Text>
          </Pressable>
          {/* Mode chip */}
          <View style={styles.fullMapModeChip}>
            <Text style={styles.fullMapModeText}>{mode === 'parking' ? `🅿️ ${lots.length} Parking` : `🚿 ${locations.length} Car Wash`}</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 8 },
  greeting: { fontSize: FontSizes.body, color: Colors.textSecondary, marginBottom: 2 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.text },
  badge: { backgroundColor: Colors.primaryFaded, paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.full },
  badgeText: { fontSize: FontSizes.body, fontWeight: '700', color: Colors.primary },
  mapContainer: { marginHorizontal: 16, borderRadius: Radius.xl, overflow: 'hidden', height: MAP_HEIGHT, borderWidth: 1, borderColor: Colors.border },
  map: { flex: 1 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 8 },
  listTitle: { fontSize: FontSizes.subtitle, fontWeight: '700', color: Colors.text },
  listCount: { fontSize: FontSizes.small, color: Colors.textLight, fontWeight: '500' },
  listContent: { paddingHorizontal: 16, paddingBottom: 100, gap: 10 },
  card: { padding: 14 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  cardIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(16,185,129,0.1)', justifyContent: 'center', alignItems: 'center' },
  cardName: { fontSize: FontSizes.bodyLarge, fontWeight: '700', color: Colors.text },
  cardAddr: { fontSize: FontSizes.small, color: Colors.textSecondary, marginTop: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardStat: { fontSize: FontSizes.body, color: Colors.textLight },
  cardStatBold: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  cardPrice: { fontSize: FontSizes.bodyLarge, fontWeight: '700', color: Colors.accent },
  cardPriceSub: { fontSize: FontSizes.small, fontWeight: '400', color: Colors.textLight },
  oldPrice: { fontSize: 11, color: Colors.textLight, textDecorationLine: 'line-through', marginBottom: 1 },
  typeBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(59,130,246,0.08)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 8 },
  typeText: { fontSize: 11, fontWeight: '600', color: Colors.primary },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full, marginTop: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '700' },
  servicesPreview: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10, gap: 6 },
  servicePreviewItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  servicePreviewIcon: { fontSize: 14 },
  servicePreviewName: { flex: 1, fontSize: 12, color: Colors.textSecondary },
  servicePreviewPrice: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: Colors.textLight, marginTop: 12 },
  sheetContent: { paddingTop: 8, paddingBottom: 30 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  sheetName: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  sheetAddr: { fontSize: FontSizes.body, color: Colors.textSecondary },
  sheetStats: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  sheetStat: { alignItems: 'center' },
  sheetStatNum: { fontSize: 22, fontWeight: '800', color: Colors.primary },
  sheetStatLabel: { fontSize: FontSizes.small, color: Colors.textLight, marginTop: 2 },
  sheetStatDivider: { width: 1, backgroundColor: Colors.border },
  emojiMarker: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.primary, ...Shadows.sm },
  expandMapBtn: { position: 'absolute', top: 10, right: 10, width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.95)', justifyContent: 'center', alignItems: 'center', ...Shadows.sm },
  expandMapText: { fontSize: 18, color: Colors.text },
  fullMapWrap: { flex: 1, backgroundColor: '#000' },
  fullMapDoneBtn: { position: 'absolute', top: 56, right: 16, backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: Radius.full, ...Shadows.md },
  fullMapDoneText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  fullMapLocBtn: { position: 'absolute', bottom: 36, right: 16, width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', ...Shadows.md },
  fullMapLocText: { fontSize: 22 },
  fullMapModeChip: { position: 'absolute', top: 56, left: 16, backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.full, ...Shadows.sm },
  fullMapModeText: { fontSize: 14, fontWeight: '700', color: Colors.text },
});
