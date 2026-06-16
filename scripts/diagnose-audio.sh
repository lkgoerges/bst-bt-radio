#!/usr/bin/env bash
set -euo pipefail

echo "== bluetooth devices =="
bluetoothctl devices || true

echo
echo "== bluetooth paired devices =="
bluetoothctl paired-devices || true

echo
echo "== pipewire status =="
wpctl status || true

echo
echo "== default sink volume =="
wpctl get-volume @DEFAULT_AUDIO_SINK@ || true

echo
echo "== mpv =="
command -v mpv || true
mpv --version | head -n 3 || true
