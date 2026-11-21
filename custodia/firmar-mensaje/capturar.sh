#!/usr/bin/env bash
# Ejecuta el laboratorio completo, en Node y en Rust, y guarda la salida real de cada paso.
# Este laboratorio no usa ninguna cadena: firmar y verificar son cálculos locales, así que
# aquí no se arranca Anvil.
set -euo pipefail
cd "$(dirname "$0")/.."
source lib/captura.sh
lab=firmar-mensaje

for paso in 1-firmar 2-verificar 3-cambiar 4-que-se-firmo 5-aprobacion; do correr "$lab/evidence/node/$paso.txt" node "$lab/$paso.mjs"; done

compilar_rust firmar_mensaje
for paso in 1-firmar 2-verificar 3-cambiar 4-que-se-firmo 5-aprobacion; do correr "$lab/evidence/rust/$paso.txt" "$rust_bin/firmar_mensaje_p${paso%%-*}"; done

comparar_node_y_rust "$lab"
