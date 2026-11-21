#!/usr/bin/env bash
# Ejecuta el laboratorio completo, en Node y en Rust, y guarda la salida real de cada paso.
# Necesita el emulador del KMS (Floci) en http://localhost:4566. Cada corrida crea llaves nuevas
# y reapunta los alias en el paso 1, así que se puede repetir las veces que haga falta.
set -euo pipefail
cd "$(dirname "$0")/.."
source lib/captura.sh
lab=ciclo-de-vida-llave

mkdir -p "$lab/evidence"
arrancar_cadena
recortar_arranque > "$lab/evidence/1-anvil.txt"
for paso in 1-crear 2-deshabilitar 3-reemplazar 4-programar 5-retirar; do correr "$lab/evidence/node/$paso.txt" node "$lab/$paso.mjs"; done

compilar_rust ciclo_de_vida_llave
arrancar_cadena
correr "$lab/evidence/rust/1-crear.txt" "$rust_bin/ciclo_de_vida_llave_p1"
correr "$lab/evidence/rust/2-deshabilitar.txt" "$rust_bin/ciclo_de_vida_llave_p2"
correr "$lab/evidence/rust/3-reemplazar.txt" "$rust_bin/ciclo_de_vida_llave_p3"
correr "$lab/evidence/rust/4-programar.txt" "$rust_bin/ciclo_de_vida_llave_p4"
correr "$lab/evidence/rust/5-retirar.txt" "$rust_bin/ciclo_de_vida_llave_p5"

comparar_node_y_rust "$lab"
