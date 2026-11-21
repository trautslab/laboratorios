#!/usr/bin/env bash
# Ejecuta el laboratorio completo, en Node y en Rust, y guarda la salida real de cada paso.
set -euo pipefail
cd "$(dirname "$0")/.."
source lib/captura.sh
lab=primera-transferencia

# El arranque de Anvil, dejando a la vista la cuenta 0 y su llave: son las que usa el paso 3.
arranque_con_llave() {
  awk '/^Available Accounts/ { seccion = "cuentas" }
       /^Private Keys/ { seccion = "llaves" }
       /^Wallet/ || /^Base Fee/ { seccion = "saltar" }
       /^Chain ID/ || /^Listening/ { seccion = "" }
       seccion == "saltar" { next }
       seccion == "cuentas" && /^\([2-9]\)/ { if (!cuentas++) print "[… siguen 8 cuentas más …]"; next }
       seccion == "llaves" && /^\([1-9]\)/ { if (!llaves++) print "[… siguen 9 llaves más, todas públicas …]"; next }
       { print }' "$anvil_log"
}

# El paso 3 imprime el hash; los pasos 4 a 6 lo reciben como argumento, igual que quien sigue la guía.
hash_de() { awk '/^Hash:/ { print $2 }' "$1"; }
# El hash que la guía muestra en sus comandos. Si cambia, hay que cambiarlo también en la guía.
hash_esperado=0x6a6bdb4980c008950cae198884ee80114e0a58b7cfdaee25c578849018c79d3c

arrancar_cadena
arranque_con_llave > "$lab/evidence/1-anvil.txt"
correr "$lab/evidence/node/2-saldos.txt" node "$lab/2-saldos.mjs"
correr "$lab/evidence/node/3-enviar.txt" node "$lab/3-enviar.mjs"
hash="$(hash_de "$lab/evidence/node/3-enviar.txt")"
for paso in 4-recibo 5-transaccion 6-antes-y-despues; do correr "$lab/evidence/node/$paso.txt" node "$lab/$paso.mjs" "$hash"; done
[ "$hash" = "$hash_esperado" ] || { echo "El hash en Node cambió: $hash" >&2; exit 1; }

compilar_rust primera_transferencia
arrancar_cadena
correr "$lab/evidence/rust/2-saldos.txt" "$rust_bin/primera_transferencia_p2"
correr "$lab/evidence/rust/3-enviar.txt" "$rust_bin/primera_transferencia_p3"
hash="$(hash_de "$lab/evidence/rust/3-enviar.txt")"
for paso in 4-recibo 5-transaccion 6-antes-y-despues; do correr "$lab/evidence/rust/$paso.txt" "$rust_bin/primera_transferencia_p${paso%%-*}" "$hash"; done
[ "$hash" = "$hash_esperado" ] || { echo "El hash en Rust cambió: $hash" >&2; exit 1; }

comparar_node_y_rust "$lab"
