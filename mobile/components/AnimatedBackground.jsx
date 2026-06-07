/**
 * Spotix — Premium Animated Parking Background
 * Cinematic car/parking animations for the start page
 */
import React, { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// Animated car that moves across the screen
function MovingCar({ delay, y, direction, speed, color, size }) {
  const translateX = useRef(new Animated.Value(direction === 'rtl' ? width + 60 : -60 - size)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const dest = direction === 'rtl' ? -60 - size : width + 60;
    const startVal = direction === 'rtl' ? width + 60 : -60 - size;

    const animate = () => {
      translateX.setValue(startVal);
      opacity.setValue(0);
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, { toValue: 0.6, duration: 300, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: dest, duration: speed, useNativeDriver: true, easing: Easing.linear }),
      ]).start(() => {
        opacity.setValue(0);
        animate();
      });
    };
    animate();
  }, []);

  const carWidth = size;
  const carHeight = size * 0.4;

  return (
    <Animated.View style={[styles.carWrap, { top: y, opacity, transform: [{ translateX }, { scaleX: direction === 'rtl' ? -1 : 1 }] }]}>
      {/* Car body */}
      <View style={[styles.carBody, { width: carWidth, height: carHeight, backgroundColor: color, borderRadius: carHeight * 0.35 }]}>
        {/* Roof */}
        <View style={[styles.carRoof, { width: carWidth * 0.5, height: carHeight * 0.7, left: carWidth * 0.2, backgroundColor: color, borderRadius: carHeight * 0.3 }]} />
        {/* Headlight */}
        <View style={[styles.headlight, { right: -2, top: carHeight * 0.25, backgroundColor: '#FFE066' }]} />
        {/* Tail light */}
        <View style={[styles.taillight, { left: -1, top: carHeight * 0.25, backgroundColor: '#FF4444' }]} />
        {/* Windows */}
        <View style={[styles.carWindow, { left: carWidth * 0.25, width: carWidth * 0.18, height: carHeight * 0.45, top: -carHeight * 0.15 }]} />
        <View style={[styles.carWindow, { left: carWidth * 0.48, width: carWidth * 0.18, height: carHeight * 0.45, top: -carHeight * 0.15 }]} />
      </View>
      {/* Wheels */}
      <View style={[styles.wheel, { left: carWidth * 0.15, bottom: -carHeight * 0.15 }]} />
      <View style={[styles.wheel, { left: carWidth * 0.7, bottom: -carHeight * 0.15 }]} />
    </Animated.View>
  );
}

// Road lane markings
function RoadLane({ y }) {
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(translateX, { toValue: -80, duration: 2000, useNativeDriver: true, easing: Easing.linear })
    ).start();
  }, []);

  const dashes = useMemo(() => Array.from({ length: Math.ceil(width / 80) + 2 }, (_, i) => i), []);

  return (
    <Animated.View style={[styles.roadLane, { top: y, transform: [{ translateX }] }]}>
      {dashes.map(i => (
        <View key={i} style={styles.dash} />
      ))}
    </Animated.View>
  );
}

// Parking spot markers at the bottom
function ParkingSpots() {
  const anims = useRef(Array.from({ length: 6 }, () => new Animated.Value(0))).current;

  useEffect(() => {
    anims.forEach((anim, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 800),
          Animated.timing(anim, { toValue: 1, duration: 1500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(anim, { toValue: 0.3, duration: 1500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        ])
      ).start();
    });
  }, []);

  return (
    <View style={styles.parkingSpotsRow}>
      {anims.map((anim, i) => (
        <Animated.View key={i} style={[styles.parkingSpot, { opacity: anim }]}>
          <View style={styles.parkingSpotInner} />
        </Animated.View>
      ))}
    </View>
  );
}

