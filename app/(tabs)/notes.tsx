import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AIStatusBanner } from '@/components/AIStatusBanner';
import { CategoryGroup } from '@/components/CategoryGroup';
import { NoteCard } from '@/components/NoteCard';
import { useCategories } from '@/hooks/useCategories';
import { useNotes } from '@/hooks/useNotes';
import type { Note } from '@/types';

export default function NotesScreen() {
  const router = useRouter();
  const { notes, loading, refresh } = useNotes();
  const { categories } = useCategories();

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const pendingCount = useMemo(
    () => notes.filter((n) => n.aiStatus === 'pending').length,
    [notes]
  );

  useEffect(() => {
    if (pendingCount === 0) return;
    const id = setInterval(refresh, 3000);
    return () => clearInterval(id);
  }, [pendingCount, refresh]);

  const grouped = useMemo(() => {
    const catMap = new Map(categories.map((c) => [c.id, c]));
    const byCategory = new Map<number | null, Note[]>();

    for (const note of notes) {
      const key = note.categoryId ?? null;
      if (!byCategory.has(key)) byCategory.set(key, []);
      byCategory.get(key)!.push(note);
    }

    const result: Array<{ categoryId: number | null; notes: Note[] }> = [];

    for (const cat of categories) {
      const catNotes = byCategory.get(cat.id);
      if (catNotes?.length) {
        result.push({ categoryId: cat.id, notes: catNotes });
      }
    }

    const uncategorized = byCategory.get(null);
    if (uncategorized?.length) {
      result.push({ categoryId: null, notes: uncategorized });
    }

    return { groups: result, catMap };
  }, [notes, categories]);

  const handleNotePress = (note: Note) => {
    router.push(`/note/${note.id}`);
  };

  if (!loading && notes.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.titleRow}>
          <Text style={styles.screenTitle}>Notes</Text>
        </View>
        <View style={styles.empty}>
          <Ionicons name="document-text-outline" size={48} color="#CCC" />
          <Text style={styles.emptyText}>No notes yet</Text>
          <Text style={styles.emptySubtext}>Tap + to capture your first thought</Text>
        </View>
        <TouchableOpacity style={styles.fab} onPress={() => router.push('/note/new')}>
          <Ionicons name="add" size={28} color="#FFF" />
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.titleRow}>
        <Text style={styles.screenTitle}>Notes</Text>
      </View>
      <AIStatusBanner pendingCount={pendingCount} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {grouped.groups.map(({ categoryId, notes: groupNotes }) => {
          const category = categoryId != null ? grouped.catMap.get(categoryId) : null;

          if (!category) {
            return (
              <View key="uncategorized" style={styles.group}>
                <View style={styles.uncategorizedHeader}>
                  <Ionicons name="hourglass-outline" size={16} color="#999" style={{ marginRight: 6 }} />
                  <Text style={styles.uncategorizedName}>Pending</Text>
                  <Text style={styles.count}>({groupNotes.length})</Text>
                </View>
                {groupNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    category={null}
                    onPress={() => handleNotePress(note)}
                  />
                ))}
              </View>
            );
          }

          return (
            <CategoryGroup
              key={category.id}
              category={category}
              notes={groupNotes}
              onNotePress={handleNotePress}
            />
          );
        })}
        <View style={styles.fabSpacer} />
      </ScrollView>
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/note/new')}>
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  titleRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
  group: {
    marginBottom: 8,
  },
  uncategorizedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  uncategorizedName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    marginRight: 4,
  },
  count: {
    fontSize: 13,
    color: '#BBB',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#999',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#BBB',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4A90D9',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  fabSpacer: {
    height: 80,
  },
});
