# Running the iOS Simulator

## Prerequisites

- Xcode installed (includes Simulator)
- Node.js installed
- Dependencies installed: `npm install`

## The correct command

```bash
mkdir -p ~/plan/logs && npx expo run:ios 2>&1 | tee ~/plan/logs/metro.log
```

This pipes all Metro output (bundler messages, JS errors, console logs) to `~/plan/logs/metro.log`. The `/sim-bugs` skill reads from this file to capture JS-layer errors that don't appear in the iOS system log.

**Do not use `npm run ios` or `npx expo start --ios`.** Those launch Expo Go, which cannot load this app — native modules (`expo-audio`, `expo-speech-recognition`) require a compiled dev build. Using Expo Go will time out with a `xcrun simctl openurl` error.

## First run vs. subsequent runs

**First run** (or after adding a new native package): `npx expo run:ios` compiles the app and installs it on the Simulator. This takes 2–5 minutes.

**Subsequent runs**: the installed dev build is already on the Simulator. You can either:
- Re-run `npx expo run:ios` (recompiles only if native code changed), or
- Open the already-installed app on the Simulator directly — Metro still hot-reloads JS changes automatically.

## Making changes

Metro watches for file changes and hot-reloads automatically. No restart needed unless you:
- Add or remove a native dependency (requires re-running `npx expo run:ios`)
- Change `app.json` plugins or native config
- Hit a red error screen that won't clear

To force a full JS reload: press `r` in the Metro terminal, or shake the Simulator (Device → Shake) and tap "Reload".

## Stopping

Press `Ctrl+C` in the terminal to stop Metro.

---

## Quick reference

| Action | Command / Key |
|--------|--------------|
| Build and launch | `mkdir -p ~/plan/logs && npx expo run:ios 2>&1 \| tee ~/plan/logs/metro.log` |
| Reload JS | `r` in Metro terminal |
| Open dev menu | Shake Simulator (Device → Shake) |
| Stop server | `Ctrl+C` |
