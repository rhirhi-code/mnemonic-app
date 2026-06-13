import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { AskResult } from '@/ai/types';
import { useAI } from '@/hooks/useAI';
import { useNotes } from '@/hooks/useNotes';

type QAPair = { question: string; result: AskResult };

export default function AskScreen() {
  const router = useRouter();
  const { askQuestion, busy } = useAI();
  const { notes } = useNotes();
  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState<QAPair[]>([]);
  const scrollRef = useRef<ScrollView>(null);

  const handleSubmit = async () => {
    const q = question.trim();
    if (!q || busy) return;
    setQuestion('');
    const result = await askQuestion(q);
    setHistory((prev) => [...prev, { question: q, result }]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.titleRow}>
        <Text style={styles.screenTitle}>Ask</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            history.length === 0 && !busy && styles.scrollContentCentered,
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {history.length === 0 && !busy ? (
            <View style={styles.empty}>
              <Ionicons name="chatbubble-ellipses-outline" size={48} color="#CCC" />
              <Text style={styles.emptyText}>Ask anything about your notes</Text>
              <Text style={styles.emptySubtext}>
                Try "What did I want to remember this week?"
              </Text>
            </View>
          ) : (
            <>
              {history.map((pair, i) => (
                <View key={i} style={styles.qaPair}>
                  <View style={styles.questionBubble}>
                    <Text style={styles.questionText}>{pair.question}</Text>
                  </View>
                  <View style={styles.answerBubble}>
                    <Text style={styles.answerText}>{pair.result.answer}</Text>
                    {pair.result.relevantNoteIds.length > 0 && (
                      <View style={styles.noteChips}>
                        {pair.result.relevantNoteIds.map((noteId) => {
                          const note = notes.find((n) => n.id === noteId);
                          const label = note?.displayTitle ?? `Note ${noteId}`;
                          return (
                            <TouchableOpacity
                              key={noteId}
                              style={styles.noteChip}
                              onPress={() => router.push(`/note/${noteId}`)}
                            >
                              <Ionicons
                                name="document-text-outline"
                                size={12}
                                color="#4A90D9"
                              />
                              <Text style={styles.noteChipText} numberOfLines={1}>
                                {label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>
                </View>
              ))}
              {busy && (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color="#4A90D9" />
                  <Text style={styles.loadingText}>Thinking…</Text>
                </View>
              )}
            </>
          )}
        </ScrollView>

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={question}
            onChangeText={setQuestion}
            placeholder="Ask about your notes…"
            placeholderTextColor="#AAA"
            returnKeyType="send"
            onSubmitEditing={handleSubmit}
            editable={!busy}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!question.trim() || busy) && styles.sendBtnDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!question.trim() || busy}
          >
            <Ionicons name="send" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  flex: {
    flex: 1,
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
    padding: 16,
    gap: 16,
    paddingBottom: 8,
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
  qaPair: {
    gap: 8,
  },
  questionBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#4A90D9',
    borderRadius: 16,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '80%',
  },
  questionText: {
    fontSize: 15,
    color: '#FFF',
    lineHeight: 21,
  },
  answerBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
    gap: 10,
  },
  answerText: {
    fontSize: 15,
    color: '#222',
    lineHeight: 22,
  },
  noteChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  noteChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EAF2FC',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: 200,
  },
  noteChipText: {
    fontSize: 12,
    color: '#4A90D9',
    fontWeight: '500',
    flexShrink: 1,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  loadingText: {
    fontSize: 14,
    color: '#888',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E0E0E0',
  },
  input: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    color: '#111',
    maxHeight: 120,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4A90D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#C0D8F0',
  },
});
