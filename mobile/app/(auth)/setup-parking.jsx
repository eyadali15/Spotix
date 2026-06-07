/**
 * Spotix — Parking Owner Setup Screen
 * Called after signup to add parking lot details
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform,
  Alert, Pressable, Animated, Keyboard, InputAccessoryView, Button as RNButton,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFadeIn, useFadeInDown } from '../../utils/animations';
import { Colors, Radius, Shadows } from '../../constants/colors';
import { FontSizes, FontWeights } from '../../constants/typography';
import { t } from '../../constants/i18n';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Card from '../../components/Card';
import api from '../../services/api';

const KB_ID = 'setupParkKb';
function KBDone() {
  if (Platform.OS !== 'ios') return null;
  return <InputAccessoryView nativeID={KB_ID}><View style={s.kbBar}><RNButton title="Done" onPress={() => Keyboard.dismiss()} /></View></InputAccessoryView>;
}

export default function ParkingSetupScreen() {
  const router = useRouter();
  const headerAnim = useFadeIn(0);
  const formAnim = useFadeInDown(200);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [totalSpots, setTotalSpots] = useState('');
  const [pricePerHour, setPricePerHour] = useState('');
  const [oldPrice, setOldPrice] = useState('');
  const [parkingType, setParkingType] = useState('UNCOVERED');
  const [openTime, setOpenTime] = useState('0');
  const [closeTime, setCloseTime] = useState('24');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name || !address || !totalSpots || !pricePerHour) {
      Alert.alert(t('error'), 'Please fill in all required fields');
      return;
    }
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      await api.post('/parking', {
        name, address,
        latitude: 30.0444 + (Math.random() * 0.1 - 0.05),
        longitude: 31.2357 + (Math.random() * 0.1 - 0.05),
        totalSpots: parseInt(totalSpots),
        pricePerHour: parseFloat(pricePerHour),
        oldPrice: oldPrice ? parseFloat(oldPrice) : null,
        parkingType,
        openTime: parseInt(openTime),
        closeTime: parseInt(closeTime),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('✅ Success', 'Your parking lot has been created!', [
        { text: 'Go to Dashboard', onPress: () => router.replace('/(owner)') },
      ]);
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t('error'), e.response?.data?.error || 'Failed to create parking');
    }
    setLoading(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <KBDone />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Animated.View style={headerAnim}>
              <Text style={s.emoji}>🅿️</Text>
              <Text style={s.title}>Setup Your Parking</Text>
              <Text style={s.subtitle}>Add your parking lot details to start accepting bookings</Text>
            </Animated.View>

            <Animated.View style={formAnim}>
              <Input label="Parking Name *" value={name} onChangeText={setName} icon="🏷️" inputAccessoryViewID={KB_ID} />
              <Input label="Address *" value={address} onChangeText={setAddress} icon="📍" inputAccessoryViewID={KB_ID} />
              <Input label="Total Spots *" value={totalSpots} onChangeText={t => setTotalSpots(t.replace(/\D/g, ''))} icon="🔢" keyboardType="number-pad" inputAccessoryViewID={KB_ID} />

              {/* Parking Type */}
              <Text style={s.sectionLabel}>Parking Type</Text>
              <View style={s.typeRow}>
                {['COVERED', 'UNCOVERED'].map(type => (
                  <Pressable
                    key={type}
                    onPress={() => { setParkingType(type); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    style={[s.typeBtn, parkingType === type && s.typeBtnActive]}
                  >
                    <Text style={{ fontSize: 22 }}>{type === 'COVERED' ? '🏗️' : '☀️'}</Text>
                    <Text style={[s.typeLabel, parkingType === type && s.typeLabelActive]}>{type === 'COVERED' ? 'Covered' : 'Uncovered'}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Pricing */}
              <Text style={s.sectionLabel}>💰 Pricing</Text>
              <Card style={s.priceCard}>
                <View style={s.priceRow}>
                  <View style={s.priceCol}>
                    <Text style={s.priceLabel}>Without Spotix</Text>
                    <Input value={oldPrice} onChangeText={t => setOldPrice(t.replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad" placeholder="Optional" inputAccessoryViewID={KB_ID} />
                  </View>
                  <Text style={s.priceArrow}>→</Text>
                  <View style={s.priceCol}>
                    <Text style={[s.priceLabel, { color: Colors.primary, fontWeight: '700' }]}>With Spotix *</Text>
                    <Input value={pricePerHour} onChangeText={t => setPricePerHour(t.replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad" placeholder="EGP/hr" inputAccessoryViewID={KB_ID} />
                  </View>
                </View>
                {oldPrice && pricePerHour && parseFloat(oldPrice) > parseFloat(pricePerHour) && (
                  <View style={s.savingsBadge}>
                    <Text style={s.savingsText}>🎉 Save {Math.round(((parseFloat(oldPrice) - parseFloat(pricePerHour)) / parseFloat(oldPrice)) * 100)}% with Spotix!</Text>
                  </View>
                )}
              </Card>

              {/* Hours */}
              <Text style={s.sectionLabel}>⏰ Operating Hours</Text>
              <View style={s.hoursRow}>
                <View style={{ flex: 1 }}>
                  <Input label="Open" value={openTime} onChangeText={t => setOpenTime(t.replace(/\D/g, ''))} keyboardType="number-pad" placeholder="0" inputAccessoryViewID={KB_ID} />
                </View>
                <Text style={s.hoursTo}>to</Text>
                <View style={{ flex: 1 }}>
                  <Input label="Close" value={closeTime} onChangeText={t => setCloseTime(t.replace(/\D/g, ''))} keyboardType="number-pad" placeholder="24" inputAccessoryViewID={KB_ID} />
                </View>
              </View>

              <Button title="Create Parking Lot" onPress={handleCreate} loading={loading} icon="🚀" style={{ marginTop: 12 }} />
              <Pressable onPress={() => router.replace('/(owner)')} style={s.skipBtn}>
                <Text style={s.skipText}>Skip for now →</Text>
              </Pressable>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  scroll: { padding: 24, paddingBottom: 60 },
  emoji: { fontSize: 48, textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.text, textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: 28, lineHeight: 20 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 8, marginTop: 12 },
  typeRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  typeBtn: { flex: 1, alignItems: 'center', padding: 16, borderRadius: Radius.lg, borderWidth: 2, borderColor: Colors.border, backgroundColor: Colors.surface, gap: 6 },
  typeBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryFaded },
  typeLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  typeLabelActive: { color: Colors.primary },
  priceCard: { padding: 16, marginBottom: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  priceCol: { flex: 1 },
  priceLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4, textAlign: 'center' },
  priceArrow: { fontSize: 20, color: Colors.primary, fontWeight: '700', marginTop: 16 },
  savingsBadge: { backgroundColor: '#ECFDF5', borderRadius: Radius.md, padding: 10, marginTop: 8, alignItems: 'center' },
  savingsText: { fontSize: 13, fontWeight: '700', color: '#059669' },
  hoursRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hoursTo: { fontSize: 14, color: Colors.textLight, fontWeight: '600', marginTop: 12 },
  skipBtn: { alignSelf: 'center', marginTop: 20 },
  skipText: { color: Colors.textLight, fontSize: 14, fontWeight: '600' },
  kbBar: { flexDirection: 'row', justifyContent: 'flex-end', padding: 8, backgroundColor: '#f0f0f0', borderTopWidth: 1, borderColor: '#ddd' },
});
