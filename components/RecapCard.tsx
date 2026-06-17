import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import type { RecapResult } from '@/ai/types';

interface RecapCardProps {
  result: RecapResult;
  periodLabel: string;
}

export function RecapCard({ result, periodLabel }: RecapCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="sparkles" size={16} color="#4A90D9" />
        <Text style={styles.periodLabel}>{periodLabel}</Text>
      </View>

      <Text style={styles.summary}>{result.summary}</Text>

      {result.highlights.length > 0 && (
        <>
          <View style={styles.divider} />
          <Text style={styles.highlightsHeading}>Highlights</Text>
          {result.highlights.map((h, i) => (
            <View key={i} style={styles.highlightRow}>
              <View style={styles.bullet} />
              <Text style={styles.highlightText}>{h}</Text>
            </View>
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  periodLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A90D9',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summary: {
    fontSize: 15,
    color: '#222',
    lineHeight: 23,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E8E8E8',
    marginVertical: 2,
  },
  highlightsHeading: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4A90D9',
    marginTop: 8,
    flexShrink: 0,
  },
  highlightText: {
    flex: 1,
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
  },
});
