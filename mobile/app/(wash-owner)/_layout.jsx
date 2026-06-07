/**
 * Spotix — Wash Owner Tab Layout
 * Dashboard · Bookings · Profile
 */
import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Shadows } from '../../constants/colors';
import { FontWeights } from '../../constants/typography';

function TabIcon({ emoji, label, focused }) {
  return (
    <View style={st.tabItem}>
      <View style={[st.emojiWrap, focused && st.emojiWrapActive]}>
        <Text style={[st.tabEmoji, focused && st.tabEmojiActive]}>{emoji}</Text>
      </View>
      <Text numberOfLines={1} style={[st.tabLabel, focused ? st.tabLabelActive : st.tabLabelInactive]}>{label}</Text>
    </View>
  );
}

export default function WashOwnerLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarShowLabel: false, tabBarStyle: st.tabBar }}>
      <Tabs.Screen name="index" options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📊" label="Dashboard" focused={focused} /> }} />
      <Tabs.Screen name="bookings" options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📋" label="Bookings" focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="Profile" focused={focused} /> }} />
      <Tabs.Screen name="scanner" options={{ href: null }} />
      <Tabs.Screen name="about" options={{ href: null }} />
      <Tabs.Screen name="contact" options={{ href: null }} />
      <Tabs.Screen name="policies" options={{ href: null }} />
    </Tabs>
  );
}

const st = StyleSheet.create({
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
