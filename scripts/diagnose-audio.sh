#!/usr/bin/env bash
set -euo pipefail

echo "== pipewire status =="
wpctl status || true

echo
echo "== default sink volume =="
wpctl get-volume @DEFAULT_AUDIO_SINK@ || true

echo
echo "== mpv =="
command -v mpv || true
mpv --version | head -n 3 || true

echo
echo "== raspberry pi audio config hints =="
command -v raspi-config >/dev/null 2>&1 && echo "raspi-config available" || true
aplay -l || true
