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
