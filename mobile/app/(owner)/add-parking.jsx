/**
 * Spotix — Add Parking (Premium Dark)
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, Pressable, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFadeIn, useFadeInDown } from '../../utils/animations';
import { Colors, Radius, Shadows } from '../../constants/colors';
import { FontSizes, FontWeights } from '../../constants/typography';
import { t } from '../../constants/i18n';
import Input from '../../components/Input';
import Button from '../../components/Button';

import useParkingStore from '../../store/parkingStore';

export default function AddParkingScreen() {
  const router = useRouter();
  const { createParkingLot, isLoading } = useParkingStore();
  const [form, setForm] = useState({ name: '', address: '', latitude: '30.0444', longitude: '31.2357', totalSpots: '', pricePerHour: '' });
  const headerAnim = useFadeIn(0);
  const formAnim = useFadeInDown(200);

  const updateField = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

  const handleSave = async () => {
    if (!form.name || !form.address || !form.totalSpots || !form.pricePerHour) { Alert.alert(t('error'), 'Please fill in all required fields'); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return; }
    const result = await createParkingLot({ name: form.name, address: form.address, latitude: parseFloat(form.latitude), longitude: parseFloat(form.longitude), totalSpots: parseInt(form.totalSpots), pricePerHour: parseFloat(form.pricePerHour) });
    if (result.success) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); router.back(); } else Alert.alert(t('error'), result.error);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.header, headerAnim]}>
            <Pressable onPress={() => router.back()} style={styles.backButton}><Text style={styles.backArrow}>←</Text></Pressable>
            <Text style={styles.headerTitle}>{t('addParking')}</Text><View style={{ width: 44 }} />
          </Animated.View>
          <Animated.View style={formAnim}>
            <Input label={t('parkingName')} value={form.name} onChangeText={(v) => updateField('name', v)} icon="🅿️" autoCapitalize="words" />
            <Input label={t('address')} value={form.address} onChangeText={(v) => updateField('address', v)} icon="📍" autoCapitalize="sentences" />
            <View style={styles.row}><Input label={t('latitude')} value={form.latitude} onChangeText={(v) => updateField('latitude', v)} icon="🌍" keyboardType="decimal-pad" style={{ flex: 1 }} /><Input label={t('longitude')} value={form.longitude} onChangeText={(v) => updateField('longitude', v)} icon="🌍" keyboardType="decimal-pad" style={{ flex: 1 }} /></View>
            <View style={styles.row}><Input label={t('totalSpotsCount')} value={form.totalSpots} onChangeText={(v) => updateField('totalSpots', v)} icon="🚗" keyboardType="number-pad" style={{ flex: 1 }} /><Input label={t('pricePerHour')} value={form.pricePerHour} onChangeText={(v) => updateField('pricePerHour', v)} icon="💰" keyboardType="decimal-pad" style={{ flex: 1 }} /></View>
            <View style={styles.hintBox}><Text style={styles.hintText}>💡 Default coordinates point to Cairo center.</Text></View>
            <Button title={t('save')} onPress={handleSave} loading={isLoading} icon="✅" style={{ marginBottom: 8 }} />
            <Button title={t('cancel')} onPress={() => router.back()} variant="ghost" />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backButton: { width: 48, height: 48, borderRadius: 14, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, ...Shadows.md },
  backArrow: { fontSize: 20, color: Colors.text },
  headerTitle: { fontSize: FontSizes.subtitle, fontWeight: FontWeights.bold, color: Colors.text },
  row: { flexDirection: 'row', gap: 12 },
  hintBox: { backgroundColor: Colors.primaryFaded, padding: 14, borderRadius: Radius.lg, marginBottom: 20, borderWidth: 1, borderColor: Colors.primary + '30' },
  hintText: { fontSize: FontSizes.small, color: Colors.primary, fontWeight: FontWeights.medium, lineHeight: 20 },
});
