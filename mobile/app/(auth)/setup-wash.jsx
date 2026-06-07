/**
 * Spotix — Wash Owner Setup Screen
 * Called after signup to add wash store details + services
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

const KB_ID = 'setupWashKb';
function KBDone() {
  if (Platform.OS !== 'ios') return null;
  return <InputAccessoryView nativeID={KB_ID}><View style={s.kbBar}><RNButton title="Done" onPress={() => Keyboard.dismiss()} /></View></InputAccessoryView>;
}

export default function WashSetupScreen() {
  const router = useRouter();
  const headerAnim = useFadeIn(0);
  const formAnim = useFadeInDown(200);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [openTime, setOpenTime] = useState('8');
  const [closeTime, setCloseTime] = useState('22');
  const [loading, setLoading] = useState(false);

  // Services
  const [services, setServices] = useState([
    { name: 'External Wash', price: '', oldPrice: '', duration: '30' },
  ]);

  const addService = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setServices([...services, { name: '', price: '', oldPrice: '', duration: '30' }]);
  };
  const removeService = (idx) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setServices(services.filter((_, i) => i !== idx));
  };
  const updateService = (idx, field, value) => {
    const updated = [...services];
    updated[idx][field] = value;
    setServices(updated);
  };

  const handleCreate = async () => {
    if (!name || !address) { Alert.alert(t('error'), 'Name and address are required'); return; }
    const validServices = services.filter(s => s.name && s.price);
    if (validServices.length === 0) { Alert.alert(t('error'), 'Add at least one service with name and price'); return; }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      await api.post('/washing', {
        name, address,
        latitude: 30.0444 + (Math.random() * 0.1 - 0.05),
        longitude: 31.2357 + (Math.random() * 0.1 - 0.05),
        openTime: parseInt(openTime),
        closeTime: parseInt(closeTime),
        services: validServices.map(s => ({
          name: s.name,
          price: parseFloat(s.price),
          oldPrice: s.oldPrice ? parseFloat(s.oldPrice) : null,
          duration: parseInt(s.duration) || 30,
        })),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('✅ Success', 'Your wash store has been created!', [
        { text: 'Go to Dashboard', onPress: () => router.replace('/(wash-owner)') },
      ]);
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t('error'), e.response?.data?.error || 'Failed to create store');
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
              <Text style={s.emoji}>🚿</Text>
              <Text style={s.title}>Setup Your Wash Store</Text>
              <Text style={s.subtitle}>Add your car wash details and services</Text>
            </Animated.View>

            <Animated.View style={formAnim}>
              <Input label="Store Name *" value={name} onChangeText={setName} icon="🏷️" inputAccessoryViewID={KB_ID} />
              <Input label="Address *" value={address} onChangeText={setAddress} icon="📍" inputAccessoryViewID={KB_ID} />

              {/* Hours */}
              <Text style={s.sectionLabel}>⏰ Operating Hours</Text>
              <View style={s.hoursRow}>
                <View style={{ flex: 1 }}>
                  <Input label="Open (hour)" value={openTime} onChangeText={v => setOpenTime(v.replace(/\D/g, ''))} keyboardType="number-pad" inputAccessoryViewID={KB_ID} />
                </View>
                <Text style={s.hoursTo}>to</Text>
                <View style={{ flex: 1 }}>
                  <Input label="Close (hour)" value={closeTime} onChangeText={v => setCloseTime(v.replace(/\D/g, ''))} keyboardType="number-pad" inputAccessoryViewID={KB_ID} />
                </View>
              </View>

              {/* Services */}
              <Text style={s.sectionLabel}>🧽 Services</Text>
              {services.map((svc, i) => (
                <Card key={i} style={s.serviceCard}>
                  <View style={s.serviceHeader}>
                    <Text style={s.serviceNum}>Service {i + 1}</Text>
                    {services.length > 1 && (
                      <Pressable onPress={() => removeService(i)} style={s.removeBtn}>
                        <Text style={s.removeText}>✕</Text>
                      </Pressable>
                    )}
                  </View>
                  <Input label="Service Name" value={svc.name} onChangeText={v => updateService(i, 'name', v)} inputAccessoryViewID={KB_ID} />
                  <View style={s.priceRow}>
                    <View style={s.priceCol}>
                      <Text style={s.priceLabel}>Without Spotix</Text>
                      <Input value={svc.oldPrice} onChangeText={v => updateService(i, 'oldPrice', v.replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad" placeholder="Optional" inputAccessoryViewID={KB_ID} />
                    </View>
                    <Text style={s.priceArrow}>→</Text>
                    <View style={s.priceCol}>
                      <Text style={[s.priceLabel, { color: Colors.primary, fontWeight: '700' }]}>With Spotix *</Text>
                      <Input value={svc.price} onChangeText={v => updateService(i, 'price', v.replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad" placeholder="EGP" inputAccessoryViewID={KB_ID} />
                    </View>
                  </View>
                  <Input label="Duration (min)" value={svc.duration} onChangeText={v => updateService(i, 'duration', v.replace(/\D/g, ''))} keyboardType="number-pad" inputAccessoryViewID={KB_ID} />
                  {svc.oldPrice && svc.price && parseFloat(svc.oldPrice) > parseFloat(svc.price) && (
                    <View style={s.savingsBadge}>
                      <Text style={s.savingsText}>🎉 {Math.round(((parseFloat(svc.oldPrice) - parseFloat(svc.price)) / parseFloat(svc.oldPrice)) * 100)}% cheaper with Spotix!</Text>
                    </View>
                  )}
                </Card>
              ))}
              <Pressable onPress={addService} style={s.addBtn}>
                <Text style={s.addText}>+ Add Service</Text>
              </Pressable>

              <Button title="Create Wash Store" onPress={handleCreate} loading={loading} icon="🚀" style={{ marginTop: 16 }} />
              <Pressable onPress={() => router.replace('/(wash-owner)')} style={s.skipBtn}>
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
  subtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: 28 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 8, marginTop: 16 },
  hoursRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hoursTo: { fontSize: 14, color: Colors.textLight, fontWeight: '600', marginTop: 12 },
  serviceCard: { padding: 16, marginBottom: 12 },
  serviceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  serviceNum: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  removeBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(239,68,68,0.1)', justifyContent: 'center', alignItems: 'center' },
  removeText: { fontSize: 14, color: '#EF4444', fontWeight: '700' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  priceCol: { flex: 1 },
  priceLabel: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4, textAlign: 'center' },
  priceArrow: { fontSize: 20, color: Colors.primary, fontWeight: '700', marginTop: 12 },
  savingsBadge: { backgroundColor: '#ECFDF5', borderRadius: Radius.md, padding: 8, marginTop: 6, alignItems: 'center' },
  savingsText: { fontSize: 12, fontWeight: '700', color: '#059669' },
  addBtn: { alignSelf: 'center', marginTop: 8, paddingVertical: 10, paddingHorizontal: 24, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.primary, borderStyle: 'dashed' },
  addText: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
  skipBtn: { alignSelf: 'center', marginTop: 20 },
  skipText: { color: Colors.textLight, fontSize: 14, fontWeight: '600' },
  kbBar: { flexDirection: 'row', justifyContent: 'flex-end', padding: 8, backgroundColor: '#f0f0f0', borderTopWidth: 1, borderColor: '#ddd' },
});
