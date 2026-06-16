#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" == "" ]]; then
  echo "Usage: $0 AA:BB:CC:DD:EE:FF"
  exit 1
fi

mac="$1"

bluetoothctl power on
bluetoothctl agent on
bluetoothctl default-agent
bluetoothctl pair "$mac"
bluetoothctl trust "$mac"
bluetoothctl connect "$mac"

echo "Paired, trusted, and connected $mac."
echo "Add this MAC address to data/config.json for the matching speaker."
