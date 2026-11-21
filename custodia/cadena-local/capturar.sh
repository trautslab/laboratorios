#!/usr/bin/env bash
# Ejecuta el laboratorio completo, en Node y en Rust, y guarda la salida real de cada paso.
set -euo pipefail
cd "$(dirname "$0")/.."
source lib/captura.sh
lab=cadena-local

arrancar_cadena
recortar_arranque > "$lab/evidence/1-anvil.txt"
for paso in 2-preguntar 3-con-libreria 4-saldos 5-bloques; do correr "$lab/evidence/node/$paso.txt" node "$lab/$paso.mjs"; done
arrancar_cadena
correr "$lab/evidence/node/5-reinicio.txt" node "$lab/3-con-libreria.mjs"

compilar_rust cadena_local
arrancar_cadena
for paso in 2-preguntar 3-con-libreria 4-saldos 5-bloques; do correr "$lab/evidence/rust/$paso.txt" "$rust_bin/cadena_local_p${paso%%-*}"; done
arrancar_cadena
correr "$lab/evidence/rust/5-reinicio.txt" "$rust_bin/cadena_local_p3"

comparar_node_y_rust "$lab"
