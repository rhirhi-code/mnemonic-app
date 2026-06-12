import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, StyleSheet, TouchableOpacity, View } from 'react-native';

import type { RecorderState } from '@/hooks/useVoiceRecorder';

const BUTTON_SIZE = 96;

interface Props {
  recorderState: RecorderState;
  onPress: () => void;
}

export function VoiceRecordButton({ recorderState, onPress }: Props) {
  const pulse = useRef(new Animated.Value(0)).current;
  const isRecording = recorderState === 'recording';
  const isStopping = recorderState === 'stopping';

  useEffect(() => {
    if (!isRecording) {
      pulse.setValue(0);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [isRecording, pulse]);

  const buttonColor = isRecording || isStopping ? '#E53935' : '#4A90D9';

  return (
    <View style={styles.wrapper}>
      {isRecording && (
        <Animated.View
          style={[
            styles.pulseRing,
            {
              transform: [
                {
                  scale: pulse.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.65],
                  }),
                },
              ],
              opacity: pulse.interpolate({
                inputRange: [0, 0.3, 1],
                outputRange: [0.5, 0.5, 0],
              }),
            },
          ]}
        />
      )}
      <TouchableOpacity
        onPress={onPress}
        disabled={isStopping}
        activeOpacity={0.8}
        style={[styles.button, { backgroundColor: buttonColor }]}
      >
        {isStopping ? (
          <ActivityIndicator color="#FFF" size="small" />
        ) : (
          <Ionicons name="mic" size={40} color="#FFF" />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: '#E53935',
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
});
