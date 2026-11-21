#!/usr/bin/env bash
# Ejecuta el laboratorio completo, en Node y en Rust, y guarda la salida real de cada paso.
# La cadena se arranca dos veces por lenguaje: primero como red 31337 y después como red 1337.
set -euo pipefail
cd "$(dirname "$0")/.."
source lib/captura.sh
lab=chain-id

arrancar_cadena
recortar_arranque > "$lab/evidence/1-anvil.txt"
correr "$lab/evidence/node/1-cuenta.txt" node "$lab/1-cuenta.mjs"
correr "$lab/evidence/node/2-firmar.txt" node "$lab/2-firmar.mjs"
arrancar_cadena --chain-id 1337
recortar_arranque > "$lab/evidence/3-anvil.txt"
correr "$lab/evidence/node/3-cuenta.txt" node "$lab/1-cuenta.mjs"
for paso in 4-enviar-a-otra-red 5-firmar-para-esta-red 6-comprobar-antes; do correr "$lab/evidence/node/$paso.txt" node "$lab/$paso.mjs"; done

compilar_rust chain_id
arrancar_cadena
correr "$lab/evidence/rust/1-cuenta.txt" "$rust_bin/chain_id_p1"
correr "$lab/evidence/rust/2-firmar.txt" "$rust_bin/chain_id_p2"
arrancar_cadena --chain-id 1337
correr "$lab/evidence/rust/3-cuenta.txt" "$rust_bin/chain_id_p1"
for paso in 4-enviar-a-otra-red 5-firmar-para-esta-red 6-comprobar-antes; do correr "$lab/evidence/rust/$paso.txt" "$rust_bin/chain_id_p${paso%%-*}"; done

comparar_node_y_rust "$lab"
