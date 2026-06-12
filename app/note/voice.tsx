import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { VoiceRecordButton } from '@/components/VoiceRecordButton';
import { useAI } from '@/hooks/useAI';
import { useNotes } from '@/hooks/useNotes';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';

function formatDuration(seconds: number): string {
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

export default function VoiceNoteScreen() {
  const router = useRouter();
  const { autoRecord } = useLocalSearchParams<{ autoRecord?: string }>();
  const { addNote } = useNotes();
  const { categorizeNote } = useAI();

  const {
    state,
    transcript,
    duration,
    audioUri,
    errorMessage,
    startRecording,
    stopRecording,
    cancelRecording,
    setTranscript,
    reset,
  } = useVoiceRecorder();

  const transcriptScrollRef = useRef<ScrollView>(null);
  const hasAutoStarted = useRef(false);

  // Auto-start when navigated from quick action or new.tsx with autoRecord=true
  useEffect(() => {
    if (autoRecord === 'true' && !hasAutoStarted.current) {
      hasAutoStarted.current = true;
      startRecording();
    }
  }, [autoRecord, startRecording]);

  // Auto-scroll transcript to bottom as it grows
  useEffect(() => {
    if (transcript) {
      transcriptScrollRef.current?.scrollToEnd({ animated: true });
    }
  }, [transcript]);

  const handleCancel = async () => {
    if (state === 'recording' || state === 'stopping') {
      Alert.alert('Discard recording?', 'Your voice note will not be saved.', [
        { text: 'Keep recording', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: async () => {
            await cancelRecording();
            router.back();
          },
        },
      ]);
    } else {
      router.back();
    }
  };

  const handleSave = async () => {
    const trimmed = transcript.trim();
    if (!trimmed) {
      Alert.alert('Empty transcript', 'No speech was captured. Please try recording again.');
      return;
    }
    try {
      const note = await addNote({ rawText: trimmed, source: 'voice', audioUri: audioUri ?? undefined });
      router.back();
      categorizeNote(note.id, note.rawText); // fire-and-forget
    } catch {
      Alert.alert('Error', 'Failed to save note. Please try again.');
    }
  };

  // ─── Error state ─────────────────────────────────────────────────────────────
  if (state === 'error') {
    const isPermissionError = errorMessage?.toLowerCase().includes('permission') ||
      errorMessage?.toLowerCase().includes('access');
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <TouchableOpacity style={styles.closeBtnTopRight} onPress={() => { reset(); router.back(); }}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
        <View style={styles.center}>
          <Ionicons name="alert-circle" size={56} color="#E53935" />
          <Text style={styles.errorText}>{errorMessage ?? 'Something went wrong.'}</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={reset}>
            <Text style={styles.primaryBtnText}>Try Again</Text>
          </TouchableOpacity>
          {isPermissionError && (
            <TouchableOpacity onPress={() => Linking.openSettings()}>
              <Text style={styles.linkText}>Open Settings</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // ─── Done state ───────────────────────────────────────────────────────────────
  if (state === 'done') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <TouchableOpacity style={styles.closeBtnTopRight} onPress={handleCancel}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
        <View style={styles.doneBody}>
          <Text style={styles.doneLabel}>Review & Edit Transcript:</Text>
          <TextInput
            style={styles.transcriptEdit}
            multiline
            value={transcript}
            onChangeText={setTranscript}
            placeholder="No speech captured — type your note here"
            placeholderTextColor="#BBB"
            textAlignVertical="top"
            autoFocus={!transcript}
          />
          <TouchableOpacity style={styles.primaryBtn} onPress={handleSave}>
            <Text style={styles.primaryBtnText}>Save Note</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()} style={styles.discardBtn}>
            <Text style={styles.discardText}>Discard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Idle / Recording / Stopping states ──────────────────────────────────────
  const isRecording = state === 'recording';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header row: Cancel (left) + timer (center) */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.headerSide}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        {isRecording && (
          <Text style={styles.timer}>{formatDuration(duration)}</Text>
        )}
        <View style={styles.headerSide} />
      </View>

      {/* Center: button + labels */}
      <View style={styles.center}>
        <VoiceRecordButton
          recorderState={state}
          onPress={isRecording ? stopRecording : startRecording}
        />
        {isRecording ? (
          <>
            <Text style={styles.recordingLabel}>Recording…</Text>
            <Text style={styles.tapHint}>Tap to Stop</Text>
          </>
        ) : (
          <Text style={styles.tapHint}>Tap to Record</Text>
        )}
      </View>

      {/* Live transcript (only visible while recording) */}
      {isRecording && (
        <ScrollView
          ref={transcriptScrollRef}
          style={styles.transcriptScroll}
          contentContainerStyle={styles.transcriptContent}
        >
          <Text style={styles.transcriptLive}>
            {transcript || 'Listening…'}
          </Text>
        </ScrollView>
      )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerSide: {
    flex: 1,
  },
  cancelText: {
    fontSize: 16,
    color: '#666',
  },
  timer: {
    fontSize: 28,
    fontWeight: '300',
    color: '#111',
    textAlign: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingBottom: 32,
  },
  recordingLabel: {
    fontSize: 15,
    color: '#E53935',
    fontWeight: '500',
  },
  tapHint: {
    fontSize: 14,
    color: '#999',
  },
  transcriptScroll: {
    maxHeight: 160,
    marginHorizontal: 24,
    marginBottom: 32,
  },
  transcriptContent: {
    paddingVertical: 8,
  },
  transcriptLive: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  // Error state
  closeBtnTopRight: {
    padding: 16,
    alignSelf: 'flex-end',
  },
  errorText: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    marginHorizontal: 32,
    lineHeight: 22,
  },
  linkText: {
    fontSize: 15,
    color: '#4A90D9',
    marginTop: 8,
  },
  // Done state
  doneBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 16,
  },
  doneLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  transcriptEdit: {
    flex: 1,
    fontSize: 16,
    color: '#111',
    lineHeight: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
  },
  primaryBtn: {
    backgroundColor: '#4A90D9',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  discardBtn: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  discardText: {
    fontSize: 15,
    color: '#999',
  },
});
