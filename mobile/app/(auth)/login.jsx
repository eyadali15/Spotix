/**
 * Spotix — Login Screen (Email or Phone + Forgot Password)
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
import Card from '../../components/Card';
import useAuthStore from '../../store/authStore';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const headerAnim = useFadeIn(0);
  const formAnim = useFadeInDown(200);
  const demoAnim = useFadeInDown(400);

  const handleLogin = async () => {
    if (!identifier || !password) { Alert.alert(t('error'), 'Please enter your email or phone and password'); return; }
    const result = await login(identifier.trim(), password);
    if (result.success) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }
    else { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); Alert.alert(t('error'), result.error); }
  };
  const fillDemo = (e, p) => { setIdentifier(e); setPassword(p); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Animated.View style={headerAnim}>
              <Pressable onPress={() => router.back()} style={styles.backButton}><Text style={styles.backArrow}>←</Text></Pressable>
              <Text style={styles.title}>{t('welcomeBack')}</Text>
              <Text style={styles.subtitle}>{t('loginSubtitle')}</Text>
            </Animated.View>
            <Animated.View style={formAnim}>
              <Input
                label={`${t('email')} / ${t('phone')}`}
                value={identifier}
                onChangeText={setIdentifier}
                icon="👤"
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
              />
              <Input label={t('password')} value={password} onChangeText={setPassword} icon="🔒" secureTextEntry returnKeyType="done" />

              <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(auth)/forgot-password'); }} style={styles.forgotBtn}>
                <Text style={styles.forgotText}>{t('forgotPassword')}</Text>
              </Pressable>

              <Button title={t('login')} onPress={handleLogin} loading={isLoading} icon="🔑" style={{ marginTop: 4 }} />

              {/* Social Login */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{t('orContinueWith')}</Text>
                <View style={styles.dividerLine} />
              </View>
              <View style={styles.socialRow}>
                <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); Alert.alert('Apple Sign-In', 'Configure Apple Developer credentials to enable'); }} style={[styles.socialBtn, { backgroundColor: '#000' }]}>
                  <Text style={[styles.socialIcon, { color: '#fff' }]}>{'\uF8FF'}</Text>
                  <Text style={[styles.socialText, { color: '#fff' }]}>Apple</Text>
                </Pressable>
                <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); Alert.alert('Google Sign-In', 'Configure Google Cloud credentials to enable'); }} style={styles.socialBtn}>
                  <Text style={styles.gLetter}>G</Text>
                  <Text style={styles.socialText}>Google</Text>
                </Pressable>
              </View>
            </Animated.View>
            <Animated.View style={demoAnim}>
              <Text style={styles.demoTitle}>Demo Accounts</Text>
              <Card style={styles.demoCard}>
                <Pressable onPress={() => fillDemo('ahmed@demo.com', 'Password123')} style={styles.demoRow}>
                  <View style={[styles.demoIcon, { backgroundColor: Colors.secondaryFaded }]}><Text style={{ fontSize: 18 }}>🚗</Text></View>
                  <View style={{ flex: 1 }}><Text style={styles.demoName}>Client — Ahmed</Text><Text style={styles.demoEmail}>ahmed@demo.com</Text></View>
                  <Text style={styles.demoArrow}>→</Text>
                </Pressable>
                <View style={styles.demoDivider} />
                <Pressable onPress={() => fillDemo('owner@demo.com', 'Password123')} style={styles.demoRow}>
                  <View style={[styles.demoIcon, { backgroundColor: Colors.primaryFaded }]}><Text style={{ fontSize: 18 }}>🅿️</Text></View>
                  <View style={{ flex: 1 }}><Text style={styles.demoName}>Owner — Mohamed</Text><Text style={styles.demoEmail}>owner@demo.com</Text></View>
                  <Text style={styles.demoArrow}>→</Text>
                </Pressable>
                <View style={styles.demoDivider} />
                <Pressable onPress={() => fillDemo('wash@demo.com', 'Password123')} style={styles.demoRow}>
                  <View style={[styles.demoIcon, { backgroundColor: 'rgba(59,130,246,0.1)' }]}><Text style={{ fontSize: 18 }}>🚿</Text></View>
                  <View style={{ flex: 1 }}><Text style={styles.demoName}>Wash — Sara</Text><Text style={styles.demoEmail}>wash@demo.com</Text></View>
                  <Text style={styles.demoArrow}>→</Text>
                </Pressable>
              </Card>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 24 },
  backButton: { width: 48, height: 48, borderRadius: 14, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, marginBottom: 24, ...Shadows.md },
  backArrow: { fontSize: 20, color: Colors.text },
  title: { fontSize: 28, fontWeight: FontWeights.extrabold, color: Colors.text, marginBottom: 8 },
  subtitle: { fontSize: FontSizes.bodyLarge, color: Colors.textSecondary, marginBottom: 32 },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 8, marginTop: -4 },
  forgotText: { color: Colors.primary, fontSize: FontSizes.body, fontWeight: FontWeights.semibold },
  demoTitle: { fontSize: FontSizes.small, fontWeight: FontWeights.bold, color: Colors.textLight, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 32, marginBottom: 10 },
  demoCard: { padding: 0, overflow: 'hidden' },
  demoRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  demoIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  demoName: { fontSize: FontSizes.body, fontWeight: FontWeights.semibold, color: Colors.text },
  demoEmail: { fontSize: FontSizes.small, color: Colors.textSecondary },
  demoArrow: { fontSize: 16, color: Colors.secondary },
  demoDivider: { height: 1, backgroundColor: Colors.border, marginHorizontal: 14 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: 12, color: Colors.textLight, fontWeight: '600' },
  socialRow: { flexDirection: 'row', gap: 12 },
  socialBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white },
  socialIcon: { fontSize: 20 },
  socialText: { fontSize: 15, fontWeight: '600', color: Colors.text },
  gLetter: { fontSize: 22, fontWeight: '800', color: '#4285F4' },
});
