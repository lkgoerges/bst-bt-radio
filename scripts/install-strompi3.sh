#!/usr/bin/env bash
set -euo pipefail

SCRIPT_URL="https://www.pienergy.joy-it.net/files/files/downloads/scripte/StromPi3_Scriptfolder_2025-07-18.zip"
INSTALL_DIR="/opt/strompi3"
BATTERY_SHUTDOWN_LEVEL="${STROMPI_BATTERY_SHUTDOWN_LEVEL:-2}"
SHUTDOWN_TIMER_SECONDS="${STROMPI_SHUTDOWN_TIMER_SECONDS:-60}"

if [[ "$BATTERY_SHUTDOWN_LEVEL" != "1" && "$BATTERY_SHUTDOWN_LEVEL" != "2" && "$BATTERY_SHUTDOWN_LEVEL" != "3" ]]; then
  echo "STROMPI_BATTERY_SHUTDOWN_LEVEL must be 1 (10%), 2 (25%), or 3 (50%)." >&2
  exit 1
fi

sudo apt-get update
sudo apt-get install -y \
  minicom \
  python3-pil \
  python3-pil.imagetk \
  python3-pip \
  python3-serial \
  stm32flash \
  unzip \
  wget

CONFIG_FILE="/boot/firmware/config.txt"
if [[ ! -f "$CONFIG_FILE" ]]; then
  CONFIG_FILE="/boot/config.txt"
fi

if grep -q '^enable_uart=' "$CONFIG_FILE"; then
  sudo sed -i 's/^enable_uart=.*/enable_uart=1/' "$CONFIG_FILE"
else
  echo "enable_uart=1" | sudo tee -a "$CONFIG_FILE" >/dev/null
fi

if ! grep -q '^dtoverlay=miniuart-bt$' "$CONFIG_FILE"; then
  echo "dtoverlay=miniuart-bt" | sudo tee -a "$CONFIG_FILE" >/dev/null
fi

tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

wget -qO "$tmp_dir/strompi3.zip" "$SCRIPT_URL"
unzip -q "$tmp_dir/strompi3.zip" -d "$tmp_dir"

sudo mkdir -p "$INSTALL_DIR"
sudo rm -rf "$INSTALL_DIR"/StromPi3_Scriptfolder_2025-07-18
sudo cp -R "$tmp_dir"/StromPi3_Scriptfolder_2025-07-18 "$INSTALL_DIR"/

sudo tee "$INSTALL_DIR/configure-strompi3.py" >/dev/null <<'PY'
#!/usr/bin/env python3
import os
import serial
import sys
import time

level = os.environ.get("STROMPI_BATTERY_SHUTDOWN_LEVEL", "2")
shutdown_seconds = os.environ.get("STROMPI_SHUTDOWN_TIMER_SECONDS", "60")

if level not in {"1", "2", "3"}:
    raise SystemExit("STROMPI_BATTERY_SHUTDOWN_LEVEL must be 1 (10%), 2 (25%), or 3 (50%).")

ser = serial.Serial(
    port="/dev/ttyAMA0",
    baudrate=38400,
    parity=serial.PARITY_NONE,
    stopbits=serial.STOPBITS_ONE,
    bytesize=serial.EIGHTBITS,
    timeout=1,
)

def send(command: str) -> None:
    ser.write(command.encode("utf-8"))
    time.sleep(0.1)
    ser.write(b"\r")
    time.sleep(0.3)
    response = ser.read(4096).decode("utf-8", errors="replace").strip()
    if response:
        print(response)

try:
    send("quit")
    send("set-config 14 1")
    send(f"set-config 15 {shutdown_seconds}")
    send("set-config 16 0")
    send("set-config 17 0")
    send(f"set-config 18 {level}")
    send("status-rpi")
finally:
    ser.close()

print("Configured StromPi3 shutdown: Raspberry Pi shutdown enabled, timer=%ss, battery level=%s." % (shutdown_seconds, level))
PY
sudo chmod +x "$INSTALL_DIR/configure-strompi3.py"

sudo tee /etc/systemd/system/strompi3-shutdown.service >/dev/null <<'UNIT'
[Unit]
Description=StromPi3 serial shutdown monitor
After=multi-user.target

[Service]
Type=simple
ExecStart=/usr/bin/python3 /opt/strompi3/StromPi3_Scriptfolder_2025-07-18/Serial/serialShutdown.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT

sudo systemctl daemon-reload
sudo systemctl enable strompi3-shutdown.service

echo
echo "StromPi3 files installed."
echo "A reboot is required before /dev/ttyAMA0 is ready for StromPi communication."
echo "After reboot, run:"
echo "  sudo STROMPI_BATTERY_SHUTDOWN_LEVEL=$BATTERY_SHUTDOWN_LEVEL STROMPI_SHUTDOWN_TIMER_SECONDS=$SHUTDOWN_TIMER_SECONDS $INSTALL_DIR/configure-strompi3.py"
echo "  sudo systemctl start strompi3-shutdown.service"
