/**
 * Spotix — Signup Screen
 * Phone: +20 Egypt (fixed, not editable, required)
 * Email: optional
 * Password: strength checker, confirm password must match
 */
import React, { useState, useMemo, useRef } from 'react';
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
import useAuthStore from '../../store/authStore';

// ─── Password Strength Checker ───
function analyzePassword(pw) {
  const checks = {
    minLength: pw.length >= 8,
    hasUpper: /[A-Z]/.test(pw),
    hasLower: /[a-z]/.test(pw),
    hasNumber: /[0-9]/.test(pw),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw),
  };
  const passed = Object.values(checks).filter(Boolean).length;
  let level = 'none';
  let label = '';
  let color = Colors.textLight;
  let percent = 0;
  if (pw.length === 0) { level = 'none'; label = ''; percent = 0; }
  else if (passed <= 2) { level = 'weak'; label = t('weak'); color = '#EF4444'; percent = 0.25; }
  else if (passed === 3) { level = 'fair'; label = t('fair'); color = '#F59E0B'; percent = 0.5; }
  else if (passed === 4) { level = 'good'; label = t('good'); color = '#10B981'; percent = 0.75; }
  else { level = 'strong'; label = t('strong'); color = '#059669'; percent = 1; }
  return { checks, level, label, color, percent };
}

