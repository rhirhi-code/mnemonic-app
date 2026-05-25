import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { Category, Note } from '@/types';
import { formatNoteDate } from '@/utils/dateHelpers';

interface Props {
  note: Note;
  category: Category | null;
  onPress: () => void;
}

export function NoteCard({ note, category, onPress }: Props) {
  if (note.aiStatus === 'pending') {
    return (
      <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
        <Text style={styles.pendingLabel}>Categorizing note…</Text>
        <Text style={styles.rawTextPreview} numberOfLines={2}>{note.rawText}</Text>
        <View style={styles.pendingRow}>
          <ActivityIndicator size="small" color="#AAA" />
        </View>
      </TouchableOpacity>
    );
  }

  if (note.aiStatus === 'error') {
    return (
      <TouchableOpacity style={[styles.card, styles.errorCard]} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.errorBadge}>
          <Text style={styles.errorBadgeText}>Categorization failed</Text>
        </View>
        <Text style={styles.rawTextPreview} numberOfLines={3}>{note.rawText}</Text>
      </TouchableOpacity>
    );
  }

  const accentColor = category?.color ?? '#9B9B9B';

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: accentColor, borderLeftWidth: 3 }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {note.displayTitle ? (
        <Text style={styles.title} numberOfLines={1}>{note.displayTitle}</Text>
      ) : null}
      {note.aiSummary ? (
        <Text style={styles.summary} numberOfLines={2}>{note.aiSummary}</Text>
      ) : (
        <Text style={styles.rawTextPreview} numberOfLines={2}>{note.rawText}</Text>
      )}
      <View style={styles.footer}>
        <View style={styles.tags}>
          {(note.aiTags ?? []).slice(0, 3).map((tag) => (
            <View key={tag} style={styles.tagChip}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
        <View style={styles.badges}>
          {note.isReminder && note.reminderAt ? (
            <View style={styles.reminderBadge}>
              <Ionicons name="alarm" size={12} color="#D0021B" />
              <Text style={styles.reminderText}>{formatNoteDate(note.reminderAt)}</Text>
            </View>
          ) : null}
          {note.source === 'voice' ? (
            <Ionicons name="mic" size={14} color="#888" style={styles.sourceIcon} />
          ) : (
            <Ionicons name="document-text-outline" size={14} color="#CCC" style={styles.sourceIcon} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  errorCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#D0021B',
  },
  pendingLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  rawTextPreview: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  pendingRow: {
    marginTop: 8,
    alignItems: 'flex-start',
  },
  errorBadge: {
    backgroundColor: '#FDECEA',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  errorBadgeText: {
    fontSize: 11,
    color: '#D0021B',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  summary: {
    fontSize: 13,
    color: '#666',
    lineHeight: 19,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    flex: 1,
  },
  tagChip: {
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 11,
    color: '#555',
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reminderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  reminderText: {
    fontSize: 11,
    color: '#D0021B',
  },
  sourceIcon: {
    marginLeft: 2,
  },
});
