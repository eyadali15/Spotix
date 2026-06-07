/**
 * Spotix — Country Picker Component
 * Searchable country code picker with flags
 */
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, FlatList, Pressable, TextInput } from 'react-native';
import { Colors, Radius, Shadows, Spacing } from '../constants/colors';
import { FontSizes, FontWeights } from '../constants/typography';

const COUNTRIES = [
  { code: 'EG', dial: '+20', flag: '🇪🇬', name: 'Egypt' },
  { code: 'SA', dial: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: 'AE', dial: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: 'KW', dial: '+965', flag: '🇰🇼', name: 'Kuwait' },
  { code: 'QA', dial: '+974', flag: '🇶🇦', name: 'Qatar' },
  { code: 'BH', dial: '+973', flag: '🇧🇭', name: 'Bahrain' },
  { code: 'OM', dial: '+968', flag: '🇴🇲', name: 'Oman' },
  { code: 'JO', dial: '+962', flag: '🇯🇴', name: 'Jordan' },
  { code: 'LB', dial: '+961', flag: '🇱🇧', name: 'Lebanon' },
  { code: 'IQ', dial: '+964', flag: '🇮🇶', name: 'Iraq' },
  { code: 'LY', dial: '+218', flag: '🇱🇾', name: 'Libya' },
  { code: 'TN', dial: '+216', flag: '🇹🇳', name: 'Tunisia' },
  { code: 'MA', dial: '+212', flag: '🇲🇦', name: 'Morocco' },
  { code: 'SD', dial: '+249', flag: '🇸🇩', name: 'Sudan' },
  { code: 'US', dial: '+1', flag: '🇺🇸', name: 'United States' },
  { code: 'GB', dial: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: 'DE', dial: '+49', flag: '🇩🇪', name: 'Germany' },
  { code: 'FR', dial: '+33', flag: '🇫🇷', name: 'France' },
  { code: 'TR', dial: '+90', flag: '🇹🇷', name: 'Turkey' },
  { code: 'IN', dial: '+91', flag: '🇮🇳', name: 'India' },
  { code: 'PK', dial: '+92', flag: '🇵🇰', name: 'Pakistan' },
  { code: 'CN', dial: '+86', flag: '🇨🇳', name: 'China' },
];

export default function CountryPicker({ selected, onSelect }) {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');
  const country = COUNTRIES.find(c => c.code === selected) || COUNTRIES[0];

  const filtered = useMemo(() => {
    if (!search) return COUNTRIES;
    const q = search.toLowerCase();
    return COUNTRIES.filter(c => c.name.toLowerCase().includes(q) || c.dial.includes(q));
  }, [search]);

  return (
    <>
      <Pressable onPress={() => setVisible(true)} style={styles.trigger}>
        <Text style={styles.flag}>{country.flag}</Text>
        <Text style={styles.dial}>{country.dial}</Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>

      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <Pressable onPress={() => { setVisible(false); setSearch(''); }}>
                <Text style={styles.closeBtn}>✕</Text>
              </Pressable>
            </View>
            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search country..."
                placeholderTextColor={Colors.placeholder}
                style={styles.searchInput}
              />
            </View>
            <FlatList
              data={filtered}
              keyExtractor={item => item.code}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => { onSelect(item.code); setVisible(false); setSearch(''); }}
                  style={[styles.countryRow, item.code === selected && styles.countryRowSelected]}
                >
                  <Text style={styles.countryFlag}>{item.flag}</Text>
                  <Text style={styles.countryName}>{item.name}</Text>
                  <Text style={styles.countryDial}>{item.dial}</Text>
                </Pressable>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

export function getDialCode(countryCode) {
  return COUNTRIES.find(c => c.code === countryCode)?.dial || '+20';
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginRight: 10,
    gap: 6,
  },
  flag: { fontSize: 20 },
  dial: { fontSize: FontSizes.body, fontWeight: FontWeights.semibold, color: Colors.text },
  chevron: { fontSize: 10, color: Colors.textLight },
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.card, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, maxHeight: '75%', paddingBottom: 30 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: FontSizes.subtitle, fontWeight: FontWeights.bold, color: Colors.text },
  closeBtn: { fontSize: 20, color: Colors.textLight, padding: 4 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, margin: 16, borderRadius: Radius.lg, paddingHorizontal: 14, borderWidth: 1, borderColor: Colors.border },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: FontSizes.body, color: Colors.text, paddingVertical: 12 },
  countryRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 14, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  countryRowSelected: { backgroundColor: Colors.primaryFaded },
  countryFlag: { fontSize: 24 },
  countryName: { flex: 1, fontSize: FontSizes.body, color: Colors.text, fontWeight: FontWeights.medium },
  countryDial: { fontSize: FontSizes.body, color: Colors.textSecondary, fontWeight: FontWeights.semibold },
});
