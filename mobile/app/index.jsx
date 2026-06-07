/**
 * Spotix — Premium Start Screen
 * Logo + tagline at top, smooth photo carousel, glassmorphism role buttons
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Dimensions, Easing, Image } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius } from '../constants/colors';
import { t } from '../constants/i18n';
import useAuthStore from '../store/authStore';

const { width, height } = Dimensions.get('window');

const BG_IMAGES = [
  require('../assets/images/parking_cinematic.png'),
  require('../assets/images/carwash_cinematic.png'),
  require('../assets/images/parking_aerial.png'),
];

// ─── Smooth crossfade carousel with scale ───
function ImageCarousel() {
  const [idx, setIdx] = useState(0);
  const fadeA = useRef(new Animated.Value(1)).current;
  const fadeB = useRef(new Animated.Value(0)).current;
  const scaleA = useRef(new Animated.Value(1)).current;
  const scaleB = useRef(new Animated.Value(1.08)).current;
  const isA = useRef(true);

  useEffect(() => {
    const interval = setInterval(() => {
      const dur = 2000;
      if (isA.current) {
        scaleB.setValue(1.08);
        Animated.parallel([
          Animated.timing(fadeA, { toValue: 0, duration: dur, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(fadeB, { toValue: 1, duration: dur, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(scaleB, { toValue: 1, duration: dur * 2.5, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        ]).start();
      } else {
        scaleA.setValue(1.08);
        Animated.parallel([
          Animated.timing(fadeB, { toValue: 0, duration: dur, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(fadeA, { toValue: 1, duration: dur, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(scaleA, { toValue: 1, duration: dur * 2.5, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        ]).start();
      }
      isA.current = !isA.current;
      setIdx(prev => (prev + 1) % BG_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const imgA = BG_IMAGES[idx];
  const imgB = BG_IMAGES[(idx + 1) % BG_IMAGES.length];

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.Image source={imgA} style={[StyleSheet.absoluteFill, { opacity: fadeA, transform: [{ scale: scaleA }] }]} resizeMode="cover" />
      <Animated.Image source={imgB} style={[StyleSheet.absoluteFill, { opacity: fadeB, transform: [{ scale: scaleB }] }]} resizeMode="cover" />
      <LinearGradient colors={['rgba(7,11,20,0.25)', 'rgba(7,11,20,0.55)', 'rgba(7,11,20,0.92)']} locations={[0, 0.35, 0.7]} style={StyleSheet.absoluteFill} />
    </View>
  );
}

// ─── Fade-in animation ───
function FadeIn({ delay = 0, children, style }) {
  const o = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(o, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
      Animated.spring(y, { toValue: 0, tension: 60, friction: 12, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return <Animated.View style={[{ opacity: o, transform: [{ translateY: y }] }, style]}>{children}</Animated.View>;
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { setRole } = useAuthStore();

  const go = (role) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setRole(role);
    router.push('/(auth)/signup');
  };

  return (
    <View style={s.container}>
      <ImageCarousel />
      <SafeAreaView style={s.safe}>
        {/* ─── TOP: Logo + Tagline ─── */}
        <FadeIn delay={200} style={s.logoArea}>
          <Image source={require('../assets/images/spotix_logo.png')} style={s.logoImg} resizeMode="contain" />
          <Text style={s.logoText}>Spotix</Text>
          <Text style={s.tagline}>Smart Parking & Car Care</Text>
        </FadeIn>

        {/* ─── BOTTOM: Role Cards ─── */}
        <View style={s.bottom}>
          {/* Main — Client */}
          <FadeIn delay={500}>
            <Pressable onPress={() => go('CLIENT')} style={({ pressed }) => [s.glassCard, s.mainCard, pressed && s.pressed]}>
              <View style={s.cardIcon}><Text style={{ fontSize: 26 }}>🚗</Text></View>
              <View style={s.cardInfo}>
                <Text style={s.cardTitle}>{t('iHaveACar') || 'I have a car'}</Text>
                <Text style={s.cardDesc}>Find parking & book car wash</Text>
              </View>
              <View style={s.cardArrow}><Text style={s.arrowText}>→</Text></View>
            </Pressable>
          </FadeIn>

          {/* Two small — Parking + Wash */}
          <FadeIn delay={700}>
            <View style={s.smallRow}>
              <Pressable onPress={() => go('PARKING_OWNER')} style={({ pressed }) => [s.glassCard, s.smallCard, pressed && s.pressed]}>
                <Text style={{ fontSize: 24 }}>🅿️</Text>
                <Text style={s.smallTitle}>Parking</Text>
                <Text style={s.smallDesc}>Manage your lot</Text>
              </Pressable>
              <Pressable onPress={() => go('WASH_OWNER')} style={({ pressed }) => [s.glassCard, s.smallCard, pressed && s.pressed]}>
                <Text style={{ fontSize: 24 }}>🚿</Text>
                <Text style={s.smallTitle}>Car Wash</Text>
                <Text style={s.smallDesc}>Manage your store</Text>
              </Pressable>
            </View>
          </FadeIn>

          {/* Footer */}
          <FadeIn delay={900}>
            <View style={s.footer}>
              <Text style={s.footerText}>{t('haveAccount') || 'Already have an account?'} </Text>
              <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(auth)/login'); }}>
                <Text style={s.footerLink}>{t('loginShort') || 'Log in'}</Text>
              </Pressable>
            </View>
          </FadeIn>
        </View>
      </SafeAreaView>
    </View>
  );
}

const GLASS = {
  backgroundColor: 'rgba(255,255,255,0.08)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.12)',
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070B14' },
  safe: { flex: 1, justifyContent: 'space-between' },
  // Logo
  logoArea: { alignItems: 'center', paddingTop: 20 },
  logoImg: { width: 80, height: 80, borderRadius: 22, marginBottom: 12 },
  logoText: { fontSize: 40, fontWeight: '900', color: '#FFFFFF', letterSpacing: 2 },
  tagline: { fontSize: 15, color: 'rgba(200,210,230,0.7)', marginTop: 4, letterSpacing: 0.5 },
  // Bottom
  bottom: { padding: 24, paddingBottom: 16 },
  glassCard: { ...GLASS, borderRadius: 18, overflow: 'hidden' },
  pressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  // Main
  mainCard: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14, marginBottom: 12 },
  cardIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(59,130,246,0.2)', justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: '#FFFFFF', marginBottom: 3 },
  cardDesc: { fontSize: 12, color: 'rgba(200,210,230,0.6)', lineHeight: 16 },
  cardArrow: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  arrowText: { fontSize: 18, color: '#fff', fontWeight: '700' },
  // Small
  smallRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  smallCard: { flex: 1, alignItems: 'center', paddingVertical: 18, paddingHorizontal: 12, gap: 6 },
  smallTitle: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  smallDesc: { fontSize: 11, color: 'rgba(200,210,230,0.5)', textAlign: 'center' },
  // Footer
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  footerText: { color: 'rgba(200,210,230,0.35)', fontSize: 14 },
  footerLink: { color: '#3B82F6', fontSize: 14, fontWeight: '700' },
});
