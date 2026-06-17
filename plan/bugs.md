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

**Status:** RESOLVED — fixed in PR #14
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

## BUG-007 — Simulator times out opening exp:// URL; app launched via Expo Go instead of dev build

**Status:** RESOLVED — use `npx expo run:ios`, not `npm run ios`; see `plan/user-instructions/run-simulator-instructions.md`
**Phase:** 6 (Recap Tab)

**Error:**
```
Error: xcrun simctl openurl FFD4724B-E693-47FF-837B-353CA35DDC3B exp://192.168.0.162:8081 exited with non-zero code: 60
An error was encountered processing the command (domain=NSPOSIXErrorDomain, code=60):
Simulator device failed to open exp://192.168.0.162:8081.
Operation timed out
```

**What happened:** Opening the app in the simulator fails with a timeout on the `exp://` Expo Go URL. The stack trace shows `openProjectInExpoGoAsync`, meaning the launch command tried to open the app in Expo Go rather than the compiled dev build.

**Likely cause:** The app was started with `npm run ios` or `npx expo start --ios`, both of which route through Expo Go. Since Phase 4 added native modules (`expo-audio`, `expo-speech-recognition`), the app can no longer run in Expo Go and must be launched with `npx expo run:ios`, which compiles and installs the dev build directly.

**Fix:** Use `npx expo run:ios` (or the `/run` skill) instead of `npm run ios`.

## BUG-008 — @anthropic-ai/sdk not found at bundle time; installed in worktree node_modules only

**Status:** RESOLVED — fixed in PR #20; switched to raw `fetch`, removed SDK entirely
**Phase:** 7 (Real AI Integration)

**Error:**
```
Unable to resolve "@anthropic-ai/sdk" from "ai/providers/claude.ts"
> 1 | import Anthropic from '@anthropic-ai/sdk';
iOS Bundling failed 1075ms node_modules/expo-router/entry.js (2127 modules)
```

**What happened:** After implementing `ai/providers/claude.ts` with the `@anthropic-ai/sdk` import, Metro fails to bundle with "Unable to resolve" at runtime. The SDK was installed via `npm install` inside the git worktree, so it landed in the worktree's own `node_modules`. Metro resolves modules from the main project root, which doesn't have the SDK.

**Likely cause:** `npm install @anthropic-ai/sdk` was run inside the git worktree directory, not the main project root. The main project's `node_modules` (and `package.json`) don't include the new dependency until the PR is merged and `npm install` is re-run from the project root.

## BUG-009 — @anthropic-ai/sdk imports node:fs via credential chain; crashes in React Native

**Status:** RESOLVED — fixed in PR #20; switched to raw `fetch`, removed SDK entirely
**Phase:** 7 (Real AI Integration)

**Error:**
```
The package at "node_modules/@anthropic-ai/sdk/lib/credentials/credential-chain.mjs"
attempted to import the Node standard library module "node:fs".
It failed because the native React runtime does not include the Node standard library.

Unable to resolve module node:fs from
/Users/rhiannon/code/mnemonic/node_modules/@anthropic-ai/sdk/lib/credentials/credential-chain.mjs
```

**What happened:** After resolving BUG-008 and installing the SDK in the main project, the app crashes at bundle time because `@anthropic-ai/sdk` unconditionally imports `node:fs` through its credential chain (`client.mjs` → `credential-chain.mjs`). React Native has no Node standard library, so the import fails hard.

**Likely cause:** The `@anthropic-ai/sdk` does not ship a React Native–compatible build. Its main entry (`index.mjs`) pulls in a credential discovery chain designed for server/Node environments. There is no `browser` or `react-native` export condition to exclude this path. Fix: remove the SDK and call the Anthropic REST API directly via `fetch`, which is available in React Native.

## BUG-005 — ExpoSpeechRecognition native module not found; voice screen crashes on launch

**Status:** RESOLVED — fixed in PR #13
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

---

## Simulator Session — 2026-06-16 20:29 | PR #20: Fix BUG-009: switch claude provider to raw fetch, remove @anthropic-ai/sdk

**Simulator:** iPhone 17 Pro (FFD4724B)
**Log window:** last 15 minutes (app session PID 87792, launched 20:18:53)
**Metro log:** not found
**PR:** #20 — MERGED
**Files changed in PR:** ai/providers/claude.ts, package.json, package-lock.json, plan/bugs.md
**Bugs found:** 3 (1 Critical, 1 High, 1 Medium)

> **Note on log source:** React Native / Expo JS errors (console.error, unhandled rejections, fetch errors) are routed through the Metro bundler and do **not** appear in the iOS system log. The system log captures native-layer errors only. Check the Metro terminal for JS-level stack traces when debugging API or JS errors.

---

## BUG-010 — `thinking: { type: 'adaptive' }` is an invalid API parameter; categorization silently returns nothing

**Status:** PRODUCT REVIEW — fixed in this PR; removed invalid `thinking` field from `callClaude`
**Phase:** 5 (AI Integration)
**PR-related:** YES — introduced in PR #20 (`ai/providers/claude.ts`)
**Severity:** Critical

