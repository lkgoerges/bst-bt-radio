# StromPi 3 Setup

These notes follow the Joy-IT PiEnergy StromPi 3 quick-start for Raspberry Pi OS Lite.

## Hardware

Use the normal serial mode for this project:

- `CAP` -> `ON`
- `Auto` -> `ON`
- `SerialLess` -> `OFF`
- `Flash` -> `OFF`

The vendor quick-start describes this as the normal jumper setup. It also expects UART on `/dev/ttyAMA0` at `38400` baud.

## Install

Run:

```bash
sudo STROMPI_BATTERY_SHUTDOWN_LEVEL=2 STROMPI_SHUTDOWN_TIMER_SECONDS=60 ./scripts/install-strompi3.sh
```

Battery shutdown levels:

- `1`: below 10%
- `2`: below 25%
- `3`: below 50%

The script:

- installs the StromPi dependencies
- enables UART in `/boot/firmware/config.txt`
- disables the serial login shell and enables serial hardware through `raspi-config nonint`
- downloads the vendor `StromPi3_Scriptfolder_2025-07-18`
- installs a small configuration helper
- creates `strompi3-shutdown.service`

Reboot after the first install:

```bash
sudo reboot
```

Then apply the StromPi configuration and start the shutdown monitor:

```bash
sudo STROMPI_BATTERY_SHUTDOWN_LEVEL=2 STROMPI_SHUTDOWN_TIMER_SECONDS=60 /opt/strompi3/configure-strompi3.py
sudo systemctl start strompi3-shutdown.service
```

## Check

```bash
systemctl status strompi3-shutdown.service
journalctl -u strompi3-shutdown.service -n 100 --no-pager
sudo minicom -D /dev/ttyAMA0 -b 38400
```

In `minicom`, type `startstrompiconsole` or `sspc`, press Enter, then use `show-status`.
