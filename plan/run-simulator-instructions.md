# Running the iOS Simulator

## Prerequisites

- Xcode installed (includes Simulator)
- Expo Go installed in the Simulator (happens automatically on first run)
- Node.js installed

## The problem

Running `npm run ios` uses your machine's LAN IP to connect the Simulator to the Metro bundler. This times out if the Simulator can't reach that IP (firewall, VPN, IP change, etc.). **Always use `--tunnel` instead.**

## Steps

### 1. Start the dev server with tunnel mode

```bash
npm run ios -- --tunnel
```

This starts Metro, opens the iOS Simulator, and creates a public tunnel URL (via ngrok) so the Simulator can always reach the bundler regardless of network configuration.

> **First time only:** Expo will ask you to install `@expo/ngrok`. Press `y` to accept.

### 2. Wait for the app to load

The Simulator will open automatically. Expo Go launches and connects via the tunnel URL. The first bundle takes 30–60 seconds.

### 3. Making changes

Metro watches for file changes and hot-reloads automatically. No need to restart unless you:
- Add a new native dependency
- Change `app.json`
- Hit a red error screen that won't clear

To force a full reload: press `r` in the Metro terminal, or shake the Simulator (Device → Shake) and tap "Reload".

### 4. Stopping

Press `Ctrl+C` in the terminal to stop Metro and close the tunnel.

---

## If the tunnel doesn't work

Try these in order:

1. **Retry tunnel** — press `Ctrl+C`, then re-run `npm run ios -- --tunnel`
2. **Manual localhost** — in a separate terminal run `npm start`, then in the Simulator open Expo Go manually and enter `exp://127.0.0.1:8081`
3. **Check firewall** — System Settings → Network → Firewall → make sure it's not blocking Node/Metro on port 8081
4. **Re-install Expo Go in the Simulator** — in the Metro terminal press `shift+i` to pick a simulator, or delete and reinstall Expo Go

---

## Quick reference

| Action | Command / Key |
|--------|--------------|
| Start with tunnel | `npm run ios -- --tunnel` |
| Reload app | `r` in Metro terminal |
| Open dev menu | Shake Simulator (Device → Shake) |
| Stop server | `Ctrl+C` |
