#!/usr/bin/env bash
# Ejecuta un laboratorio completo y guarda la salida real de cada paso en evidence/<lab>/.
# Requiere una cadena recién arrancada (npx anvil) y el llavero corriendo (Floci).
# Uso: ./capturar-evidencia.sh a-retiro
set -euo pipefail
cd "$(dirname "$0")"
lab="${1:?Indica el laboratorio, por ejemplo: a-retiro}"
mkdir -p "evidence/$lab"
node limpiar.mjs > /dev/null

correr() { # correr <archivo de evidencia> <comando...>
  local salida="evidence/$lab/$1.txt"; shift
  echo "\$ $*"
  "$@" > "$salida" 2>&1 || true
  cat "$salida"
}

# shellcheck disable=SC1090
source "$lab/pasos.sh"
