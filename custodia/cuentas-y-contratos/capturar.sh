#!/usr/bin/env bash
# Ejecuta el laboratorio completo, en Node y en Rust, y guarda la salida real de cada paso.
set -euo pipefail
cd "$(dirname "$0")/.."
source lib/captura.sh
lab=cuentas-y-contratos
pasos="2-cuenta 3-sin-usar 4-contrato 5-cuenta-o-contrato"

mkdir -p "$lab/evidence"
arrancar_cadena
recortar_arranque > "$lab/evidence/1-anvil.txt"
correr "$lab/evidence/node/4-compilar.txt" node lib/compilar.mjs "$lab"
for paso in $pasos; do correr "$lab/evidence/node/$paso.txt" node "$lab/$paso.mjs"; done

# Rust repite todo sobre una cadena nueva: el contrato vuelve a quedar en la misma dirección.
# El contrato se compila antes: la macro sol! lee contratos/out/Alcancia.json al compilar el binario.
correr "$lab/evidence/rust/4-compilar.txt" node lib/compilar.mjs "$lab"
compilar_rust cuentas_y_contratos
arrancar_cadena
for paso in $pasos; do correr "$lab/evidence/rust/$paso.txt" "$rust_bin/cuentas_y_contratos_p${paso%%-*}"; done

comparar_node_y_rust "$lab"
