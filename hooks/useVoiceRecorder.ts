import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { useCallback, useEffect, useRef, useState } from 'react';

export type RecorderState = 'idle' | 'recording' | 'stopping' | 'done' | 'error';

export interface VoiceRecorderResult {
  state: RecorderState;
  transcript: string;
  duration: number;
  audioUri: string | null;
  errorMessage: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  cancelRecording: () => Promise<void>;
  setTranscript: (text: string) => void;
  reset: () => void;
}

export function useVoiceRecorder(): VoiceRecorderResult {
  const [state, setState] = useState<RecorderState>('idle');
  const [transcript, setTranscript] = useState('');
  const [duration, setDuration] = useState(0);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  useSpeechRecognitionEvent('result', (event) => {
    const latest = event.results[event.results.length - 1]?.transcript ?? '';
    if (latest) setTranscript(latest);
  });

  useSpeechRecognitionEvent('error', (event) => {
    // Speech recognition errors are non-fatal — audio still records
    console.warn('[useVoiceRecorder] Speech recognition error:', event.message);
  });

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const audioPerms = await AudioModule.requestRecordingPermissionsAsync();
      if (!audioPerms.granted) {
        setState('error');
        setErrorMessage('Microphone access is required to record voice notes.');
        return;
      }

      const speechPerms = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!speechPerms.granted) {
        setState('error');
        setErrorMessage('Speech recognition access is required to transcribe notes. Please enable it in Settings.');
        return;
      }

      setTranscript('');
      setDuration(0);
      setState('recording');

      await recorder.prepareToRecordAsync();
      recorder.record();

      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: true,
        continuous: true,
        addsPunctuation: true,
        iosTaskHint: 'dictation',
        iosVoiceProcessingEnabled: true,
      });

      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } catch (e) {
      clearTimer();
      setState('error');
      setErrorMessage(e instanceof Error ? e.message : 'Failed to start recording. Please try again.');
    }
  }, [recorder, clearTimer]);

  const stopRecording = useCallback(async () => {
    setState('stopping');
    clearTimer();

    try {
      ExpoSpeechRecognitionModule.stop();
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false });
      setAudioUri(recorder.uri ?? null);
      setState('done');
    } catch (e) {
      setState('error');
      setErrorMessage(e instanceof Error ? e.message : 'Failed to stop recording. Please try again.');
    }
  }, [recorder, clearTimer]);

  const cancelRecording = useCallback(async () => {
    clearTimer();
    try {
      ExpoSpeechRecognitionModule.abort();
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false });
    } catch {
      // Best-effort cleanup
    }
    setState('idle');
    setTranscript('');
    setDuration(0);
    setAudioUri(null);
    setErrorMessage(null);
  }, [recorder, clearTimer]);

  const reset = useCallback(() => {
    setState('idle');
    setTranscript('');
    setDuration(0);
    setAudioUri(null);
    setErrorMessage(null);
  }, []);

  useEffect(() => {
    return () => { clearTimer(); };
  }, [clearTimer]);

  return {
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
  };
}