**What happened:** User added a note; received no real categorization. No outbound connection to `api.anthropic.com` was observed in the iOS simulator network logs during the session, indicating either the request failed before sending or was silently discarded.

**Error (expected in Metro terminal):**
```
ERROR  Anthropic API 400: {"type":"error","error":{"type":"invalid_request_error","message":"thinking.type must be one of enabled, disabled"}}
```

**Root cause:** `ai/providers/claude.ts` sent:
```ts
thinking: { type: 'adaptive' },
```
The Anthropic API only accepts `"enabled"` (with a required `budget_tokens` field) or `"disabled"` for the `thinking` parameter. `"adaptive"` is not a valid value and causes a 400 response.

**Fix:** Removed the `thinking` field entirely from the request body.

---

## BUG-011 — Categorization failure is silent; user gets no error feedback

**Status:** PRODUCT REVIEW — fixed in this PR; `AIStatusBanner` now shows error count for `aiStatus === 'error'` notes
**Phase:** 5 (AI Integration)
**PR-related:** PRE-EXISTING (call site predates PR #20)
**Severity:** High

**What happened:** When the Anthropic API call throws (e.g., due to BUG-010), the note is saved with `aiStatus: 'error'` but the user sees no message — the note sits in the "Pending" group indefinitely with no indication that categorization failed.

**Fix:** `AIStatusBanner` now accepts an `errorCount` prop and renders a red error message ("N notes failed to categorize") alongside the pending spinner when error notes exist. `notes.tsx` counts notes with `aiStatus === 'error'` and passes the count to the banner.

---

## BUG-012 — Info.plist missing `fetch` and `remote-notification` background modes

**Status:** OPEN
**Phase:** 0 (Bootstrap / Config)
**PR-related:** PRE-EXISTING
**Severity:** Medium

**System log warnings (20:18:54, PID 87792):**
```
mnemonic: (UIKitCore) You've implemented -[<UIApplicationDelegate> application:performFetchWithCompletionHandler:],
but you still need to add "fetch" to the list of your supported UIBackgroundModes in your Info.plist.

mnemonic: (UIKitCore) You've implemented -[<UIApplicationDelegate> application:didReceiveRemoteNotification:fetchCompletionHandler:],
but you still need to add "remote-notification" to the list of your supported UIBackgroundModes in your Info.plist.
```

**Likely cause:** The Expo-generated `Info.plist` does not declare the background modes that the app's delegate implements. This will become a hard assert in a future iOS version.

**Suggested fix:** In `app.json`, add:
```json
"ios": {
  "infoPlist": {
    "UIBackgroundModes": ["fetch", "remote-notification"]
  }
}
```
Then rebuild (`expo run:ios`) to regenerate the native project.

---

_Captured by /sim-bugs — ~25,000 raw system log lines + no Metro log ingested, 3 bugs identified_

---

## Simulator Session — 2026-06-16 | PR #22: Fix BUG-010/011; mark BUG-008/009 RESOLVED

**Simulator:** iPhone 17 Pro (FFD4724B)  
**Log window:** last 10 minutes  
**Metro log:** found — 43 lines ingested  
**PR:** #22 — MERGED  
**Files changed in PR:** ai/providers/claude.ts, app/(tabs)/notes.tsx, components/AIStatusBanner.tsx, plan/bugs.md  
**Bugs found:** 2 (0 Critical, 0 High, 2 Medium)

> **Note:** System log captured 0 lines for this window (app was idle or recently booted). All signal came from the Metro log (app runtime output piped through Metro's log stream).

### Critical

_None._

### High

_None._

### Medium / Warnings

#### [PRE-EXISTING?] Native warning: `hapticpatternlibrary.plist` missing in simulator

- **Frequency:** ~30× (15 `[CoreHaptics]` + 15 `[UIKitCore]` pairs) during the session
- **Source:** [METRO] — app runtime log
- **Message:** `[CoreHaptics] +[CHHapticPattern patternForKey:error:]: Failed to read pattern library data: Error Domain=NSCocoaErrorDomain Code=260 "The file "hapticpatternlibrary.plist" couldn't be opened because there is no such file."`
- **Likely cause:** The iOS Simulator does not ship haptic pattern library files. `UIKBFeedbackGenerator` (keyboard haptics) fires every time the on-screen keyboard appears. This is a simulator-environment limitation, not an app bug — fires on every key tap.
- **Suggested fix:** No action needed; this is a known simulator-only artifact. The warning will not appear on a physical device.

#### [PRE-EXISTING?] Native warning: TextInputUI accumulator updated after completion

- **Frequency:** 4× during the session
- **Source:** [METRO] — app runtime log
- **Message:** `[TextInputUI] Attempted to update accumulator from source type: 0, after completion has already been called for token:[...]`
- **Likely cause:** A UIKit-internal race condition in keyboard text prediction/autocomplete; the accumulator token receives an update after it has already been finalized. Likely triggered by fast typing or auto-correct interactions.
- **Suggested fix:** No action needed; this is a UIKit internal warning with no user-facing impact and no relation to app code.

---

_Captured by /sim-bugs — 0 raw system log lines + 43 Metro log lines ingested, ~34 matched filters_
