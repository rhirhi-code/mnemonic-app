import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RecapResult } from '@/ai/types';
import { RecapCard } from '@/components/RecapCard';
import { useAI } from '@/hooks/useAI';

type Period = 'today' | 'week' | 'month';

const PERIODS: { key: Period; label: string; display: string }[] = [
  { key: 'today', label: 'Today', display: 'Today' },
  { key: 'week', label: 'This Week', display: 'This Week' },
  { key: 'month', label: 'This Month', display: 'This Month' },
];

function getPeriodSince(period: Period): number {
  const now = new Date();
  if (period === 'today') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  }
  if (period === 'week') {
    const dayOfWeek = now.getDay();
    const daysToMonday = (dayOfWeek + 6) % 7;
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToMonday).getTime();
  }
  return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
}

export default function RecapScreen() {
  const { generateRecap, busy } = useAI();
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);
  const [recap, setRecap] = useState<{ result: RecapResult; period: Period } | null>(null);

  const handleSelectPeriod = useCallback(
    async (period: Period) => {
      if (busy) return;
      setSelectedPeriod(period);
      setRecap(null);
      const since = getPeriodSince(period);
      const periodObj = PERIODS.find((p) => p.key === period)!;
      const result = await generateRecap(periodObj.label, since);
      setRecap({ result, period });
    },
    [busy, generateRecap],
  );

  const handleRefresh = useCallback(() => {
    if (selectedPeriod) handleSelectPeriod(selectedPeriod);
  }, [selectedPeriod, handleSelectPeriod]);

  const currentPeriodObj = PERIODS.find((p) => p.key === selectedPeriod);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.titleRow}>
        <Text style={styles.screenTitle}>Recap</Text>
        {recap && !busy && (
          <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh}>
            <Ionicons name="refresh" size={20} color="#4A90D9" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.periodSelector}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p.key}
            style={[
              styles.periodBtn,
              selectedPeriod === p.key && styles.periodBtnActive,
            ]}
            onPress={() => handleSelectPeriod(p.key)}
            disabled={busy}
          >
            <Text
              style={[
                styles.periodBtnText,
                selectedPeriod === p.key && styles.periodBtnTextActive,
              ]}
            >
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          !recap && !busy && styles.scrollContentCentered,
        ]}
      >
        {!selectedPeriod && !busy ? (
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={48} color="#CCC" />
            <Text style={styles.emptyText}>Choose a time period</Text>
            <Text style={styles.emptySubtext}>
              Your AI-powered recap will appear here
            </Text>
          </View>
        ) : busy ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#4A90D9" />
            <Text style={styles.loadingText}>
              Generating recap for {currentPeriodObj?.label ?? 'your notes'}…
            </Text>
          </View>
        ) : recap ? (
          <RecapCard
            result={recap.result}
            periodLabel={PERIODS.find((p) => p.key === recap.period)?.display ?? ''}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
  },
  refreshBtn: {
    padding: 4,
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#EBEBEB',
    alignItems: 'center',
  },
  periodBtnActive: {
    backgroundColor: '#4A90D9',
  },
  periodBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
  },
  periodBtnTextActive: {
    color: '#FFF',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  scrollContentCentered: {
    flex: 1,
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    gap: 8,
    paddingBottom: 40,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#999',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#BBB',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  loading: {
    alignItems: 'center',
    gap: 16,
    paddingTop: 60,
  },
  loadingText: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
  },
});
