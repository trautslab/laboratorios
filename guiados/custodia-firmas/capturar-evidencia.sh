#!/usr/bin/env bash
# Ejecuta el laboratorio completo y guarda la salida real de cada paso en evidence/.
# Requiere una cadena recién arrancada (npx anvil).
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p evidence
node limpiar.mjs > /dev/null
for paso in 01-desplegar 02-retiro-multifirma 03-multifirma-rechaza 04-generar-llave-mpc 05-retiro-mpc 06-mpc-rechaza 07-comparar 08-cambiar-firmante; do
  echo "\$ node $paso.mjs"
  node "$paso.mjs" > "evidence/$paso.txt" 2>&1 || true
  cat "evidence/$paso.txt"
done
