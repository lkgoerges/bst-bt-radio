# BST BT Radio

Local Raspberry Pi radio bridge for Bose SoundTouch speakers after SoundTouch cloud/app support ended.

The Pi connects to a selected Bose SoundTouch over Bluetooth, plays internet radio with `mpv`, routes audio through PipeWire, and exposes a small local web app for station, speaker, startup, and volume control.

## Shape

- One speaker at a time for v1.
- Same app runs on both Pis.
- Each Pi keeps local config and remembered speaker volume.
- Home Pi controls Kitchen and Living Room.
- VfL Pi controls VfL Schildesche.
- The web UI is local-network only.

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:3090`.

Development defaults to mock mode so it can run on macOS without Bluetooth, PipeWire, or `mpv`.

## Raspberry Pi Runtime

Install dependencies:

```bash
sudo ./scripts/install-pi-deps.sh
```

Create or edit `.env`:

```bash
cp .env.example .env
```

Use `BT_RADIO_SITE=home` for the Home Pi and `BT_RADIO_SITE=vfl` for the VfL Pi.

Build and run:

```bash
npm install
npm run build
npm start
```

## Stations

The bundled catalog starts with Radio Bielefeld, 1LIVE, and a small TuneIn-style public radio collection. Stream URLs are regular internet radio URLs and can be edited later in `data/config.json` or through future UI settings.

## Systemd

Example units live in `systemd/`. They assume the repo is checked out at `/opt/bst-bt-radio` and Node is available at `/usr/bin/node`.
