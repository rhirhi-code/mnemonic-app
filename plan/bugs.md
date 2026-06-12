# Bugs

## BUG-001 — iOS Simulator times out opening Expo Go URL

**Status:** RESOLVED — see `plan/run-simulator-instructions.md`
**Phase:** 0 (Bootstrap)

**Error:**
```
Error: xcrun simctl openurl <device-id> exp://192.168.0.144:8081 exited with non-zero code: 60
An error was encountered processing the command (domain=NSPOSIXErrorDomain, code=60):
Simulator device failed to open exp://192.168.0.144:8081.
Operation timed out
```

**What happened:** Running `npm run ios` starts the Metro bundler and launches the simulator, but the simulator times out trying to open the `exp://` URL in Expo Go.

**Likely cause:** The simulator can't reach the Metro bundler at `192.168.0.144:8081`. This is a network reachability issue — the simulator is trying to connect to the dev machine's LAN IP but the connection times out. Common triggers:
- macOS firewall blocking port 8081
- The LAN IP changed or is unreachable from the simulator's network context

**Fix:** Run with `--tunnel` flag: `npm run ios -- --tunnel`

## BUG-002 — RecordingDisabledException when starting voice recording

**Status:** RESOLVED
**Phase:** 4 (Voice Recording)

**Error:**
```
FunctionCallException: Calling the 'record' function has failed
→ Caused by: RecordingDisabledException: Recording not allowed on iOS.
  Enable with Audio.setAudioModeAsync (at ExpoAudio/AudioRecorder.swift:123)
```

**What happened:** Tapping the mic button to start recording throws a `RecordingDisabledException`. The app transitions to the error state and shows "Try Again".

**Likely cause:** `expo-audio` requires `setAudioModeAsync({ allowsRecording: true })` to be called before `recorder.record()`. Currently `setAudioModeAsync` is only called on stop (to release the audio session), never on start to enable it.

## BUG-003 — Impossible audio mode: playsInSilentMode == false with allowsRecording == true

**Status:** RESOLVED
**Phase:** 4 (Voice Recording)

**Error:**
```
Calling the 'setAudioModeAsync' function has failed
→ Caused by: Impossible audio mode: playsInSilentMode == false and allowsRecording == true cannot be set on iOS
```

**What happened:** After BUG-002 was fixed, tapping the mic button still fails. The `setAudioModeAsync({ allowsRecording: true })` call throws because iOS forbids `allowsRecording: true` unless `playsInSilentMode` is also `true`.

**Likely cause:** iOS audio session constraint — `allowsRecording: true` requires `playsInSilentMode: true` to be set at the same time. The fix is `setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true })` on start.

## BUG-004 — Speech recognizer fails to initialize, no transcript captured

**Status:** BACKLOG
**Phase:** 4 (Voice Recording)

**Error:**
```
[useVoiceRecorder] Speech recognition error: Failed to initialize recognizer.
```

**What happened:** Recording starts successfully (timer counts, audio captured) but no transcript appears and the done state shows an empty transcript. The `expo-speech-recognition` error event fires with "Failed to initialize recognizer." — `SFSpeechRecognizer` never starts.

**Likely cause:** The iOS simulator does not support `SFSpeechRecognizer` with network-based recognition. Possible fixes: (1) test on a physical device instead of the simulator, (2) pass `requiresOnDeviceRecognition: true` to `ExpoSpeechRecognitionModule.start()` which uses the on-device model available since iOS 16, or (3) both.
