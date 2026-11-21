#!/usr/bin/env bash
# Ejecuta el laboratorio completo, en Node y en Rust, y guarda la salida real de cada paso.
set -euo pipefail
cd "$(dirname "$0")/.."
source lib/captura.sh
lab=unidades
pasos="2-saldo-crudo 3-number-pierde 4-convertir 5-decimales-por-activo 6-regla-completa"

arrancar_cadena
recortar_arranque > "$lab/evidence/1-anvil.txt"
for paso in $pasos; do correr "$lab/evidence/node/$paso.txt" node "$lab/$paso.mjs"; done

compilar_rust unidades
arrancar_cadena
for paso in $pasos; do correr "$lab/evidence/rust/$paso.txt" "$rust_bin/unidades_p${paso%%-*}"; done

comparar_node_y_rust "$lab"
