import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCategories } from '@/hooks/useCategories';
import { useNotes } from '@/hooks/useNotes';
import type { Category, Note } from '@/types';
import { formatNoteDate } from '@/utils/dateHelpers';

export default function NoteDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { notes, removeNote } = useNotes();
  const { findById } = useCategories();

  const [note, setNote] = useState<Note | null>(null);
  const [category, setCategory] = useState<Category | null>(null);

  useEffect(() => {
    const found = notes.find((n) => n.id === Number(id)) ?? null;
    setNote(found);
  }, [notes, id]);

  useEffect(() => {
    if (note?.categoryId) {
      findById(note.categoryId).then(setCategory);
    } else {
      setCategory(null);
    }
  }, [note, findById]);

  const handleDelete = useCallback(() => {
    Alert.alert('Delete Note', 'This note will be permanently deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!note) return;
          await removeNote(note.id);
          router.back();
        },
      },
    ]);
  }, [note, removeNote, router]);

  if (!note) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color="#4A90D9" />
            <Text style={styles.backText}>Notes</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Note not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color="#4A90D9" />
          <Text style={styles.backText}>Notes</Text>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleDelete} style={styles.actionBtn}>
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {category ? (
          <View style={[styles.categoryBadge, { backgroundColor: category.color + '20', borderColor: category.color + '40' }]}>
            <Ionicons name={category.icon as any} size={14} color={category.color} />
            <Text style={[styles.categoryBadgeText, { color: category.color }]}>{category.name}</Text>
          </View>
        ) : null}

        {note.displayTitle ? (
          <Text style={styles.title}>{note.displayTitle}</Text>
        ) : null}

        {note.aiSummary ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Summary</Text>
            <Text style={styles.sectionBody}>{note.aiSummary}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Original Captured Note</Text>
          <Text style={styles.rawText}>{note.rawText}</Text>
        </View>

        {note.aiTags?.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Tags</Text>
            <View style={styles.tags}>
              {note.aiTags.map((tag) => (
                <View key={tag} style={styles.tagChip}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Metadata</Text>
          <View style={styles.metaRow}>
            <Ionicons
              name={note.source === 'voice' ? 'mic' : 'document-text-outline'}
              size={14}
              color="#888"
            />
            <Text style={styles.metaText}>
              {note.source === 'voice' ? 'Voice Memo' : 'Text'}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={14} color="#888" />
            <Text style={styles.metaText}>Created: {formatNoteDate(note.createdAt)}</Text>
          </View>
          {note.isReminder && note.reminderAt ? (
            <View style={styles.metaRow}>
              <Ionicons name="alarm" size={14} color="#D0021B" />
              <Text style={[styles.metaText, { color: '#D0021B' }]}>
                Reminder: {formatNoteDate(note.reminderAt)}
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  backText: {
    fontSize: 16,
    color: '#4A90D9',
    marginLeft: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  deleteText: {
    fontSize: 16,
    color: '#D0021B',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
  },
  categoryBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
    lineHeight: 30,
  },
  section: {
    gap: 6,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionBody: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  rawText: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagChip: {
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 13,
    color: '#555',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: '#888',
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontSize: 16,
    color: '#999',
  },
});
