/**
 * Spotix — Button (Navy Gradient + Spring + Haptic)
 */
import React, { useRef } from 'react';
import { Text, StyleSheet, Pressable, Animated, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Radius, Shadows, Gradients } from '../constants/colors';
import { FontSizes, FontWeights } from '../constants/typography';

export default function Button({ title, onPress, variant = 'primary', loading, disabled, icon, style }) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 12 }).start();
  };
  const handlePress = () => { if (disabled || loading) return; Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onPress?.(); };

  if (variant === 'ghost') {
    return (
      <Animated.View style={[{ transform: [{ scale }] }, style]}>
        <Pressable onPressIn={onPressIn} onPressOut={onPressOut} onPress={handlePress} style={styles.ghostButton}>
          <Text style={styles.ghostText}>{icon ? `${icon} ` : ''}{title}</Text>
        </Pressable>
      </Animated.View>
    );
  }

  if (variant === 'outline') {
    return (
      <Animated.View style={[{ transform: [{ scale }] }, style]}>
        <Pressable onPressIn={onPressIn} onPressOut={onPressOut} onPress={handlePress} style={[styles.outlineButton, disabled && styles.disabledOutline]}>
          <Text style={styles.outlineText}>{icon ? `${icon} ` : ''}{title}</Text>
        </Pressable>
      </Animated.View>
    );
  }

  if (variant === 'danger') {
    return (
      <Animated.View style={[{ transform: [{ scale }] }, style]}>
        <Pressable onPressIn={onPressIn} onPressOut={onPressOut} onPress={handlePress} style={[styles.dangerButton, disabled && styles.disabledButton]}>
          <Text style={styles.buttonText}>{icon ? `${icon} ` : ''}{title}</Text>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable onPressIn={onPressIn} onPressOut={onPressOut} onPress={handlePress} disabled={disabled || loading}>
        <LinearGradient colors={disabled ? [Colors.disabled, Colors.disabled] : Gradients.navy} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.gradientButton, disabled && styles.disabledButton]}>
          {loading ? <ActivityIndicator color={Colors.white} size="small" /> : <Text style={styles.buttonText}>{icon ? `${icon} ` : ''}{title}</Text>}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  gradientButton: { height: 54, borderRadius: Radius.lg, justifyContent: 'center', alignItems: 'center', ...Shadows.lg },
  buttonText: { color: Colors.white, fontSize: FontSizes.bodyLarge, fontWeight: FontWeights.bold, letterSpacing: 0.3 },
  outlineButton: { height: 54, borderRadius: Radius.lg, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.primary, backgroundColor: Colors.primaryFaded },
  outlineText: { color: Colors.primary, fontSize: FontSizes.bodyLarge, fontWeight: FontWeights.bold },
  ghostButton: { height: 48, justifyContent: 'center', alignItems: 'center' },
  ghostText: { color: Colors.textSecondary, fontSize: FontSizes.body, fontWeight: FontWeights.semibold },
  dangerButton: { height: 54, borderRadius: Radius.lg, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.error },
  disabledButton: { opacity: 0.4 },
  disabledOutline: { opacity: 0.4, borderColor: Colors.disabled },
});
