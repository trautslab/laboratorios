#!/usr/bin/env bash
# Ejecuta el laboratorio completo, en Node y en Rust, y guarda la salida real de cada paso.
set -euo pipefail
cd "$(dirname "$0")/.."
source lib/captura.sh
lab=confirmaciones

# Paso 4: esperar() queda corriendo (Terminal 2) mientras se piden dos bloques, uno por vez (Terminal 3).
esperar_y_minar() {
  local donde="$1" esperar="$2" minar="$3"
  correr "$donde/4-esperar.txt" $esperar &
  local espera=$!
  sleep 2; correr "$donde/4-bloque-uno.txt" $minar
  sleep 2; correr "$donde/4-bloque-dos.txt" $minar
  wait "$espera"
}

arrancar_cadena
recortar_arranque > "$lab/evidence/1-anvil.txt"
correr "$lab/evidence/node/2-transferir.txt" node "$lab/2-transferir.mjs"
correr "$lab/evidence/node/3-minar.txt" node "$lab/3-minar.mjs"
correr "$lab/evidence/node/3-otra-vez.txt" node "$lab/3-minar.mjs"
esperar_y_minar "$lab/evidence/node" "node $lab/4-esperar.mjs" "node $lab/3-minar.mjs"
correr "$lab/evidence/node/5-etiquetas.txt" node "$lab/5-etiquetas.mjs"

compilar_rust confirmaciones
arrancar_cadena
correr "$lab/evidence/rust/2-transferir.txt" "$rust_bin/confirmaciones_p2"
correr "$lab/evidence/rust/3-minar.txt" "$rust_bin/confirmaciones_p3"
correr "$lab/evidence/rust/3-otra-vez.txt" "$rust_bin/confirmaciones_p3"
esperar_y_minar "$lab/evidence/rust" "$rust_bin/confirmaciones_p4" "$rust_bin/confirmaciones_p3"
correr "$lab/evidence/rust/5-etiquetas.txt" "$rust_bin/confirmaciones_p5"

comparar_node_y_rust "$lab"
