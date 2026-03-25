#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

ensure_codespaces_public_port() {
  local port="$1"

  if [[ -z "${CODESPACE_NAME:-}" ]]; then
    return 0
  fi

  if ! command -v gh >/dev/null 2>&1; then
    return 0
  fi

  if gh codespace ports visibility "${port}:public" -c "$CODESPACE_NAME" >/dev/null 2>&1; then
    echo "[ensure-servers] codespaces port $port set to public"
  else
    echo "[ensure-servers] warning: could not set codespaces port $port visibility"
  fi
}

start_or_skip() {
  local pattern="$1"
  local cmd="$2"
  local name="$3"

  if pgrep -f "$pattern" >/dev/null 2>&1; then
    echo "[ensure-servers] $name already running"
    return 0
  fi

  echo "[ensure-servers] starting $name"
  nohup bash -lc "$cmd" > "/tmp/${name}.log" 2>&1 &
  sleep 1

  if pgrep -f "$pattern" >/dev/null 2>&1; then
    echo "[ensure-servers] $name started"
  else
    echo "[ensure-servers] failed to start $name (see /tmp/${name}.log)"
    return 1
  fi
}

start_or_skip "scripts/api/agora-token-server.js" "cd '$ROOT_DIR' && CORS_ORIGIN='https://*.app.github.dev,*.app.github.dev,app.github.dev' npm run start-agora-token-server" "agora-token-server"
ensure_codespaces_public_port 3010

# Start this one only if you actually use WigTube uploads.
start_or_skip "scripts/api/wigtube-large-upload-server.js" "cd '$ROOT_DIR' && npm run start-large-upload-server" "wigtube-large-upload-server"

echo "[ensure-servers] done"
