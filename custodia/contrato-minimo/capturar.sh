#!/usr/bin/env bash
# Ejecuta el laboratorio completo, en Node y en Rust, y guarda la salida real de cada paso.
set -euo pipefail
cd "$(dirname "$0")/.."
source lib/captura.sh
lab=contrato-minimo
pasos="2-artefacto 3-desplegar 4-leer 5-escribir"

mkdir -p "$lab/evidence"
arrancar_cadena
recortar_arranque > "$lab/evidence/1-anvil.txt"
correr "$lab/evidence/node/2-compilar.txt" node lib/compilar.mjs "$lab"
for paso in $pasos; do correr "$lab/evidence/node/$paso.txt" node "$lab/$paso.mjs"; done

# Rust repite todo sobre una cadena nueva: el contrato vuelve a quedar en la misma dirección.
correr "$lab/evidence/rust/2-compilar.txt" node lib/compilar.mjs "$lab"
compilar_rust contrato_minimo
arrancar_cadena
for paso in $pasos; do correr "$lab/evidence/rust/$paso.txt" "$rust_bin/contrato_minimo_p${paso%%-*}"; done

comparar_node_y_rust "$lab"
