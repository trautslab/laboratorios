# Funciones comunes de los scripts de captura (se cargan con `source`).
#
# Solo una captura a la vez en toda la máquina: todas usan el puerto 8545. El candado hace
# esperar a la siguiente en lugar de pisarla. Cada captura arranca y apaga SU Anvil por PID.

raiz="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
exec 9> /tmp/custodia-ruta.captura.lock
flock 9

anvil_pid=""
anvil_log="$(mktemp)"

apagar_cadena() {
  if [ -n "$anvil_pid" ] && kill -0 "$anvil_pid" 2>/dev/null; then kill "$anvil_pid"; wait "$anvil_pid" 2>/dev/null || true; fi
  anvil_pid=""
}

# Arranca una cadena nueva (bloque 0) y espera a que responda.
arrancar_cadena() {
  apagar_cadena
  "$raiz/node_modules/.bin/anvil" "$@" > "$anvil_log" 2>&1 &
  anvil_pid=$!
  for _ in $(seq 1 50); do
    if grep -q '^Listening' "$anvil_log"; then return 0; fi
    sleep 0.2
  done
  echo "Anvil no arrancó: $(tail -3 "$anvil_log")" >&2
  return 1
}

# Una segunda cadena en el puerto 8546, para los laboratorios que comparan dos redes.
anvil_b_pid=""
anvil_b_log="$(mktemp)"
apagar_cadena_b() {
  if [ -n "$anvil_b_pid" ] && kill -0 "$anvil_b_pid" 2>/dev/null; then kill "$anvil_b_pid"; wait "$anvil_b_pid" 2>/dev/null || true; fi
  anvil_b_pid=""
}
arrancar_cadena_b() {
  apagar_cadena_b
  "$raiz/node_modules/.bin/anvil" --port 8546 "$@" > "$anvil_b_log" 2>&1 &
  anvil_b_pid=$!
  for _ in $(seq 1 50); do
    if grep -q '^Listening' "$anvil_b_log"; then return 0; fi
    sleep 0.2
  done
  echo "La segunda cadena no arrancó: $(tail -3 "$anvil_b_log")" >&2
  return 1
}

trap 'apagar_cadena; apagar_cadena_b' EXIT

# El arranque de Anvil imprime 10 cuentas y 10 llaves: la evidencia guarda el principio y el final.
recortar_arranque() {
  awk '/^\(3\)/ && !hecho { hecho = 1; saltar = 1; print "[… siguen 7 cuentas más y sus llaves privadas de prueba …]"; print ""; next }
       saltar && /^Chain ID/ { saltar = 0; id = 1 }
       saltar { next }
       id && /^Base Fee/ { id = 0; cola = 1; next }
       cola && !/^Listening/ { next }
       { print }' "$anvil_log"
}

# correr <archivo de evidencia> <comando...>: guarda la salida real del comando.
correr() {
  local salida="$1"; shift
  mkdir -p "$(dirname "$salida")"
  "$@" > "$salida" 2>&1 || true
}

# compilar_rust <prefijo>: compila solo los binarios de este laboratorio (cadena_local → cadena_local_p2, …).
# El directorio de compilación puede compartirse con CARGO_TARGET_DIR.
compilar_rust() {
  (cd "$raiz/rust" && cargo build --quiet --bin "$1_p*")
  rust_bin="${CARGO_TARGET_DIR:-$raiz/rust/target}/debug"
}

# Al final: cada salida de Node debe ser idéntica a la de Rust. Una línea que empieza por «≈ »
# lleva un valor que cambia en cada corrida (un id que crea el KMS, una firma con azar): de esas
# se compara solo la etiqueta, hasta los dos puntos.
sin_valores_variables() { sed -E 's/^(≈ [^:]*:).*/\1/' "$1"; }
comparar_node_y_rust() {
  local carpeta="$1" fallo=0
  for f in "$carpeta"/evidence/node/*.txt; do
    if diff -q <(sin_valores_variables "$f") <(sin_valores_variables "$carpeta/evidence/rust/$(basename "$f")") > /dev/null; then echo "igual en Node y Rust: $(basename "$f")"; else echo "DISTINTO: $(basename "$f")"; fallo=1; fi
  done
  return $fallo
}
