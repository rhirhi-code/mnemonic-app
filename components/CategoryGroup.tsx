import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { Category, Note } from '@/types';
import { NoteCard } from './NoteCard';

interface Props {
  category: Category;
  notes: Note[];
  initiallyExpanded?: boolean;
  onNotePress: (note: Note) => void;
}

export function CategoryGroup({ category, notes, initiallyExpanded = true, onNotePress }: Props) {
  const [expanded, setExpanded] = useState(initiallyExpanded);

  return (
    <View style={styles.group}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded((e) => !e)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Ionicons
            name={category.icon as any}
            size={16}
            color={category.color}
            style={styles.icon}
          />
          <Text style={[styles.categoryName, { color: category.color }]}>
            {category.name}
          </Text>
          <Text style={styles.count}>({notes.length})</Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color="#999"
        />
      </TouchableOpacity>

      {expanded && notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          category={category}
          onPress={() => onNotePress(note)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 6,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  count: {
    fontSize: 13,
    color: '#999',
  },
});
