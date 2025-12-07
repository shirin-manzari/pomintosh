# Pomintosh

A small offline Pomodoro timer for macOS inspired by the 1984 Macintosh. Built with Tauri 2 and vanilla TypeScript, with all controls inside the illustrated screen.

![Pomintosh boot, timer, and settings screens](docs/demo.png)

- Focus: 25 minutes. Break: 5 minutes.
- Start, pause, reset, skip, and custom durations.
- Startup beep, completion chime, and a heart counter for finished focus sessions.
- macOS: tested on 27.0 with Apple Silicon. Older versions and Intel Macs are unverified.

## Requirements

- Node.js 22.12+
- Rust
- [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)

## Run

```sh
npm install
npm run tauri dev
```

Browser demo: `npm run dev`.
