/**
 * Spotix — Animation Helpers
 * Drop-in utilities using React Native's built-in Animated API
 * (replaces react-native-reanimated for Expo Go compatibility)
 */

import { useRef, useEffect } from 'react';
import { Animated, Easing } from 'react-native';

/**
 * Hook: fade in on mount
 */
export function useFadeIn(delay = 0, duration = 400) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }).start();
  }, []);

  return { opacity };
}

/**
 * Hook: fade in + slide up on mount
 */
export function useFadeInDown(delay = 0, duration = 400, distance = 30) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(distance)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.2)),
      }),
    ]).start();
  }, []);

  return {
    opacity,
    transform: [{ translateY }],
  };
}

/**
 * Hook: spring scale for press feedback
 */
export function usePressScale() {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  return { scale, onPressIn, onPressOut };
}

/**
 * Hook: pulse animation (loop)
 */
export function usePulse(active = false) {
  const scale = useRef(new Animated.Value(1)).current;
  const animRef = useRef(null);

  useEffect(() => {
    if (active) {
      animRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.3,
            duration: 800,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
        ])
      );
      animRef.current.start();
    } else {
      if (animRef.current) animRef.current.stop();
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
    }

    return () => {
      if (animRef.current) animRef.current.stop();
    };
  }, [active]);

  return { transform: [{ scale }] };
}

/**
 * Hook: shake animation (for errors)
 */
export function useShake() {
  const translateX = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(translateX, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  return { transform: [{ translateX }], shake };
}

/**
 * Hook: shimmer sweep (for ticket card)
 */
export function useShimmer() {
  const translateX = useRef(new Animated.Value(-200)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(translateX, {
        toValue: 400,
        duration: 2000,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    ).start();
  }, []);

  return { transform: [{ translateX }] };
}

/**
 * Hook: gentle 3D tilt float
 */
export function useTiltFloat() {
  const val = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(val, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(val, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();
  }, []);

  // Approximate a subtle translateY float
  const translateY = val.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });

  return { transform: [{ translateY }] };
}

/**
 * Hook: scan line animation
 */
export function useScanLine() {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: 200,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.linear,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.linear,
        }),
      ])
    ).start();
  }, []);

  return { transform: [{ translateY }] };
}

/**
 * Hook: success pop-in scale
 */
export function usePopIn(trigger = false) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (trigger) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 12,
          bounciness: 8,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scale.setValue(0);
      opacity.setValue(0);
    }
  }, [trigger]);

  return { opacity, transform: [{ scale }] };
}
