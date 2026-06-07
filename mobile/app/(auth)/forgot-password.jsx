/**
 * Spotix — Forgot Password (3-step flow)
 * Step 1: Enter email or phone
 * Step 2: Enter OTP
 * Step 3: Enter new password x2
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform,
  Alert, Pressable, Animated, ActivityIndicator,
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

// Re-use password analysis from signup
function analyzePassword(pw) {
  const checks = {
    minLength: pw.length >= 8,
    hasUpper: /[A-Z]/.test(pw),
    hasLower: /[a-z]/.test(pw),
    hasNumber: /[0-9]/.test(pw),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw),
  };
  const passed = Object.values(checks).filter(Boolean).length;
  let level = 'none', label = '', color = Colors.textLight, percent = 0;
  if (pw.length === 0) { /* noop */ }
  else if (passed <= 2) { level = 'weak'; label = t('weak'); color = '#EF4444'; percent = 0.25; }
  else if (passed === 3) { level = 'fair'; label = t('fair'); color = '#F59E0B'; percent = 0.5; }
  else if (passed === 4) { level = 'good'; label = t('good'); color = '#10B981'; percent = 0.75; }
  else { level = 'strong'; label = t('strong'); color = '#059669'; percent = 1; }
  return { checks, level, label, color, percent };
}

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const headerAnim = useFadeIn(0);
  const formAnim = useFadeInDown(200);

  // Flow state
  const [step, setStep] = useState(1); // 1=identifier, 2=OTP, 3=new password
  const [loading, setLoading] = useState(false);

  // Step 1
  const [identifier, setIdentifier] = useState('');
  const [userId, setUserId] = useState('');

  // Step 2
  const [otp, setOtp] = useState('');

  // Step 3
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const strength = useMemo(() => analyzePassword(newPassword), [newPassword]);
  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  // ─── Step 1: Send OTP ───
  const handleSendOTP = async () => {
    if (!identifier.trim()) { Alert.alert(t('error'), 'Please enter your email or phone number'); return; }
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const res = await api.post('/auth/forgot-password', { identifier: identifier.trim() });
      setUserId(res.data.userId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep(2);
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t('error'), e.response?.data?.error || 'Failed to send OTP');
    }
    setLoading(false);
  };

  // ─── Step 2: Verify OTP → go to step 3 ───
  const handleVerifyOTP = async () => {
    if (otp.length < 4) { Alert.alert(t('error'), 'Please enter the full OTP code'); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep(3);
  };

  // ─── Step 3: Reset Password ───
  const handleResetPassword = async () => {
    if (strength.level === 'weak' || strength.level === 'none') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t('error'), 'Password is too weak');
      return;
    }
    if (newPassword !== confirmPassword) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t('error'), 'Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { userId, code: otp, newPassword });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('✅ ' + t('success'), 'Password has been reset. Please log in.', [
        { text: t('ok'), onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t('error'), e.response?.data?.error || 'Reset failed');
    }
    setLoading(false);
  };

  // ─── Step Titles / Subtitles ───
  const titles = {
    1: { title: 'Forgot Password', sub: 'Enter your email or phone number to receive a reset code' },
    2: { title: 'Enter Code', sub: 'We sent a verification code to your email/phone' },
    3: { title: 'New Password', sub: 'Create a new secure password for your account' },
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView style={s.container} edges={['top']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Animated.View style={headerAnim}>
              <Pressable
                onPress={() => { if (step > 1) setStep(step - 1); else router.back(); }}
                style={s.backButton}
              >
                <Text style={s.backArrow}>←</Text>
              </Pressable>
              <Text style={s.title}>{titles[step].title}</Text>
              <Text style={s.subtitle}>{titles[step].sub}</Text>
            </Animated.View>

            {/* Progress Steps */}
            <View style={s.stepsRow}>
              {[1, 2, 3].map(i => (
                <View key={i} style={[s.stepDot, i <= step && s.stepDotActive]}>
                  <Text style={[s.stepNum, i <= step && s.stepNumActive]}>{i}</Text>
                </View>
              ))}
              <View style={[s.stepLine, { width: `${((step - 1) / 2) * 100}%` }]} />
              <View style={s.stepLineBg} />
            </View>

            <Animated.View style={formAnim}>
              {/* ─── STEP 1: Enter Identifier ─── */}
              {step === 1 && (
                <Card style={s.formCard}>
                  <Input
                    label={`${t('email')} / ${t('phone')}`}
                    value={identifier}
                    onChangeText={setIdentifier}
                    icon="👤"
                    autoCapitalize="none"
                    returnKeyType="done"
                    placeholder="ahmed@demo.com or +201001234567"
                  />
                  <Button
                    title="Send Reset Code"
                    onPress={handleSendOTP}
                    loading={loading}
                    icon="📤"
                    style={{ marginTop: 4 }}
                  />
                </Card>
              )}

              {/* ─── STEP 2: Enter OTP ─── */}
              {step === 2 && (
                <Card style={s.formCard}>
                  <View style={s.otpHint}>
                    <Text style={s.otpHintText}>📧 Code sent to <Text style={{ fontWeight: '700' }}>{identifier}</Text></Text>
                  </View>
                  <Input
                    label="Verification Code"
                    value={otp}
                    onChangeText={setOtp}
                    icon="🔢"
                    keyboardType="number-pad"
                    maxLength={6}
                    returnKeyType="done"
                    placeholder="Enter 4-digit code"
                  />
                  <Button
                    title="Verify Code"
                    onPress={handleVerifyOTP}
                    loading={loading}
                    icon="✅"
                    style={{ marginTop: 4 }}
                    disabled={otp.length < 4}
                  />
                  <Pressable
                    onPress={handleSendOTP}
                    style={s.resendBtn}
                  >
                    <Text style={s.resendText}>Didn't receive it? Resend</Text>
                  </Pressable>
                </Card>
              )}

              {/* ─── STEP 3: New Password ─── */}
              {step === 3 && (
                <Card style={s.formCard}>
                  <Input
                    label={`🔒 New ${t('password')}`}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                    returnKeyType="next"
                  />
                  {/* Strength bar */}
                  {newPassword.length > 0 && (
                    <View style={s.strengthWrap}>
                      <View style={s.barBg}>
                        <View style={[s.barFill, { width: `${strength.percent * 100}%`, backgroundColor: strength.color }]} />
                      </View>
                      <Text style={[s.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
                      <View style={s.rules}>
                        {[
                          { ok: strength.checks.minLength, text: '8+ characters' },
                          { ok: strength.checks.hasUpper, text: 'Uppercase (A-Z)' },
                          { ok: strength.checks.hasLower, text: 'Lowercase (a-z)' },
                          { ok: strength.checks.hasNumber, text: 'Number (0-9)' },
                          { ok: strength.checks.hasSpecial, text: 'Special (!@#$)' },
                        ].map((r, i) => (
                          <View key={i} style={s.rule}>
                            <Text style={s.ruleIcon}>{r.ok ? '✅' : '❌'}</Text>
                            <Text style={[s.ruleText, r.ok && s.ruleTextOk]}>{r.text}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  <Input
                    label={`🔒 ${t('confirmPassword')}`}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    returnKeyType="done"
                  />
                  {passwordsMismatch && (
                    <View style={s.matchRow}><Text style={s.matchIcon}>❌</Text><Text style={s.matchBad}>Passwords do not match</Text></View>
                  )}
                  {passwordsMatch && (
                    <View style={s.matchRow}><Text style={s.matchIcon}>✅</Text><Text style={s.matchOk}>Passwords match!</Text></View>
                  )}

                  <Button
                    title="Reset Password"
                    onPress={handleResetPassword}
                    loading={loading}
                    icon="🔐"
                    style={{ marginTop: 8 }}
                    disabled={passwordsMismatch || strength.level === 'weak' || strength.level === 'none'}
                  />
                </Card>
              )}
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 24, paddingBottom: 60 },
  backButton: { width: 48, height: 48, borderRadius: 14, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, marginBottom: 24, ...Shadows.md },
  backArrow: { fontSize: 20, color: Colors.text },
  title: { fontSize: 28, fontWeight: FontWeights.extrabold, color: Colors.text, marginBottom: 8 },
  subtitle: { fontSize: FontSizes.bodyLarge, color: Colors.textSecondary, marginBottom: 24, lineHeight: 22 },
  // Steps
  stepsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 32, marginBottom: 28, position: 'relative' },
  stepDot: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.border, zIndex: 2 },
  stepDotActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  stepNum: { fontSize: 14, fontWeight: '700', color: Colors.textLight },
  stepNumActive: { color: '#fff' },
  stepLineBg: { position: 'absolute', left: 54, right: 54, height: 3, backgroundColor: Colors.border, borderRadius: 2, zIndex: 0 },
  stepLine: { position: 'absolute', left: 54, height: 3, backgroundColor: Colors.primary, borderRadius: 2, zIndex: 1 },
  // Form
  formCard: { padding: 20 },
  otpHint: { backgroundColor: Colors.primaryFaded, borderRadius: Radius.md, padding: 12, marginBottom: 12 },
  otpHintText: { fontSize: 13, color: Colors.primary, textAlign: 'center' },
  resendBtn: { alignSelf: 'center', marginTop: 16 },
  resendText: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
  // Strength
  strengthWrap: { marginBottom: 8 },
  barBg: { height: 6, borderRadius: 3, backgroundColor: Colors.border, overflow: 'hidden', marginBottom: 6 },
  barFill: { height: 6, borderRadius: 3 },
  strengthLabel: { fontSize: 12, fontWeight: '700', textAlign: 'right', marginBottom: 6 },
  rules: { gap: 4 },
  rule: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ruleIcon: { fontSize: 12 },
  ruleText: { fontSize: 12, color: Colors.textLight },
  ruleTextOk: { color: '#10B981', fontWeight: '600' },
  // Match
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -4, marginBottom: 4 },
  matchIcon: { fontSize: 12 },
  matchBad: { fontSize: 12, color: '#EF4444', fontWeight: '600' },
  matchOk: { fontSize: 12, color: '#10B981', fontWeight: '600' },
});
