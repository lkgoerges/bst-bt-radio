# Raspberry Pi Setup

These notes assume Raspberry Pi OS Lite on a Pi 3B.

## 1. Install Runtime Packages

```bash
sudo ./scripts/install-pi-deps.sh
```

Install Node.js 20 or newer. The easiest path on Raspberry Pi OS is usually NodeSource or `nvm`; use whichever you prefer for the Pi image.

## 2. Configure Hostname

Kitchen Pi:

```bash
sudo hostnamectl set-hostname bst-radio-kitchen
```

Living Room Pi:

```bash
sudo hostnamectl set-hostname bst-radio-living
```

VfL Pi:

```bash
sudo hostnamectl set-hostname bst-radio-vfl
```

With `avahi-daemon` running, the web apps should be reachable as:

- `http://bst-radio-kitchen.local:3090`
- `http://bst-radio-living.local:3090`
- `http://bst-radio-vfl.local:3090`

## 3. Configure The App

```bash
cp .env.example .env
```

Kitchen Pi:

```bash
BT_RADIO_SITE=kitchen
```

Living Room Pi:

```bash
BT_RADIO_SITE=living-room
```

VfL Pi:

```bash
BT_RADIO_SITE=vfl
```

Leave `BT_RADIO_AUDIO_SINK` empty unless you need to force a specific PipeWire sink from `wpctl status`.

Start the app once so it writes `data/config.json`:

```bash
npm install
npm run build
npm start
```

Stop it, then edit `data/config.json` only if you want to rename the speaker, change station URLs, or set a per-speaker `audioSink`.

## 4. Select Analog Audio

Connect the Pi headphone jack to the SoundTouch AUX input with a 3.5 mm cable.
Select the Pi's analog output:

```bash
sudo raspi-config
```

Use `System Options` -> `Audio` and select the headphone/3.5 mm output.
You can also inspect PipeWire sinks:

```bash
wpctl status
wpctl set-default <sink-id>
```

## 5. Install systemd Service

The provided unit assumes the checkout lives at `/opt/bst-bt-radio`.
It runs as the `raspi` user and expects the per-user PipeWire runtime at `/run/user/1000`.

```bash
sudo cp systemd/bst-bt-radio.service /etc/systemd/system/bst-bt-radio.service
sudo cp systemd/bst-bt-radio-shutdown.sudoers /etc/sudoers.d/bst-bt-radio-shutdown
sudo chmod 0440 /etc/sudoers.d/bst-bt-radio-shutdown
sudo visudo -cf /etc/sudoers.d/bst-bt-radio-shutdown
sudo systemctl daemon-reload
sudo systemctl enable --now bst-bt-radio.service
```

Check logs:

```bash
journalctl -u bst-bt-radio.service -f
```

## 6. StromPi 3

Install the StromPi shutdown monitor after the HAT is mounted:

```bash
sudo STROMPI_BATTERY_SHUTDOWN_LEVEL=2 STROMPI_SHUTDOWN_TIMER_SECONDS=60 ./scripts/install-strompi3.sh
sudo reboot
```

After the reboot:

```bash
sudo STROMPI_BATTERY_SHUTDOWN_LEVEL=2 STROMPI_SHUTDOWN_TIMER_SECONDS=60 /opt/strompi3/configure-strompi3.py
sudo systemctl start strompi3-shutdown.service
```

See `docs/strompi3.md` for details.

## 7. Diagnostics

```bash
./scripts/diagnose-audio.sh
```

Look for the default audio sink and verify that `mpv` can play a stream through the 3.5 mm output.
