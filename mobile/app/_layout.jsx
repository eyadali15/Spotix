/**
 * Spotix — Root Layout (3-role routing)
 */
import React, { useEffect, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import useAuthStore from '../store/authStore';
import { connectSocket, disconnectSocket } from '../services/socket';

function AuthGuard({ children }) {
  const { user, isAuthenticated } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const isNavigating = useRef(false);

  useEffect(() => {
    if (isNavigating.current) return;

    const inAuth = segments[0] === '(auth)';
    const inClient = segments[0] === '(client)';
    const inOwner = segments[0] === '(owner)';
    const inWashOwner = segments[0] === '(wash-owner)';
    const isRoot = !segments[0] || segments.length === 0;

    // Logged out → onboarding
    if (!isAuthenticated && (inClient || inOwner || inWashOwner)) {
      isNavigating.current = true;
      setTimeout(() => { router.replace('/'); setTimeout(() => { isNavigating.current = false; }, 1500); }, 50);
      return;
    }

    // Logged in → route to correct dashboard based on role
    if (isAuthenticated && user && (isRoot || inAuth)) {
      isNavigating.current = true;
      let target = '/(client)';
      if (user.role === 'PARKING_OWNER' || user.role === 'OWNER') target = '/(owner)';
      else if (user.role === 'WASH_OWNER') target = '/(wash-owner)';
      setTimeout(() => { router.replace(target); setTimeout(() => { isNavigating.current = false; }, 1500); }, 50);
    }
  }, [isAuthenticated, segments, user]);

  return children;
}

export default function RootLayout() {
  const { token, isAuthenticated, initialize } = useAuthStore();

  useEffect(() => { initialize(); }, []);

  useEffect(() => {
    if (isAuthenticated && token) connectSocket();
    else disconnectSocket();
    return () => disconnectSocket();
  }, [isAuthenticated, token]);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthGuard>
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: '#F8FAFC' } }}>
          <Stack.Screen name="index" options={{ animation: 'fade' }} />
          <Stack.Screen name="(auth)" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="(client)" options={{ animation: 'fade' }} />
          <Stack.Screen name="(owner)" options={{ animation: 'fade' }} />
          <Stack.Screen name="(wash-owner)" options={{ animation: 'fade' }} />
        </Stack>
      </AuthGuard>
    </SafeAreaProvider>
  );
}
