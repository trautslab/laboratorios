#!/usr/bin/env bash
# Ejecuta el laboratorio completo, en Node y en Rust, y guarda la salida real de cada paso.
set -euo pipefail
cd "$(dirname "$0")/.."
source lib/captura.sh
lab=frase-semilla

# Recorte propio del arranque: este laboratorio necesita la sección «Wallet» (frase y camino),
# que el recorte común quita. Deja 3 cuentas, 3 llaves, la frase y la línea final.
recortar_con_frase() {
  awk '/^\(3\)/ { n++; print (n == 1 ? "[… siguen 7 cuentas más …]" : "[… siguen 7 llaves privadas de prueba más …]"); saltar = 1; next }
       saltar && /^$/ { saltar = 0 }
       saltar { next }
       /^Chain ID/ { cola = 1 }
       cola && !/^Listening/ { next }
       { print }' "$anvil_log"
}

mkdir -p "$lab/evidence"
arrancar_cadena
recortar_con_frase > "$lab/evidence/1-anvil.txt"
for paso in 2-palabras 3-derivar 4-passphrase 5-exportar-xpub 5-sin-llaves; do correr "$lab/evidence/node/$paso.txt" node "$lab/$paso.mjs"; done

# Rust: exportar la llave pública extendida se hace con el mismo script de Node en las dos pestañas
# (alloy no reexporta el crate que la serializa); el resto son binarios propios.
compilar_rust frase_semilla
correr "$lab/evidence/rust/5-exportar-xpub.txt" node "$lab/5-exportar-xpub.mjs"
for paso in 2-palabras 3-derivar 4-passphrase; do correr "$lab/evidence/rust/$paso.txt" "$rust_bin/frase_semilla_p${paso%%-*}"; done
correr "$lab/evidence/rust/5-sin-llaves.txt" "$rust_bin/frase_semilla_p5"

comparar_node_y_rust "$lab"