function PasswordStrengthUI({ password }) {
  const { checks, level, label, color, percent } = analyzePassword(password);
  if (!password) return null;

  const rules = [
    { key: 'minLength', label: '8+ characters', icon: checks.minLength ? '✅' : '❌' },
    { key: 'hasUpper', label: 'Uppercase (A-Z)', icon: checks.hasUpper ? '✅' : '❌' },
    { key: 'hasLower', label: 'Lowercase (a-z)', icon: checks.hasLower ? '✅' : '❌' },
    { key: 'hasNumber', label: 'Number (0-9)', icon: checks.hasNumber ? '✅' : '❌' },
    { key: 'hasSpecial', label: 'Special (!@#$)', icon: checks.hasSpecial ? '✅' : '❌' },
  ];

  return (
    <View style={ps.container}>
      {/* Strength bar */}
      <View style={ps.barBg}>
        <Animated.View style={[ps.barFill, { width: `${percent * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={[ps.label, { color }]}>{label}</Text>
      {/* Rules */}
      <View style={ps.rules}>
        {rules.map(r => (
          <View key={r.key} style={ps.rule}>
            <Text style={ps.ruleIcon}>{r.icon}</Text>
            <Text style={[ps.ruleText, checks[r.key] && ps.ruleTextOk]}>{r.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const ps = StyleSheet.create({
  container: { marginBottom: 8, marginTop: -4 },
  barBg: { height: 6, borderRadius: 3, backgroundColor: Colors.border, overflow: 'hidden', marginBottom: 6 },
  barFill: { height: 6, borderRadius: 3 },
  label: { fontSize: 12, fontWeight: '700', textAlign: 'right', marginBottom: 6 },
  rules: { gap: 4 },
  rule: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ruleIcon: { fontSize: 12 },
  ruleText: { fontSize: 12, color: Colors.textLight },
  ruleTextOk: { color: '#10B981', fontWeight: '600' },
});

export default function SignupScreen() {
  const router = useRouter();
  const { signup, selectedRole, isLoading } = useAuthStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);

  const headerAnim = useFadeIn(0);
  const formAnim = useFadeInDown(200);

  const passwordStrength = useMemo(() => analyzePassword(password), [password]);

  const handleSignup = async () => {
    if (!name.trim()) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); Alert.alert(t('error'), 'Name is required'); return; }
    if (!phone.trim() || phone.length < 10) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); Alert.alert(t('error'), 'Valid phone number is required (10+ digits)'); return; }
    if (passwordStrength.level === 'weak' || passwordStrength.level === 'none') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t('error'), 'Password is too weak. Please include uppercase, lowercase, numbers, and special characters.');
      return;
    }
    if (password !== confirmPassword) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t('error'), 'Passwords do not match');
      return;
    }
    if (!agreedTerms) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t('error'), 'You must agree to the Terms & Policies to continue');
      return;
    }

    const fullPhone = `+20${phone.replace(/^0/, '')}`;
    const result = await signup({ name: name.trim(), email: email.trim() || undefined, phone: fullPhone, password, role: selectedRole });
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push('/(auth)/verify');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t('error'), result.error);
    }
  };

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Animated.View style={headerAnim}>
              <Pressable onPress={() => router.back()} style={styles.backButton}><Text style={styles.backArrow}>←</Text></Pressable>
              <Text style={styles.title}>{t('createAccount')}</Text>
              <Text style={styles.subtitle}>
                {selectedRole === 'PARKING_OWNER' ? 'Start managing your parking lot' : selectedRole === 'WASH_OWNER' ? 'Manage your car wash store' : 'Find parking in seconds'}
              </Text>
            </Animated.View>

            <Animated.View style={formAnim}>
              <Input label={t('name')} value={name} onChangeText={setName} icon="👤" returnKeyType="next" />

              {/* Phone — Egypt +20 Fixed */}
              <Text style={styles.inputLabel}>📱 {t('phone')} *</Text>
              <View style={styles.phoneRow}>
                <View style={styles.countryBadge}>
                  <Text style={styles.countryFlag}>🇪🇬</Text>
                  <Text style={styles.countryCode}>+20</Text>
                </View>
                <View style={styles.phoneInputWrap}>
                  <Input
                    value={phone}
                    onChangeText={(t) => setPhone(t.replace(/\D/g, ''))}
                    keyboardType="phone-pad"
                    placeholder="1001234567"
                    returnKeyType="next"
                  />
                </View>
              </View>

              <Input label={`📧 ${t('email')} (${t('optional') || 'optional'})`} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" returnKeyType="next" />

              {/* Password */}
              <Input label={`🔒 ${t('password')} *`} value={password} onChangeText={setPassword} secureTextEntry returnKeyType="next" />
              <PasswordStrengthUI password={password} />

              {/* Confirm Password */}
              <Input
                label={`🔒 ${t('confirmPassword')} *`}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                returnKeyType="done"
              />
              {passwordsMismatch && (
                <View style={styles.matchRow}>
                  <Text style={styles.matchIcon}>❌</Text>
                  <Text style={styles.matchTextBad}>Passwords do not match</Text>
                </View>
              )}
              {passwordsMatch && (
                <View style={styles.matchRow}>
                  <Text style={styles.matchIcon}>✅</Text>
                  <Text style={styles.matchTextOk}>Passwords match!</Text>
                </View>
              )}

              {/* Terms & Policies */}
              <Pressable onPress={() => { setAgreedTerms(!agreedTerms); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} style={styles.termsRow}>
                <View style={[styles.termsCheckbox, agreedTerms && styles.termsCheckboxOn]}>
                  {agreedTerms && <Text style={styles.termsCheck}>✓</Text>}
                </View>
                <Text style={styles.termsText}>
                  I have read and agree to the{' '}
                  <Text style={styles.termsLink}>Terms & Policies</Text>
                  {' '}of Spotix™
                </Text>
              </Pressable>

              <Button
                title={t('signUp')}
                onPress={handleSignup}
                loading={isLoading}
                icon="🚀"
                style={{ marginTop: 8 }}
                disabled={passwordsMismatch || passwordStrength.level === 'weak' || passwordStrength.level === 'none' || !agreedTerms}
              />

              <View style={styles.loginRow}>
                <Text style={styles.loginText}>{t('alreadyHaveAccount')} </Text>
                <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(auth)/login'); }}>
                  <Text style={styles.loginLink}>{t('loginShort')}</Text>
                </Pressable>
              </View>
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
  subtitle: { fontSize: FontSizes.bodyLarge, color: Colors.textSecondary, marginBottom: 28 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
  phoneRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 4 },
  countryBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.surface, paddingHorizontal: 14, height: 52,
    borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border,
    ...Shadows.sm,
  },
  countryFlag: { fontSize: 22 },
  countryCode: { fontSize: FontSizes.body, color: Colors.text, fontWeight: FontWeights.bold },
  phoneInputWrap: { flex: 1, marginTop: -2 },
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -4, marginBottom: 8 },
  matchIcon: { fontSize: 12 },
  matchTextBad: { fontSize: 12, color: '#EF4444', fontWeight: '600' },
  matchTextOk: { fontSize: 12, color: '#10B981', fontWeight: '600' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  loginText: { color: Colors.textLight, fontSize: FontSizes.body },
  loginLink: { color: Colors.primary, fontSize: FontSizes.body, fontWeight: FontWeights.bold },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 12, marginBottom: 4, paddingRight: 10 },
  termsCheckbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center', marginTop: 1 },
  termsCheckboxOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  termsCheck: { color: '#fff', fontSize: 14, fontWeight: '800' },
  termsText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  termsLink: { color: Colors.primary, fontWeight: '700', textDecorationLine: 'underline' },
});
