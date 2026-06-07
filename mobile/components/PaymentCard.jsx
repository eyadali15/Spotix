/**
 * Spotix — Payment Analytics Card (Premium)
 * Shows revenue breakdown, cash vs online, bar chart
 */
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Radius, Shadows } from '../constants/colors';
import api from '../services/api';

const { width } = Dimensions.get('window');
const BAR_MAX_H = 100;

function AnimatedBar({ height, delay, color }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: height, duration: 800, delay, useNativeDriver: false }).start();
  }, [height]);
  return <Animated.View style={{ width: 28, backgroundColor: color, borderRadius: 6, height: anim }} />;
}

function PieSlice({ percent, color, label, amount }) {
  return (
    <View style={ps.row}>
      <View style={[ps.dot, { backgroundColor: color }]} />
      <View style={{ flex: 1 }}>
        <Text style={ps.label}>{label}</Text>
        <View style={ps.barBg}>
          <View style={[ps.barFill, { width: `${Math.min(percent, 100)}%`, backgroundColor: color }]} />
        </View>
      </View>
      <View style={ps.right}>
        <Text style={ps.amount}>{amount} EGP</Text>
        <Text style={ps.percent}>{Math.round(percent)}%</Text>
      </View>
    </View>
  );
}

export default function PaymentCard({ type = 'parking', lotId }) {
  const [data, setData] = useState(null);
  const [visible, setVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const fetchPayments = async () => {
    try {
      let res;
      if (type === 'parking' && lotId) {
        res = await api.get(`/parking/${lotId}/payments`);
      } else {
        res = await api.get('/washing/owner/payments');
      }
      setData(res.data);
    } catch { setData(null); }
  };

  const toggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!visible && !data) fetchPayments();
    Animated.spring(slideAnim, { toValue: visible ? 0 : 1, tension: 80, friction: 12, useNativeDriver: false }).start();
    setVisible(!visible);
  };

  const cardHeight = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 480] });
  const cardOpacity = slideAnim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0, 1] });

  const maxDay = data ? Math.max(...data.chartDays.map(d => d.amount), 1) : 1;
  const cashPct = data && data.totalRevenue > 0 ? (data.cashRevenue / data.totalRevenue) * 100 : 0;
  const onlinePct = data && data.totalRevenue > 0 ? (data.onlineRevenue / data.totalRevenue) * 100 : 0;

  return (
    <View style={s.container}>
      <Pressable onPress={toggle} style={s.toggleBtn}>
        <Text style={s.toggleIcon}>💰</Text>
        <Text style={s.toggleText}>Payment Analytics</Text>
        <Text style={s.toggleArrow}>{visible ? '▼' : '▶'}</Text>
      </Pressable>

      <Animated.View style={[s.card, { maxHeight: cardHeight, opacity: cardOpacity }]}>
        {data && (
          <View style={s.inner}>
            {/* Summary Cards */}
            <View style={s.summaryRow}>
              <View style={[s.summaryCard, { backgroundColor: 'rgba(16,185,129,0.08)' }]}>
                <Text style={s.summaryLabel}>Total Revenue</Text>
                <Text style={[s.summaryValue, { color: Colors.success }]}>{data.totalRevenue} EGP</Text>
              </View>
              <View style={[s.summaryCard, { backgroundColor: 'rgba(59,130,246,0.08)' }]}>
                <Text style={s.summaryLabel}>Bookings</Text>
                <Text style={[s.summaryValue, { color: Colors.secondary }]}>{data.totalBookings}</Text>
              </View>
            </View>

            {/* Cash vs Online */}
            <Text style={s.sectionTitle}>Payment Methods</Text>
            <View style={s.methodsCard}>
              <PieSlice percent={cashPct} color="#10B981" label="💵 Cash" amount={data.cashRevenue} />
              <View style={s.divider} />
              <PieSlice percent={onlinePct} color="#3B82F6" label="💳 Paymob (Visa/MC/Wallet)" amount={data.onlineRevenue} />
            </View>

            {/* Weekly Chart */}
            <Text style={s.sectionTitle}>Last 7 Days</Text>
            <View style={s.chartCard}>
              <View style={s.chartRow}>
                {data.chartDays.map((d, i) => (
                  <View key={d.date} style={s.chartCol}>
                    <Text style={s.chartAmount}>{d.amount > 0 ? d.amount : ''}</Text>
                    <AnimatedBar
                      height={d.amount > 0 ? (d.amount / maxDay) * BAR_MAX_H : 4}
                      delay={i * 80}
                      color={d.amount > 0 ? Colors.primary : Colors.border}
                    />
                    <Text style={s.chartLabel}>{d.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
        {!data && visible && <Text style={{ textAlign: 'center', padding: 20, color: Colors.textLight }}>Loading...</Text>}
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { marginBottom: 14 },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: Radius.xl, padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 10, ...Shadows.sm },
  toggleIcon: { fontSize: 22 },
  toggleText: { flex: 1, fontSize: 15, fontWeight: '700', color: Colors.text },
  toggleArrow: { fontSize: 12, color: Colors.textLight },
  card: { overflow: 'hidden' },
  inner: { padding: 4, paddingTop: 12 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  summaryCard: { flex: 1, borderRadius: Radius.lg, padding: 16, alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: Colors.textLight, fontWeight: '600', marginBottom: 4 },
  summaryValue: { fontSize: 22, fontWeight: '800' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 10, marginTop: 4 },
  methodsCard: { backgroundColor: '#fff', borderRadius: Radius.lg, padding: 16, borderWidth: 1, borderColor: Colors.border, marginBottom: 16 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 12 },
  chartCard: { backgroundColor: '#fff', borderRadius: Radius.lg, padding: 16, borderWidth: 1, borderColor: Colors.border },
  chartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: BAR_MAX_H + 40 },
  chartCol: { alignItems: 'center', flex: 1, gap: 4 },
  chartAmount: { fontSize: 9, color: Colors.textLight, fontWeight: '600' },
  chartLabel: { fontSize: 10, color: Colors.textSecondary, fontWeight: '600', marginTop: 4 },
});

const ps = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 4 },
  barBg: { height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
  right: { alignItems: 'flex-end' },
  amount: { fontSize: 14, fontWeight: '800', color: Colors.text },
  percent: { fontSize: 11, color: Colors.textLight },
});
