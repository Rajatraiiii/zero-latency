# ⚡ Zero Latency — Real-Time Mobile AI Debugging Co-Pilot

A hackathon prototype demonstrating how a developer's laptop and phone can work together to debug software errors in real time.

**Flow:** Desktop Error → Real-Time Mobile Alert → AI Analysis → Suggested Fix → One-Tap Patch Applied

## Demo

The desktop screen is a hard-coded demo by default. It runs in the browser with no backend or API keys, and it runs as an Electron desktop app when the bridge is available. Browser patching is simulated; Electron patching writes the selected replacement to the target file.

### Run it
1. Install dependencies with `npm install`.
2. Start the browser demo with `npm run dev` or build it with `npm run build`.
3. Use **Simulate incoming alert** to add a demo alert.
4. Use **Apply patch** to complete the simulated browser flow.

The optional mobile companion is available at `/mobile.html`. It connects to the Electron WebSocket bridge and can send real alert payloads when the desktop app is running.

### Deploy to Vercel

Import this repository into Vercel. The project is configured to run `npm run build` and publish `dist/`. After deployment, the browser demo is available at `/` and the mobile companion at `/mobile.html`.

The hosted browser demo uses simulated patching. Real WebSocket pairing and filesystem patching require the Electron desktop app running locally.

## Stack

React, Vite, Electron, WebSocket, and `lucide-react`.
