# Architecture

## Runtime Flow

```text
web app
  -> Express API
  -> RadioController
  -> bluetoothctl / PipeWire / mpv
  -> Bose SoundTouch over Bluetooth
```

Node owns orchestration. Linux owns Bluetooth and audio. `mpv` owns stream playback.

## Two Locations

The same code runs on both Pis with different local config:

- Home: Kitchen and Living Room SoundTouch 10 speakers.
- VfL: VfL Schildesche SoundTouch 20 speaker.

Each Pi is autonomous. A cloud database is intentionally not part of v1, so local playback keeps working without external services.

## Local Persistence

- `data/config.json`: site, speakers, startup mode, station catalog.
- `data/state.json`: selected speaker, last station, remembered volume per speaker.

## Mock Mode

Mock mode is enabled by `BT_RADIO_MOCK=1` or automatically when not running on Linux. It skips `bluetoothctl`, `wpctl`, and `mpv`, which keeps development simple on macOS.
