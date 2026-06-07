/**
 * Spotix — Premium Elegant Background
 * Layered gradient mesh + floating luminous orbs + subtle grid
 */
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

function FloatingOrb({ x, y, size, color, speed, delay = 0 }) {
  const anim = useRef(new Animated.Value(0)).current;
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: speed, easing: Easing.inOut(Easing.sin), useNativeDriver: true, delay }),
        Animated.timing(anim, { toValue: 0, duration: speed, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: speed * 1.3, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: speed * 1.3, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute', left: x, top: y, width: size, height: size, borderRadius: size / 2,
        backgroundColor: color,
        opacity: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.04, 0.12, 0.04] }),
        transform: [
          { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -30] }) },
          { translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [-10, 15] }) },
          { scale: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.85, 1.15, 0.85] }) },
        ],
      }}
    />
  );
}

function ShimmerLine({ y, speed, delay = 0 }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: speed, easing: Easing.inOut(Easing.sin), useNativeDriver: true, delay }),
        Animated.timing(anim, { toValue: 0, duration: speed, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute', top: y, left: 0, right: 0, height: 1,
        opacity: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.06, 0] }),
        transform: [{ scaleX: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 1.1, 0.6] }) }],
      }}
    >
      <LinearGradient
        colors={['transparent', 'rgba(147,197,253,0.5)', 'rgba(167,139,250,0.3)', 'transparent']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={{ flex: 1 }}
      />
    </Animated.View>
  );
}

function PulseRing({ x, y, size, delay = 0 }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 4000, easing: Easing.out(Easing.ease), useNativeDriver: true, delay }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: size / 2,
        borderWidth: 1, borderColor: 'rgba(99,102,241,0.15)',
        opacity: anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.3, 0.15, 0] }),
        transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 2] }) }],
      }}
    />
  );
}

export default function BackgroundPaths({ dark = true, children }) {
  return (
    <View style={[bgStyles.container, { backgroundColor: dark ? '#070B14' : '#F8FAFC' }]}>
      {/* Base gradient */}
      <LinearGradient
        colors={dark ? ['#070B14', '#0C1222', '#111B33', '#0C1222', '#070B14'] : ['#F8FAFC', '#EFF6FF', '#F8FAFC']}
        locations={dark ? [0, 0.25, 0.5, 0.75, 1] : [0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Gradient mesh spots */}
      <View style={[bgStyles.meshSpot, { top: height * 0.05, left: -width * 0.3, width: width * 0.8, height: width * 0.8, backgroundColor: 'rgba(59,130,246,0.06)', borderRadius: width * 0.4 }]} />
      <View style={[bgStyles.meshSpot, { top: height * 0.35, right: -width * 0.2, width: width * 0.7, height: width * 0.7, backgroundColor: 'rgba(99,102,241,0.05)', borderRadius: width * 0.35 }]} />
      <View style={[bgStyles.meshSpot, { bottom: height * 0.05, left: width * 0.1, width: width * 0.6, height: width * 0.6, backgroundColor: 'rgba(139,92,246,0.04)', borderRadius: width * 0.3 }]} />

      {/* Floating orbs */}
      <FloatingOrb x={width * 0.1} y={height * 0.08} size={200} color="#3B82F6" speed={6000} delay={0} />
      <FloatingOrb x={width * 0.55} y={height * 0.22} size={160} color="#8B5CF6" speed={7500} delay={1000} />
      <FloatingOrb x={-30} y={height * 0.5} size={180} color="#6366F1" speed={5500} delay={500} />
      <FloatingOrb x={width * 0.4} y={height * 0.7} size={140} color="#06B6D4" speed={8000} delay={1500} />
      <FloatingOrb x={width * 0.7} y={height * 0.85} size={120} color="#3B82F6" speed={6500} delay={800} />

      {/* Shimmer lines */}
      <ShimmerLine y={height * 0.15} speed={5000} delay={0} />
      <ShimmerLine y={height * 0.35} speed={6000} delay={1500} />
      <ShimmerLine y={height * 0.55} speed={5500} delay={3000} />
      <ShimmerLine y={height * 0.75} speed={7000} delay={500} />
      <ShimmerLine y={height * 0.9} speed={4500} delay={2000} />

      {/* Pulse rings */}
      <PulseRing x={width * 0.2} y={height * 0.18} size={80} delay={0} />
      <PulseRing x={width * 0.8} y={height * 0.4} size={60} delay={2000} />
      <PulseRing x={width * 0.5} y={height * 0.75} size={70} delay={1000} />

      {/* Subtle vignette */}
      <LinearGradient
        colors={['rgba(7,11,20,0.4)', 'transparent', 'transparent', 'rgba(7,11,20,0.6)']}
        locations={[0, 0.2, 0.8, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Content */}
      {children && <View style={bgStyles.content}>{children}</View>}
    </View>
  );
}

const bgStyles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  meshSpot: { position: 'absolute' },
  content: { flex: 1, zIndex: 10 },
});
