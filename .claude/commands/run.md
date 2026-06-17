Launch the mnemonic app on the iOS simulator.

## Command

```bash
mkdir -p ~/plan/logs && npx expo run:ios 2>&1 | tee ~/plan/logs/metro.log
```

This compiles the native binary, starts Metro, and pipes all output to `~/plan/logs/metro.log`. The log file lets the `/sim-bugs` skill capture JS-layer errors (console.error, unhandled rejections, fetch failures) that don't appear in the iOS system log.

## Notes

- First build after a clean checkout takes ~2 minutes (Xcode compile + pod install).
- Subsequent launches are fast (Metro hot-reload only).
- If native dependencies change (new package with native code added), re-run the full command — it will re-run pod install automatically.
- Do NOT use `npm run ios` or `node ios` — `npm run ios` opens Expo Go (incompatible with native modules); `ios/` is a native Xcode project, not a Node module.
