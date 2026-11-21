#!/usr/bin/env bash
# Ejecuta el laboratorio completo, en Node y en Rust, y guarda la salida real de cada paso.
set -euo pipefail
cd "$(dirname "$0")/.."
source lib/captura.sh
lab=nonce
pasos="2-contador 3-repetir 4-hueco 5-completar 6-pendientes"

# Los pasos comparten la misma cadena, en orden: cada uno parte del nonce que dejó el anterior.
arrancar_cadena
recortar_arranque > "$lab/evidence/1-anvil.txt"
for paso in $pasos; do correr "$lab/evidence/node/$paso.txt" node "$lab/$paso.mjs"; done

compilar_rust nonce
arrancar_cadena
for paso in $pasos; do correr "$lab/evidence/rust/$paso.txt" "$rust_bin/nonce_p${paso%%-*}"; done

comparar_node_y_rust "$lab"
