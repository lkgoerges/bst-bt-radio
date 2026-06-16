#!/usr/bin/env bash
set -euo pipefail

sudo apt-get update
sudo apt-get install -y \
  avahi-daemon \
  bluetooth \
  bluez \
  mpv \
  pipewire \
  pipewire-audio \
  wireplumber

sudo systemctl enable --now bluetooth
sudo systemctl enable --now avahi-daemon

if systemctl list-unit-files | grep -q '^pipewire.service'; then
  systemctl --user enable --now pipewire.service pipewire-pulse.service wireplumber.service || true
fi

echo "Pi audio dependencies installed."
echo "Pair each Bose speaker with: ./scripts/pair-speaker.sh"
