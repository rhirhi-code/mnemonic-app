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

**Status:** RESOLVED — fixed in PR #9
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

**Status:** RESOLVED — fixed in PR #10
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

**Plan:** Test on a physical device before attempting a code fix. On-device testing will confirm whether this is a simulator-only limitation or a real bug.

## BUG-006 — `/run` skill executes `node ios` instead of `expo run:ios`, crashing on launch

**Status:** PRODUCT REVIEW
**Phase:** 4 (Voice Recording)

**Error:**
```
Found & ignored ./node_modules ; is listed in .gitignore
Found & ignored ./expo-env.d.ts ; is listed in .gitignore

Starting: ios
Error: Cannot find module '/Users/rhiannon/code/mnemonic/ios'
    at Module.executeUserEntryPoint [as runMain] (node:internal/main/run_main_module:33:47)
Node.js v26.0.0
```

**What happened:** Using the `/run` skill (or `/verify`) to test the app causes a hard crash. The skill scans the project, detects the `ios/` directory, and incorrectly tries to run it as a Node module (`node ios`) instead of using Expo's build command.

**Likely cause:** The `/run` skill has no project-specific run command to reference, so it falls back to a built-in heuristic that mistakes the native `ios/` directory for a Node entrypoint. Fix: add a `.claude/commands/run.md` project skill that tells the system the correct command (`npm run ios`).

## BUG-005 — ExpoSpeechRecognition native module not found; voice screen crashes on launch

**Status:** PRODUCT REVIEW
**Phase:** 4 (Voice Recording)

**Error:**
```
ERROR  [Error: Cannot find native module 'ExpoSpeechRecognition']
WARN   Route "./note/voice.tsx" is missing the required default export.

Uncaught Error: Cannot find native module 'ExpoSpeechRecognition'
  at <global> (hooks/useVoiceRecorder.ts:7)
  at <global> (app/note/voice.tsx:19)
```

**What happened:** Launching the app with `expo run:ios` crashes immediately with "Cannot find native module 'ExpoSpeechRecognition'". The error originates at the `expo-speech-recognition` import in `useVoiceRecorder.ts`, which is imported at the top of `app/note/voice.tsx`. A separate warning also fires that `voice.tsx` is missing its default export (the screen is a placeholder stub).

**Likely cause:** Two issues: (1) The `expo-speech-recognition` native module is not linked in the current iOS build — likely because CocoaPods were not re-installed after the package was added. Running a clean `expo run:ios` (which re-runs pod install) should fix this. (2) `app/note/voice.tsx` exports no default React component, which violates Expo Router's file-based routing requirement.
