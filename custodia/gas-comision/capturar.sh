#!/usr/bin/env bash
# Ejecuta el laboratorio completo, en Node y en Rust, y guarda la salida real de cada paso.
set -euo pipefail
cd "$(dirname "$0")/.."
source lib/captura.sh
lab=gas-comision
pasos="1-base-fee 2-enviar 3-calcular 4-reparto 5-techo"

# El arranque de Anvil, sin las cuentas 3 a 9 ni la hora de arranque, y con la base fee a la vista.
recortar_con_base_fee() {
  awk '/^\(3\)/ && !visto { visto = 1; saltar = 1; print "[… siguen 7 cuentas más y sus llaves privadas de prueba …]"; print ""; next }
       saltar && /^Chain ID/ { saltar = 0 }
       /^Genesis Timestamp/ { saltar = 1 }
       /^Listening/ { saltar = 0 }
       saltar { next }
       { print }' "$anvil_log"
}

arrancar_cadena
mkdir -p "$lab/evidence"
recortar_con_base_fee > "$lab/evidence/1-anvil.txt"
for paso in $pasos; do correr "$lab/evidence/node/$paso.txt" node "$lab/$paso.mjs"; done

compilar_rust gas_comision
arrancar_cadena
for paso in $pasos; do correr "$lab/evidence/rust/$paso.txt" "$rust_bin/gas_comision_p${paso%%-*}"; done

comparar_node_y_rust "$lab"
