#!/usr/bin/env bash
# Ejecuta el laboratorio completo, en Node y en Rust, y guarda la salida real de cada paso.
# Este laboratorio no usa ninguna cadena: firmar y verificar son cálculos locales.
set -euo pipefail
cd "$(dirname "$0")/.."
source lib/captura.sh
lab=firmar-datos-estructura
pasos="1-hash-opaco 2-datos-tipados 3-a-mano 4-otro-dominio 5-otro-mensaje 6-servicio"

for paso in $pasos; do correr "$lab/evidence/node/$paso.txt" node "$lab/$paso.mjs"; done

compilar_rust firmar_datos_estructura
for paso in $pasos; do correr "$lab/evidence/rust/$paso.txt" "$rust_bin/firmar_datos_estructura_p${paso%%-*}"; done

comparar_node_y_rust "$lab"
