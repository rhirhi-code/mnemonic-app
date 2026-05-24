# Bugs

## BUG-001 — iOS Simulator times out opening Expo Go URL

**Status:** Resolved — see `plan/run-simulator-instructions.md`  
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

**Note for next session:** `--tunnel` is the fastest fix — start with that before trying anything else.

**Workaround to try:**
1. In the Expo CLI terminal, press `i` to retry opening in the simulator
2. If that fails, open Expo Go manually in the simulator, then scan/enter the URL `exp://127.0.0.1:8081` (localhost instead of LAN IP)
3. In the Expo CLI terminal, press `?` and look for a tunnel option — run with `npm run ios -- --tunnel` to use a public tunnel instead of LAN
4. Check macOS firewall: System Settings → Network → Firewall → ensure it's not blocking incoming connections on port 8081
