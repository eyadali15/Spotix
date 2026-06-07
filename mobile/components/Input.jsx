/**
 * Spotix — Input (Light Mode, Clean)
 */
import React, { useRef, useState } from 'react';
import { View, TextInput, Text, StyleSheet, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Radius, Shadows } from '../constants/colors';
import { FontSizes, FontWeights } from '../constants/typography';

export default function Input({ label, value, onChangeText, icon, secureTextEntry, keyboardType, placeholder, style }) {
  const [focused, setFocused] = useState(false);
  const borderColor = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    setFocused(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.timing(borderColor, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  };
  const handleBlur = () => {
    setFocused(false);
    Animated.timing(borderColor, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  };

  const animBorderColor = borderColor.interpolate({ inputRange: [0, 1], outputRange: [Colors.border, Colors.secondary] });

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={[styles.label, focused && { color: Colors.secondary }]}>{label}</Text>}
      <Animated.View style={[styles.inputContainer, { borderColor: animBorderColor }]}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <TextInput value={value} onChangeText={onChangeText} onFocus={handleFocus} onBlur={handleBlur} secureTextEntry={secureTextEntry} keyboardType={keyboardType} placeholder={placeholder} placeholderTextColor={Colors.placeholder} style={styles.input} selectionColor={Colors.secondary} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: FontSizes.small, fontWeight: FontWeights.semibold, color: Colors.textSecondary, marginBottom: 6, marginLeft: 4 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: Radius.md, borderWidth: 1.5, paddingHorizontal: 14, minHeight: 52, ...Shadows.sm },
  icon: { fontSize: 16, marginRight: 10 },
  input: { flex: 1, fontSize: FontSizes.body, color: Colors.text, fontWeight: FontWeights.medium, paddingVertical: 8 },
});
