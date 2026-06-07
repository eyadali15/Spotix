/**
 * Spotix — Terms, Privacy Policy & Policies Page
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius, Shadows } from '../../constants/colors';
import Card from '../../components/Card';

const SECTIONS = [
  {
    title: '📋 Terms of Service',
    items: [
      'By creating a Spotix account, you agree to comply with all applicable Egyptian laws and regulations regarding parking and car care services.',
      'Spotix acts as a platform connecting car owners with parking and car wash service providers. We do not own or operate the parking lots or wash stations listed.',
      'All bookings are subject to availability. Prices displayed are set by service providers and may change at any time.',
      'Users must be at least 18 years old to create an account.',
      'Spotix reserves the right to suspend or terminate accounts that violate these terms.',
    ],
  },
  {
    title: '🔒 Privacy Policy',
    items: [
      'We collect your name, email, phone number, and location data to provide our services.',
      'Your data is encrypted and stored securely. We never sell your personal information to third parties.',
      'Location data is used only for finding nearby parking and wash services.',
      'Payment information is processed through secure third-party providers (Paymob). Spotix does not store card details.',
      'You can request deletion of your account and data at any time by contacting support.',
    ],
  },
  {
    title: '💰 Booking & Cancellation Policy',
    items: [
      'Parking bookings can be cancelled before check-in for a full refund.',
      'Car wash bookings can be cancelled up to 1 hour before the scheduled time.',
      'No-shows may result in partial charges at the discretion of the service provider.',
      'Extending parking time is subject to spot availability and may incur additional charges at the current rate.',
    ],
  },
  {
    title: '⚖️ Liability',
    items: [
      'Spotix is not responsible for any damage to vehicles that occurs at parking lots or car wash stations.',
      'Service providers are independent operators and are solely responsible for the quality of their services.',
      'Our platform uptime is provided on an "as is" basis. We strive for 99.9% availability.',
    ],
  },
];

export default function PoliciesScreen() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <Pressable onPress={() => router.back()} style={s.back}><Text style={s.backText}>← Back</Text></Pressable>
          <Text style={s.title}>Policies & Terms</Text>
          <Text style={s.subtitle}>Last updated: April 2026</Text>

          {SECTIONS.map((section, si) => (
            <Card key={si} style={s.card}>
              <Text style={s.heading}>{section.title}</Text>
              {section.items.map((item, ii) => (
                <View key={ii} style={s.itemRow}>
                  <Text style={s.bullet}>{ii + 1}.</Text>
                  <Text style={s.itemText}>{item}</Text>
                </View>
              ))}
            </Card>
          ))}

          <Text style={s.footer}>© 2026 Spotix™. All rights reserved.</Text>
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
  subtitle: { fontSize: 13, color: Colors.textLight, marginBottom: 24 },
  card: { padding: 18, marginBottom: 14 },
  heading: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10 },
  bullet: { fontSize: 13, fontWeight: '700', color: Colors.primary, width: 20 },
  itemText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20, flex: 1 },
  footer: { textAlign: 'center', color: Colors.textLight, fontSize: 12, marginTop: 20 },
});
