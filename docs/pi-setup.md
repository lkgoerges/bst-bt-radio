# Raspberry Pi Setup

These notes assume Raspberry Pi OS Lite on a Pi 3B.

## 1. Install Runtime Packages

```bash
sudo ./scripts/install-pi-deps.sh
```

Install Node.js 20 or newer. The easiest path on Raspberry Pi OS is usually NodeSource or `nvm`; use whichever you prefer for the Pi image.

## 2. Configure Hostname

Home Pi:

```bash
sudo hostnamectl set-hostname bst-radio-home
```

VfL Pi:

```bash
sudo hostnamectl set-hostname bst-radio-vfl
```

With `avahi-daemon` running, the web apps should be reachable as:

- `http://bst-radio-home.local:3090`
- `http://bst-radio-vfl.local:3090`

## 3. Configure The App

```bash
cp .env.example .env
```

Home Pi:

```bash
BT_RADIO_SITE=home
```

VfL Pi:

```bash
BT_RADIO_SITE=vfl
```

If a Pi has both onboard Bluetooth and a USB Bluetooth stick, set `BT_RADIO_BLUETOOTH_CONTROLLER` to the controller address shown by `bluetoothctl list`.

Start the app once so it writes `data/config.json`:

```bash
npm install
npm run build
npm start
```

Stop it, then edit `data/config.json` and add the Bluetooth MAC addresses for the configured speakers.

## 4. Pair Bose Speakers

Put the Bose SoundTouch into Bluetooth pairing mode, then scan:

```bash
bluetoothctl scan on
```

Pair each speaker:

```bash
./scripts/pair-speaker.sh AA:BB:CC:DD:EE:FF
```

## 5. Install systemd Service

The provided unit assumes the checkout lives at `/opt/bst-bt-radio`.
It runs as the `raspi` user and expects the per-user PipeWire runtime at `/run/user/1000`.

```bash
sudo cp systemd/bst-bt-radio.service /etc/systemd/system/bst-bt-radio.service
sudo systemctl daemon-reload
sudo systemctl enable --now bst-bt-radio.service
```

Check logs:

```bash
journalctl -u bst-bt-radio.service -f
```

## 6. Diagnostics

```bash
./scripts/diagnose-audio.sh
```

Look for a `bluez_output` sink in `wpctl status` after connecting a Bose speaker.
