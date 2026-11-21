#!/usr/bin/env bash
# Ejecuta el laboratorio completo, en Node y en Rust, y guarda la salida real de cada paso.
# Necesita el emulador de KMS en http://localhost:4566 (ver «Antes de empezar» en la página).
# Node y Rust usan la misma llave de KMS; cada uno corre sobre una cadena nueva para que los nonces coincidan.
set -euo pipefail
cd "$(dirname "$0")/.."
source lib/captura.sh
lab=kms-firmar-transaccion
pasos="1-preparar 2-armar 3-pedir-firma 4-corregir 5-enviar 6-sin-corregir"

arrancar_cadena
recortar_arranque > "$lab/evidence/1-anvil.txt"
for paso in $pasos; do correr "$lab/evidence/node/$paso.txt" node "$lab/$paso.mjs"; done

compilar_rust kms_firmar_transaccion
arrancar_cadena
for paso in $pasos; do correr "$lab/evidence/rust/$paso.txt" "$rust_bin/kms_firmar_transaccion_p${paso%%-*}"; done

comparar_node_y_rust "$lab"
