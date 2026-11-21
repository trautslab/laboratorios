#!/usr/bin/env bash
# Ejecuta el laboratorio completo, en Node y en Rust, y guarda la salida real de cada paso.
# No usa cadena. Necesita el emulador de KMS (Floci) en http://localhost:4566.
set -euo pipefail
cd "$(dirname "$0")/.."
source lib/captura.sh
lab=donde-vive-la-llave
# Llave de prueba n.º 0 de Anvil: pública, sirve solo para practicar.
llave=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Los pasos 1 y 3 escriben en tmp/. Cada lenguaje empieza sin esos archivos y al final no queda ninguno.
rm -rf "$lab/tmp"
correr "$lab/evidence/node/1-archivo.txt" node "$lab/1-archivo.mjs"
correr "$lab/evidence/node/2-variable.txt" env LLAVE_PRIVADA="$llave" node "$lab/2-variable.mjs"
correr "$lab/evidence/node/3-almacen.txt" node "$lab/3-almacen.mjs"
correr "$lab/evidence/node/4-kms.txt" node "$lab/4-kms.mjs"
correr "$lab/evidence/node/5-firmar-kms.txt" node "$lab/5-firmar-kms.mjs"
correr "$lab/evidence/node/6-comparar.txt" env LLAVE_PRIVADA="$llave" node "$lab/6-comparar.mjs"

compilar_rust donde_vive_la_llave
rm -rf "$lab/tmp"
correr "$lab/evidence/rust/1-archivo.txt" "$rust_bin/donde_vive_la_llave_p1"
correr "$lab/evidence/rust/2-variable.txt" env LLAVE_PRIVADA="$llave" "$rust_bin/donde_vive_la_llave_p2"
correr "$lab/evidence/rust/3-almacen.txt" "$rust_bin/donde_vive_la_llave_p3"
correr "$lab/evidence/rust/4-kms.txt" "$rust_bin/donde_vive_la_llave_p4"
correr "$lab/evidence/rust/5-firmar-kms.txt" "$rust_bin/donde_vive_la_llave_p5"
correr "$lab/evidence/rust/6-comparar.txt" env LLAVE_PRIVADA="$llave" "$rust_bin/donde_vive_la_llave_p6"
rm -rf "$lab/tmp"

comparar_node_y_rust "$lab"
