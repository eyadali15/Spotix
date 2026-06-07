/**
 * Spotix — Owner Scanner (with Camera Permission)
 */
import React, { useState, useEffect, useRef } from 'react';
import { playSuccess, playFail } from '../../utils/sounds';
import { View, Text, StyleSheet, Dimensions, Animated, Alert, Pressable } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFadeIn, useFadeInDown, useScanLine, usePopIn } from '../../utils/animations';
import { Colors, Radius, Shadows } from '../../constants/colors';
import { FontSizes, FontWeights } from '../../constants/typography';
import { t } from '../../constants/i18n';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Card from '../../components/Card';
import useParkingStore from '../../store/parkingStore';

const { width } = Dimensions.get('window');

export default function ScannerScreen() {
  const { validateTicket } = useParkingStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [useCamera, setUseCamera] = useState(false);

  const headerAnim = useFadeIn(0);
  const scanAnim = useFadeInDown(200);
  const manualAnim = useFadeInDown(400);
  const scanLine = useScanLine();
  const resultAnim = usePopIn(!!result);

  const handleValidate = async (token) => {
    const t_code = (token || code).trim();
    if (!t_code) return;
    setIsValidating(true);
    setResult(null);
    const validationResult = await validateTicket(t_code);
    setIsValidating(false);
    if (validationResult.success) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); playSuccess(); setResult({ success: true, data: validationResult.data }); }
    else { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); playFail(); setResult({ success: false, error: validationResult.error }); }
  };

  const handleBarCodeScanned = ({ data }) => {
    if (scanned) return;
    setScanned(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    handleValidate(data);
  };

  const handleScanAnother = () => { setResult(null); setCode(''); setScanned(false); };

  const handleOpenCamera = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) { Alert.alert('Permission Required', 'Camera access is needed to scan QR tickets.'); return; }
    }
    setUseCamera(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  if (result) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.resultContainer}>
          <Animated.View style={[styles.resultContent, resultAnim]}>
            {result.success ? (
              <>
                <View style={styles.resultIconSuccess}><Text style={styles.resultEmoji}>✅</Text></View>
                <Text style={styles.resultTitle}>{t('validTicket')}</Text>
                <Card style={styles.resultCard}>
                  <View style={styles.resultRow}><Text style={styles.resultLabel}>{t('guest')}</Text><Text style={styles.resultValue}>{result.data?.reservation?.userName}</Text></View>
                  <View style={styles.resultDivider} />
                  <View style={styles.resultRow}><Text style={styles.resultLabel}>{t('parking')}</Text><Text style={styles.resultValue}>{result.data?.reservation?.lotName}</Text></View>
                  <View style={styles.resultDivider} />
                  <View style={styles.resultRow}><Text style={styles.resultLabel}>{t('status')}</Text><Text style={[styles.resultValue, { color: Colors.success }]}>Validated ✓</Text></View>
                </Card>
              </>
            ) : (
              <>
                <View style={styles.resultIconError}><Text style={styles.resultEmoji}>❌</Text></View>
                <Text style={styles.resultTitleError}>{t('invalidTicket')}</Text>
                <Text style={styles.resultError}>{result.error}</Text>
              </>
            )}
            <Button title={t('scanAnother')} onPress={handleScanAnother} icon="📷" style={{ marginTop: 24, width: '100%' }} />
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Animated.View style={[styles.header, headerAnim]}><Text style={styles.headerTitle}>{t('scanTicket')}</Text></Animated.View>

      <Animated.View style={[styles.scanArea, scanAnim]}>
        {useCamera && permission?.granted ? (
          <View style={styles.cameraWrap}>
            <CameraView style={styles.camera} onBarcodeScanned={scanned ? undefined : handleBarCodeScanned} barcodeScannerSettings={{ barcodeTypes: ['qr'] }}>
              <View style={styles.scanOverlay}>
                <View style={[styles.corner, styles.cornerTL]} /><View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} /><View style={[styles.corner, styles.cornerBR]} />
                <Animated.View style={[styles.scanLineStyle, scanLine]} />
              </View>
            </CameraView>
            <Pressable onPress={() => setUseCamera(false)} style={styles.closeCameraBtn}><Text style={styles.closeCameraText}>{t('close')}</Text></Pressable>
          </View>
        ) : (
          <Pressable onPress={handleOpenCamera} style={styles.scanFrame}>
            <View style={[styles.corner, styles.cornerTL]} /><View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} /><View style={[styles.corner, styles.cornerBR]} />
            <Animated.View style={[styles.scanLineStyle, scanLine]} />
            <Text style={styles.scanIcon}>📷</Text>
            <Text style={styles.scanText}>{t('tapToScan')}</Text>
            <Text style={styles.scanSubtext}>{t('pointCamera')}</Text>
          </Pressable>
        )}
      </Animated.View>

      <Animated.View style={[styles.manualSection, manualAnim]}>
        <Text style={styles.manualTitle}>📝 {t('manualEntry')}</Text>
        <Text style={styles.manualSubtitle}>{t('enterCode')}</Text>
        <Input label={t('ticketCode')} value={code} onChangeText={setCode} icon="🔑" />
        <Button title={t('validate')} onPress={() => handleValidate()} loading={isValidating} disabled={!code.trim()} icon="✅" />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: 22, fontWeight: FontWeights.extrabold, color: Colors.text },
  scanArea: { alignItems: 'center', paddingHorizontal: 40, marginBottom: 24 },
  cameraWrap: { width: width - 80, borderRadius: Radius.xl, overflow: 'hidden' },
  camera: { width: '100%', height: 250 },
  scanOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  closeCameraBtn: { backgroundColor: Colors.surface, paddingVertical: 10, alignItems: 'center' },
  closeCameraText: { color: Colors.textSecondary, fontWeight: FontWeights.semibold, fontSize: FontSizes.small },
  scanFrame: { width: width - 80, height: 220, borderRadius: Radius.xl, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: Colors.border, ...Shadows.md },
  corner: { position: 'absolute', width: 30, height: 30, borderColor: Colors.secondary },
  cornerTL: { top: 12, left: 12, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 8 },
  cornerTR: { top: 12, right: 12, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 },
  cornerBL: { bottom: 12, left: 12, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 8 },
  cornerBR: { bottom: 12, right: 12, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 8 },
  scanLineStyle: { position: 'absolute', left: 20, right: 20, height: 2, backgroundColor: Colors.secondary, opacity: 0.7 },
  scanIcon: { fontSize: 40, marginBottom: 8 },
  scanText: { color: Colors.text, fontSize: FontSizes.body, fontWeight: FontWeights.semibold },
  scanSubtext: { color: Colors.textLight, fontSize: FontSizes.caption, marginTop: 4 },
  manualSection: { paddingHorizontal: 24 },
  manualTitle: { fontSize: FontSizes.subtitle, fontWeight: FontWeights.bold, color: Colors.text, marginBottom: 4 },
  manualSubtitle: { fontSize: FontSizes.body, color: Colors.textSecondary, marginBottom: 16 },
  resultContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  resultContent: { alignItems: 'center', width: '100%' },
  resultIconSuccess: { width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.successLight, justifyContent: 'center', alignItems: 'center', marginBottom: 20, ...Shadows.lg },
  resultIconError: { width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.errorLight, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  resultEmoji: { fontSize: 48 },
  resultTitle: { fontSize: 24, fontWeight: FontWeights.extrabold, color: Colors.success, marginBottom: 20 },
  resultTitleError: { fontSize: 24, fontWeight: FontWeights.extrabold, color: Colors.error, marginBottom: 8 },
  resultError: { fontSize: FontSizes.body, color: Colors.textSecondary, textAlign: 'center' },
  resultCard: { width: '100%', padding: 20 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  resultLabel: { fontSize: FontSizes.body, color: Colors.textSecondary },
  resultValue: { fontSize: FontSizes.body, fontWeight: FontWeights.semibold, color: Colors.text },
  resultDivider: { height: 1, backgroundColor: Colors.border },
});
