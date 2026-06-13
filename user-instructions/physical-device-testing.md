# Testing on a Physical Device

This app uses native modules (`expo-audio`, `expo-speech-recognition`) so it cannot run in Expo Go — it requires a dev build installed directly on the device.

## One-time setup

1. Connect your iPhone via USB
2. On the iPhone: tap "Trust" when prompted to trust the Mac
3. Open Xcode → Settings → Accounts → add your Apple ID (free account works for personal device testing)

## Build and install

```bash
npx expo run:ios --device
```

Expo detects your connected device, builds for arm64, and installs the app. First build takes a few minutes.

## After install

1. On iPhone: Settings → General → VPN & Device Management → tap your Apple ID → "Trust"
2. Open the app — it connects to Metro running on your Mac

## Notes

- Mac and iPhone must be on the same WiFi network (or use `--tunnel` if not)
- With a free Apple Developer account, the certificate expires every 7 days and you'll need to rebuild
- Use this to test BUG-004 (live transcription) — `SFSpeechRecognizer` does not work in the simulator
