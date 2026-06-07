/**
 * Spotix — OTP Verify Screen (Premium Dark)
 */
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, Pressable, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useFadeIn, useFadeInDown, useShake, usePopIn } from '../../utils/animations';
import { Colors, Radius, Shadows } from '../../constants/colors';
import { FontSizes, FontWeights } from '../../constants/typography';
import { t } from '../../constants/i18n';
import useAuthStore from '../../store/authStore';

export default function VerifyScreen() {
  const router = useRouter();
  const { verifyOtp, resendOtp, isLoading } = useAuthStore();
  const [code, setCode] = useState(['', '', '', '']);
  const [verified, setVerified] = useState(false);
  const inputRefs = useRef([]);

  const headerAnim = useFadeIn(0);
  const formAnim = useFadeInDown(200);
  const shakeAnim = useShake();
  const successAnim = usePopIn(verified);

  const handleChange = (text, index) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);
    if (text && index < 3) inputRefs.current[index + 1]?.focus();
    if (newCode.every(d => d)) handleVerify(newCode.join(''));
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handleVerify = async (otp) => {
    const result = await verifyOtp(otp);
    if (result.success) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setVerified(true); }
    else { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); shakeAnim.shake(); setCode(['', '', '', '']); inputRefs.current[0]?.focus(); Alert.alert(t('error'), result.error); }
  };

  if (verified) {
    // Auto-navigate after verification
    const { user } = useAuthStore.getState();
    const role = user?.role;
    setTimeout(() => {
      if (role === 'PARKING_OWNER') router.replace('/(auth)/setup-parking');
      else if (role === 'WASH_OWNER') router.replace('/(auth)/setup-wash');
      else router.replace('/(client)');
    }, 2000);

    return (
      <View style={{ flex: 1, backgroundColor: Colors.background }}>
        <SafeAreaView style={styles.container}>
          <View style={styles.successContainer}>
            <Animated.View style={successAnim}><Text style={styles.successEmoji}>✅</Text></Animated.View>
            <Text style={styles.successTitle}>{t('verified')}</Text>
            <Text style={styles.successSubtitle}>{t('accountReady')}</Text>
            {role !== 'CLIENT' && <Text style={{ color: Colors.textLight, marginTop: 12, fontSize: 13 }}>Setting up your store...</Text>}
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.content}>
          <Animated.View style={headerAnim}>
            <Pressable onPress={() => router.back()} style={styles.backButton}><Text style={styles.backArrow}>←</Text></Pressable>
            <Text style={styles.title}>{t('verifyPhone')}</Text>
            <Text style={styles.subtitle}>{t('enterOtp')}</Text>
          </Animated.View>

          <Animated.View style={[styles.codeContainer, formAnim, shakeAnim]}>
            {code.map((digit, index) => (
              <TextInput key={index} ref={(ref) => (inputRefs.current[index] = ref)} value={digit} onChangeText={(text) => handleChange(text.slice(-1), index)} onKeyPress={(e) => handleKeyPress(e, index)} keyboardType="number-pad" maxLength={1} style={[styles.codeInput, digit && styles.codeInputFilled]} autoFocus={index === 0} />
            ))}
          </Animated.View>

          <View style={styles.actions}>
            <Pressable onPress={() => { resendOtp(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}><Text style={styles.resendText}>{t('resendOtp')}</Text></Pressable>
            <Text style={styles.hint}>💡 Check backend console for OTP code</Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 24 },
  backButton: { width: 48, height: 48, borderRadius: 14, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, marginBottom: 24, ...Shadows.md },
  backArrow: { fontSize: 20, color: Colors.text },
  title: { fontSize: 28, fontWeight: FontWeights.extrabold, color: Colors.text, marginBottom: 8 },
  subtitle: { fontSize: FontSizes.bodyLarge, color: Colors.textSecondary, marginBottom: 40 },
  codeContainer: { flexDirection: 'row', justifyContent: 'center', gap: 14, marginBottom: 32 },
  codeInput: { width: 60, height: 68, borderRadius: Radius.lg, backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.border, textAlign: 'center', fontSize: 28, fontWeight: FontWeights.bold, color: Colors.text, ...Shadows.sm },
  codeInputFilled: { borderColor: Colors.primary, backgroundColor: Colors.primaryFaded },
  actions: { alignItems: 'center', gap: 12 },
  resendText: { color: Colors.primary, fontWeight: FontWeights.semibold, fontSize: FontSizes.body },
  hint: { color: Colors.textLight, fontSize: FontSizes.small, marginTop: 8 },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  successEmoji: { fontSize: 72, marginBottom: 24 },
  successTitle: { fontSize: 28, fontWeight: FontWeights.extrabold, color: Colors.success, marginBottom: 8 },
  successSubtitle: { fontSize: FontSizes.bodyLarge, color: Colors.textSecondary },
});
