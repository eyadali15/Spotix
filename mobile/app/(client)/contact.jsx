/**
 * Spotix — Contact Us Page
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius, Shadows } from '../../constants/colors';
import Card from '../../components/Card';

const CONTACTS = [
  { icon: '📧', label: 'Email', value: 'support@spotix.eg', action: 'mailto:support@spotix.eg' },
  { icon: '📞', label: 'Phone', value: '+20 100 123 4567', action: 'tel:+201001234567' },
  { icon: '💬', label: 'WhatsApp', value: '+20 100 123 4567', action: 'https://wa.me/201001234567' },
  { icon: '📍', label: 'Office', value: 'Cairo, Egypt — Smart Village', action: null },
  { icon: '🌐', label: 'Website', value: 'www.spotix.eg', action: 'https://www.spotix.eg' },
];

export default function ContactScreen() {
  const router = useRouter();
  const openLink = (action) => {
    if (!action) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(action).catch(() => Alert.alert('Error', 'Could not open link'));
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <Pressable onPress={() => router.back()} style={s.back}><Text style={s.backText}>← Back</Text></Pressable>
          <Text style={s.title}>Contact Us</Text>
          <Text style={s.subtitle}>We'd love to hear from you! Reach out via any channel below.</Text>

          {CONTACTS.map((c, i) => (
            <Card key={i} style={s.card} pressable={!!c.action} onPress={() => openLink(c.action)}>
              <View style={s.row}>
                <View style={s.iconWrap}><Text style={s.icon}>{c.icon}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>{c.label}</Text>
                  <Text style={s.value}>{c.value}</Text>
                </View>
                {c.action && <Text style={s.arrow}>→</Text>}
              </View>
            </Card>
          ))}

          <Card style={[s.card, { marginTop: 20 }]}>
            <Text style={s.heading}>🕐 Support Hours</Text>
            <Text style={s.body}>Saturday — Thursday: 9:00 AM — 10:00 PM</Text>
            <Text style={s.body}>Friday: 12:00 PM — 8:00 PM</Text>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  scroll: { padding: 24, paddingBottom: 60 },
  back: { width: 48, height: 48, borderRadius: 14, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, marginBottom: 24, ...Shadows.md },
  backText: { fontSize: 16, color: Colors.text },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 24, lineHeight: 20 },
  card: { padding: 16, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.primaryFaded, justifyContent: 'center', alignItems: 'center' },
  icon: { fontSize: 22 },
  label: { fontSize: 12, color: Colors.textLight, fontWeight: '600', marginBottom: 2 },
  value: { fontSize: 15, fontWeight: '600', color: Colors.text },
  arrow: { fontSize: 18, color: Colors.primary, fontWeight: '700' },
  heading: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 10 },
  body: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22, marginBottom: 2 },
});
