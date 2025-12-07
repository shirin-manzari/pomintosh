# Pomintosh

A tiny Pomodoro desktop widget for macOS, inspired by the 1984 Macintosh. Drag the mini Mac anywhere on your desktop and use its screen to focus, take a break, or adjust your timer. Runs offline as a standalone app.

![Pomintosh boot, timer, and settings screens](docs/demo.png)

- Focus: 25 minutes + Break: 5 minutes.
- Start, pause, reset, skip, and custom durations.
- Startup beep, completion chime, and a heart counter for finished focus sessions.

## Requirements

- Node.js 22.12+
- Rust
- [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)

## Run

```sh
npm install
npm run tauri dev
```

Browser demo: `npm run dev`

## Install

Download [Pomintosh for Mac](https://github.com/shirin-manzari/pomintosh/releases/download/v0.1.0/Pomintosh-0.1.0.dmg). Open the DMG and drag Pomintosh into Applications. macOS may require **System Settings → Privacy & Security → Open Anyway** on first launch.

Build from source: `npm run tauri -- build`

## License

[MIT](LICENSE). The bundled VT323 font uses the [SIL Open Font License](src/assets/fonts/OFL.txt).
