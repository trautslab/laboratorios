#!/usr/bin/env bash
# Ejecuta el laboratorio completo, en Node y en Rust, y guarda la salida real de cada paso.
set -euo pipefail
cd "$(dirname "$0")/.."
source lib/captura.sh
lab=errores-por-capa

# El paso 1 corre SIN cadena: ese es el fallo que muestra. Los demás, con una cadena nueva.
apagar_cadena
correr "$lab/evidence/node/1-red.txt" node "$lab/1-red.mjs"
arrancar_cadena
recortar_arranque > "$lab/evidence/2-anvil.txt"
for paso in 2-nodo 3-rechazo 4-contrato 4-ejecucion 5-clasificar; do correr "$lab/evidence/node/$paso.txt" node "$lab/$paso.mjs"; done

compilar_rust errores_por_capa
apagar_cadena
correr "$lab/evidence/rust/1-red.txt" "$rust_bin/errores_por_capa_p1"
arrancar_cadena
correr "$lab/evidence/rust/2-nodo.txt" "$rust_bin/errores_por_capa_p2"
correr "$lab/evidence/rust/3-rechazo.txt" "$rust_bin/errores_por_capa_p3"
correr "$lab/evidence/rust/4-contrato.txt" "$rust_bin/errores_por_capa_p4_contrato"
correr "$lab/evidence/rust/4-ejecucion.txt" "$rust_bin/errores_por_capa_p4"
correr "$lab/evidence/rust/5-clasificar.txt" "$rust_bin/errores_por_capa_p5"

comparar_node_y_rust "$lab"
