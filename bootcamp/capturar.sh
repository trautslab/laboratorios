#!/usr/bin/env bash
# Ejecuta el laboratorio completo, en Node y en Rust, y guarda la salida real de cada paso en evidence/.
# Los pasos 1 a 4 son cálculos locales: no usan ninguna cadena. El paso 5 usa Foundry y una Anvil nueva.
set -euo pipefail
cd "$(dirname "$0")"
source lib/captura.sh
forge="$raiz/node_modules/.bin/forge"
pasos="1-huella 2-merkle 3-firma 4-cadena"

for paso in $pasos; do correr "evidence/node/$paso.txt" node "$paso.mjs"; done

# Paso 5: compilar y probar el contrato con forge, desplegarlo en una Anvil nueva y usarlo desde Node.
correr evidence/forge/5-build.txt "$forge" build --root contratos
correr evidence/forge/5-test.txt "$forge" test --root contratos
arrancar_cadena
correr evidence/forge/5-crear.txt "$forge" create --root contratos --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --broadcast src/Registro.sol:Registro
correr evidence/node/5-registrar.txt node 5-registrar.mjs

# Rust repite todo; el paso 5 sobre otra Anvil nueva, con el contrato otra vez en la misma dirección.
compilar_rust
for paso in $pasos; do correr "evidence/rust/$paso.txt" "$rust_bin/bootcamp_p${paso%%-*}"; done
arrancar_cadena
correr evidence/forge/5-crear-rust.txt "$forge" create --root contratos --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --broadcast src/Registro.sol:Registro
correr evidence/rust/5-registrar.txt "$rust_bin/bootcamp_p5"

# forge imprime cuánto tardó cada cosa; esos tiempos cambian en cada corrida y no se guardan.
sed -E -i 's/[0-9]+(\.[0-9]+)?(µs|ms|s)\b/…/g' evidence/forge/*.txt

comparar_node_y_rust
