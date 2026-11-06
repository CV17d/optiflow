#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
echo "========================================================"
echo "  OptiFlow - Compilación Backend Python (macOS / Linux)  "
echo "========================================================"

mkdir -p "$DIR/resources/backend"

if [ -f "$DIR/optiflow-engine/.venv/bin/python" ]; then
    PYTHON_BIN="$DIR/optiflow-engine/.venv/bin/python"
else
    PYTHON_BIN="python3"
fi

"$PYTHON_BIN" -m PyInstaller --clean --distpath "$DIR/resources/backend" --workpath "$DIR/optiflow-engine/build" "$DIR/optiflow-engine/optiflow-engine.spec"

chmod +x "$DIR/resources/backend/optiflow-engine" 2>/dev/null || true
echo "[OK] Backend compilado exitosamente en resources/backend/optiflow-engine"
