/**
 * Spotix — About Us Page
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius, Shadows } from '../../constants/colors';
import Card from '../../components/Card';

export default function AboutScreen() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <Pressable onPress={() => router.back()} style={s.back}><Text style={s.backText}>← Back</Text></Pressable>
          <Text style={s.title}>About Spotix</Text>
          <Text style={s.version}>Version 1.0.0</Text>

          <Card style={s.card}>
            <Text style={s.heading}>🚗 What is Spotix?</Text>
            <Text style={s.body}>Spotix is Egypt's premier smart parking and car care platform. We connect car owners with nearby parking lots and car wash stations, offering real-time availability, instant booking, and exclusive prices lower than street rates.</Text>
          </Card>

          <Card style={s.card}>
            <Text style={s.heading}>🎯 Our Mission</Text>
            <Text style={s.body}>To eliminate the stress of finding parking and car care services in Egypt's busiest cities. We empower parking lot and car wash owners to digitize their operations while giving drivers a seamless, affordable experience.</Text>
          </Card>

          <Card style={s.card}>
            <Text style={s.heading}>✨ Key Features</Text>
            {['Real-time parking & wash availability', 'Lower prices than street rates', 'QR-code based check-in', 'Covered & uncovered parking options', 'Multi-service car wash booking', 'Apple & Google Sign-In', 'Arabic & English support'].map((f, i) => (
              <View key={i} style={s.featureRow}>
                <Text style={s.bullet}>•</Text>
                <Text style={s.featureText}>{f}</Text>
              </View>
            ))}
          </Card>

          <Card style={s.card}>
            <Text style={s.heading}>👨‍💻 Development Team</Text>
            <Text style={s.body}>Built with ❤️ in Egypt using React Native, Expo, Node.js, Prisma, and Socket.IO for real-time experiences.</Text>
          </Card>

          <Text style={s.copyright}>© 2026 Spotix™. All rights reserved.</Text>
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
  version: { fontSize: 13, color: Colors.textLight, marginBottom: 24 },
  card: { padding: 18, marginBottom: 14 },
  heading: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 10 },
  body: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  bullet: { fontSize: 16, color: Colors.primary, fontWeight: '700', marginTop: -2 },
  featureText: { fontSize: 14, color: Colors.textSecondary, flex: 1 },
  copyright: { textAlign: 'center', color: Colors.textLight, fontSize: 12, marginTop: 20 },
});
