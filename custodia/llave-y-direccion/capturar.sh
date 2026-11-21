#!/usr/bin/env bash
# Ejecuta el laboratorio completo, en Node y en Rust, y guarda la salida real de cada paso.
set -euo pipefail
cd "$(dirname "$0")/.."
source lib/captura.sh
lab=llave-y-direccion
pasos="1-azar 2-publica 3-direccion 4-checksum 5-comparar"

# Del arranque de Anvil este laboratorio necesita la cuenta (0) y SU llave privada, que el recorte
# común no guarda. Se deja la primera de cada lista y se corta la sección de la frase semilla.
recortar_cuenta_y_llave() {
  awk '/^Available Accounts/ { seccion = "cuentas" }
       /^Private Keys/ { seccion = "llaves" }
       /^Wallet/ { seccion = "resto" }
       /^Listening/ { seccion = "" }
       seccion == "resto" { next }
       /^\(1\)/ { print (seccion == "cuentas" ? "[… siguen 9 cuentas más …]" : "[… siguen 9 llaves privadas de prueba más …]") }
       /^\([1-9]\)/ { next }
       { print }' "$anvil_log"
}

# Solo el paso 5 habla con la cadena; los otros cuatro son cálculos locales.
arrancar_cadena
mkdir -p "$lab/evidence"
recortar_cuenta_y_llave > "$lab/evidence/5-anvil.txt"
for paso in $pasos; do correr "$lab/evidence/node/$paso.txt" node "$lab/$paso.mjs"; done

compilar_rust llave_y_direccion
arrancar_cadena
for paso in $pasos; do correr "$lab/evidence/rust/$paso.txt" "$rust_bin/llave_y_direccion_p${paso%%-*}"; done

comparar_node_y_rust "$lab"