// Floating light particles
function LightParticle({ delay, startX }) {
  const translateY = useRef(new Animated.Value(height)).current;
  const translateX = useRef(new Animated.Value(startX)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      translateY.setValue(height);
      opacity.setValue(0);
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(translateY, { toValue: -20, duration: 6000 + Math.random() * 3000, useNativeDriver: true, easing: Easing.linear }),
          Animated.sequence([
            Animated.timing(opacity, { toValue: 0.5 + Math.random() * 0.3, duration: 1500, useNativeDriver: true }),
            Animated.delay(2000),
            Animated.timing(opacity, { toValue: 0, duration: 2000, useNativeDriver: true }),
          ]),
        ]),
      ]).start(() => animate());
    };
    animate();
  }, []);

  return (
    <Animated.View style={[styles.lightParticle, { transform: [{ translateY }, { translateX }], opacity }]} />
  );
}

const carConfigs = [
  { delay: 0, y: height * 0.25, direction: 'ltr', speed: 6000, color: 'rgba(59,130,246,0.5)', size: 50 },
  { delay: 2000, y: height * 0.35, direction: 'rtl', speed: 5000, color: 'rgba(16,185,129,0.4)', size: 42 },
  { delay: 4000, y: height * 0.55, direction: 'ltr', speed: 7000, color: 'rgba(245,158,11,0.4)', size: 55 },
  { delay: 1000, y: height * 0.45, direction: 'rtl', speed: 4500, color: 'rgba(139,92,246,0.35)', size: 38 },
  { delay: 3000, y: height * 0.65, direction: 'ltr', speed: 8000, color: 'rgba(236,72,153,0.3)', size: 48 },
  { delay: 5500, y: height * 0.3, direction: 'ltr', speed: 5500, color: 'rgba(59,130,246,0.35)', size: 44 },
];

const particleConfigs = Array.from({ length: 8 }, (_, i) => ({
  delay: i * 900,
  startX: (width / 8) * i + Math.random() * 30,
}));

export default function AnimatedBackground() {
  return (
    <View style={styles.container} pointerEvents="none">
      <LinearGradient
        colors={['#0F172A', '#1E293B', '#0F172A']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Subtle road lines */}
      <RoadLane y={height * 0.3} />
      <RoadLane y={height * 0.5} />
      <RoadLane y={height * 0.7} />

      {/* Moving cars */}
      {carConfigs.map((cfg, i) => (
        <MovingCar key={i} {...cfg} />
      ))}

      {/* Light particles */}
      {particleConfigs.map((cfg, i) => (
        <LightParticle key={i} {...cfg} />
      ))}

      {/* Parking spots at bottom */}
      <ParkingSpots />

      {/* Top gradient overlay for content readability */}
      <LinearGradient
        colors={['rgba(15,23,42,0.9)', 'transparent', 'rgba(15,23,42,0.8)']}
        style={StyleSheet.absoluteFillObject}
        locations={[0, 0.5, 1]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  carWrap: { position: 'absolute', zIndex: 2 },
  carBody: { position: 'relative' },
  carRoof: { position: 'absolute', bottom: '80%' },
  headlight: { position: 'absolute', width: 4, height: 4, borderRadius: 2 },
  taillight: { position: 'absolute', width: 3, height: 3, borderRadius: 1.5 },
  carWindow: { position: 'absolute', backgroundColor: 'rgba(147,197,253,0.4)', borderRadius: 2 },
  wheel: { position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(30,41,59,0.8)', borderWidth: 1, borderColor: 'rgba(100,116,139,0.5)' },
  roadLane: { position: 'absolute', flexDirection: 'row', height: 2, width: width + 160 },
  dash: { width: 30, height: 2, backgroundColor: 'rgba(100,116,139,0.15)', marginRight: 50, borderRadius: 1 },
  parkingSpotsRow: { position: 'absolute', bottom: 80, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 14, paddingHorizontal: 30 },
  parkingSpot: { width: 36, height: 52, borderWidth: 1.5, borderColor: 'rgba(59,130,246,0.3)', borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  parkingSpotInner: { width: 20, height: 8, backgroundColor: 'rgba(59,130,246,0.2)', borderRadius: 2 },
  lightParticle: { position: 'absolute', width: 3, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(147,197,253,0.6)' },
});
