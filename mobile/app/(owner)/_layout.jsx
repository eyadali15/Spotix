/**
 * Spotix — Parking Owner Tab Layout
 */
import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Shadows } from '../../constants/colors';
import { FontWeights } from '../../constants/typography';
import { t } from '../../constants/i18n';

function TabIcon({ emoji, labelKey, focused }) {
  return (
    <View style={styles.tabItem}>
      <View style={[styles.emojiWrap, focused && styles.emojiWrapActive]}>
        <Text style={[styles.tabEmoji, focused && styles.tabEmojiActive]}>{emoji}</Text>
      </View>
      <Text numberOfLines={1} style={[styles.tabLabel, focused ? styles.tabLabelActive : styles.tabLabelInactive]}>{t(labelKey)}</Text>
    </View>
  );
}

export default function OwnerLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarShowLabel: false, tabBarStyle: styles.tabBar }}>
      <Tabs.Screen name="index" options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📊" labelKey="tabDashboard" focused={focused} /> }} />
      <Tabs.Screen name="parkings" options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🅿️" labelKey="tabParkings" focused={focused} /> }} />
      <Tabs.Screen name="scanner" options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📷" labelKey="tabScanner" focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="👤" labelKey="tabProfile" focused={focused} /> }} />
      <Tabs.Screen name="add-parking" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="wash-manage" options={{ href: null }} />
      <Tabs.Screen name="about" options={{ href: null }} />
      <Tabs.Screen name="contact" options={{ href: null }} />
      <Tabs.Screen name="policies" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: { backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border, height: 85, paddingTop: 8, paddingBottom: 20, ...Shadows.sm },
  tabItem: { alignItems: 'center', justifyContent: 'center', width: 70, gap: 4 },
  emojiWrap: { width: 40, height: 32, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  emojiWrapActive: { backgroundColor: Colors.primaryFaded },
  tabEmoji: { fontSize: 20, opacity: 0.4 },
  tabEmojiActive: { opacity: 1, fontSize: 22 },
  tabLabel: { fontSize: 10, fontWeight: FontWeights.medium, textAlign: 'center' },
  tabLabelActive: { color: Colors.primary, fontWeight: FontWeights.bold },
  tabLabelInactive: { color: Colors.textLight },
});
