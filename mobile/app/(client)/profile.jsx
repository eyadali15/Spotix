/**
 * Spotix — Client Profile (Light Mode)
 * Added: About, Contact, Policies pages
 */
import React from 'react';
import { View, Text, StyleSheet, Alert, Pressable, Animated, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFadeIn, useFadeInDown } from '../../utils/animations';
import { Colors, Radius, Shadows, Gradients } from '../../constants/colors';
import { FontSizes, FontWeights } from '../../constants/typography';
import { t, setLanguage, getLanguage } from '../../constants/i18n';
import Card from '../../components/Card';
import Button from '../../components/Button';
import useAuthStore from '../../store/authStore';

function MenuItem({ icon, label, onPress, color }) {
  return (
    <>
      <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress?.(); }} style={styles.settingRow}>
        <View style={styles.settingLeft}>
          <Text style={styles.settingIcon}>{icon}</Text>
          <Text style={[styles.settingLabel, color && { color }]}>{label}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
      <View style={styles.settingDivider} />
    </>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, setLanguage: storeSetLanguage } = useAuthStore();
  const headerAnim = useFadeIn(0);
  const userAnim = useFadeInDown(100);
  const settingsAnim = useFadeInDown(200);
  const infoAnim = useFadeInDown(300);
  const logoutAnim = useFadeInDown(400);

  const handleLogout = () => { Alert.alert(t('logout'), t('logoutConfirm'), [{ text: t('cancel'), style: 'cancel' }, { text: t('logout'), style: 'destructive', onPress: () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); logout(); } }]); };
  const handleLanguageToggle = () => { const newLang = getLanguage() === 'en' ? 'ar' : 'en'; setLanguage(newLang); storeSetLanguage?.(newLang); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <Animated.View style={[styles.header, headerAnim]}><Text style={styles.headerTitle}>{t('profile')}</Text></Animated.View>

        {/* User Card */}
        <Animated.View style={[styles.section, userAnim]}>
          <Card style={styles.userCard}>
            <LinearGradient colors={Gradients.navy} style={styles.avatar}><Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || '?'}</Text></LinearGradient>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userEmail}>{user?.email || user?.phone}</Text>
            <View style={styles.roleBadge}><Text style={styles.roleEmoji}>🚗</Text><Text style={styles.roleText}>{t('driver')}</Text></View>
          </Card>
        </Animated.View>

        {/* Settings */}
        <Animated.View style={[styles.section, settingsAnim]}>
          <Text style={styles.sectionTitle}>{t('settings')}</Text>
          <Card style={styles.settingsCard}>
            <Pressable onPress={handleLanguageToggle} style={styles.settingRow}>
              <View style={styles.settingLeft}><Text style={styles.settingIcon}>🌐</Text><Text style={styles.settingLabel}>{t('language')}</Text></View>
              <View style={styles.languageToggle}><Text style={styles.languageValue}>{getLanguage() === 'en' ? t('english') : t('arabic')}</Text><Text style={styles.chevron}>›</Text></View>
            </Pressable>
            <View style={styles.settingDivider} />
            <View style={styles.settingRow}><View style={styles.settingLeft}><Text style={styles.settingIcon}>📱</Text><Text style={styles.settingLabel}>{t('version')}</Text></View><Text style={styles.settingValue}>1.0.0</Text></View>
          </Card>
        </Animated.View>

        {/* Info Pages */}
        <Animated.View style={[styles.section, infoAnim]}>
          <Text style={styles.sectionTitle}>Information</Text>
          <Card style={styles.settingsCard}>
            <MenuItem icon="ℹ️" label="About Spotix" onPress={() => router.push('/(client)/about')} />
            <MenuItem icon="📞" label="Contact Us" onPress={() => router.push('/(client)/contact')} />
            <MenuItem icon="📋" label="Terms & Policies" onPress={() => router.push('/(client)/policies')} />
          </Card>
        </Animated.View>

        {/* Logout */}
        <Animated.View style={[styles.logoutSection, logoutAnim]}>
          <Button title={t('logout')} onPress={handleLogout} variant="outline" icon="👋" style={styles.logoutButton} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: 24, fontWeight: FontWeights.extrabold, color: Colors.text },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: FontSizes.small, fontWeight: FontWeights.semibold, color: Colors.textLight, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  userCard: { alignItems: 'center', paddingVertical: 28 },
  avatar: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 14, ...Shadows.lg },
  avatarText: { fontSize: 28, fontWeight: FontWeights.bold, color: Colors.white },
  userName: { fontSize: FontSizes.subtitle, fontWeight: FontWeights.bold, color: Colors.text, marginBottom: 4 },
  userEmail: { fontSize: FontSizes.body, color: Colors.textSecondary, marginBottom: 12 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.secondaryFaded, paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.full, gap: 6 },
  roleEmoji: { fontSize: 14 },
  roleText: { fontSize: FontSizes.small, fontWeight: FontWeights.semibold, color: Colors.secondary },
  settingsCard: { padding: 0, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingIcon: { fontSize: 20 },
  settingLabel: { fontSize: FontSizes.body, fontWeight: FontWeights.medium, color: Colors.text },
  settingValue: { fontSize: FontSizes.body, color: Colors.textLight },
  settingDivider: { height: 1, backgroundColor: Colors.border, marginHorizontal: 16 },
  languageToggle: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  languageValue: { fontSize: FontSizes.body, color: Colors.textSecondary },
  chevron: { fontSize: 20, color: Colors.textLight },
  logoutSection: { paddingHorizontal: 20, paddingBottom: 30 },
  logoutButton: { borderColor: Colors.error },
});
