import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAI } from '@/hooks/useAI';
import { useNotes } from '@/hooks/useNotes';

export default function NewNoteScreen() {
  const router = useRouter();
  const { addNote } = useNotes();
  const { categorizeNote } = useAI();
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleSave = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      Alert.alert('Empty note', 'Please write something before saving.');
      return;
    }
    setSaving(true);
    try {
      const note = await addNote({ rawText: trimmed, source: 'text' });
      router.back();
      categorizeNote(note.id, note.rawText); // fire-and-forget; Notes screen polls for the result
    } catch {
      Alert.alert('Error', 'Failed to save note. Please try again.');
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSave}
          style={styles.headerBtn}
          disabled={saving}
        >
          <Text style={[styles.saveText, saving && styles.disabled]}>Save</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TextInput
          ref={inputRef}
          style={styles.input}
          multiline
          autoFocus
          placeholder="Start typing or logging your thoughts here…"
          placeholderTextColor="#BBB"
          value={text}
          onChangeText={setText}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={styles.micButton}
          onPress={() => router.push('/note/voice')}
        >
          <Ionicons name="mic" size={28} color="#4A90D9" />
          <Text style={styles.micLabel}>Tap to Record</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  headerBtn: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  cancelText: {
    fontSize: 16,
    color: '#666',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A90D9',
  },
  disabled: {
    opacity: 0.4,
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  input: {
    flex: 1,
    fontSize: 17,
    color: '#111',
    lineHeight: 26,
  },
  micButton: {
    alignItems: 'center',
    paddingBottom: 24,
    gap: 6,
  },
  micLabel: {
    fontSize: 13,
    color: '#999',
  },
});
