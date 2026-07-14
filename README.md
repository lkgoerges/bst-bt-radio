# BST BT Radio

Local Raspberry Pi radio player for Bose SoundTouch speakers after SoundTouch cloud/app support ended.

Each Pi plays internet radio with `mpv`, routes audio through the local 3.5 mm output/PipeWire, and exposes a small local web app for station, startup, and volume control.

## Shape

- One Pi per physical SoundTouch speaker.
- Same app runs on each Pi with a different `BT_RADIO_SITE`.
- Each Pi keeps local config and remembered volume.
- Kitchen, Living Room, and VfL Schildesche can link to each other through the local web UI.
- The web UI is local-network only.

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:3090`.

Development defaults to mock mode so it can run on macOS without PipeWire or `mpv`.

## Raspberry Pi Runtime

Install dependencies:

```bash
sudo ./scripts/install-pi-deps.sh
```

Create or edit `.env`:

```bash
cp .env.example .env
```

Use `BT_RADIO_SITE=kitchen`, `BT_RADIO_SITE=living-room`, or `BT_RADIO_SITE=vfl` for the three Pis.

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
