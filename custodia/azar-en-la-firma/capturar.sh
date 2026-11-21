#!/usr/bin/env bash
# Ejecuta el laboratorio completo, en Node y en Rust, y guarda la salida real de cada paso.
# Este laboratorio no usa la cadena: son solo cuentas, así que no arranca Anvil.
set -euo pipefail
cd "$(dirname "$0")/.."
source lib/captura.sh
lab=azar-en-la-firma
pasos="1-dos-firmas 2-firma-a-mano 3-mismo-k 4-recuperar-llave 5-detectar"

for paso in $pasos; do correr "$lab/evidence/node/$paso.txt" node "$lab/$paso.mjs"; done

compilar_rust azar_en_la_firma
for paso in $pasos; do correr "$lab/evidence/rust/$paso.txt" "$rust_bin/azar_en_la_firma_p${paso%%-*}"; done

comparar_node_y_rust "$lab"
