# Funciones de captura (se cargan con `source`). Copia adaptada de custodia/lib/captura.sh.
#
# Solo una captura a la vez en toda la máquina: todas usan el puerto 8545. El candado (el mismo que
# usan los laboratorios de la ruta) hace esperar a la siguiente. Cada captura arranca y apaga SU Anvil por PID.

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

trap 'apagar_cadena' EXIT

# correr <archivo de evidencia> <comando...>: guarda la salida real del comando.
correr() {
  local salida="$1"; shift
  mkdir -p "$(dirname "$salida")"
  "$@" > "$salida" 2>&1 || true
}

# Compila los binarios del crate rust/ (bootcamp_p1 … bootcamp_p5).
# El directorio de compilación puede compartirse con CARGO_TARGET_DIR.
compilar_rust() {
  (cd "$raiz/rust" && cargo build --quiet --bins)
  rust_bin="${CARGO_TARGET_DIR:-$raiz/rust/target}/debug"
}

# Al final: cada salida de Node debe ser idéntica a la de Rust. Una línea que empieza por «≈ »
# lleva un valor que cambia en cada corrida (aquí, una llave al azar): de esas se compara solo la
# etiqueta, hasta los dos puntos.
sin_valores_variables() { sed -E 's/^(≈ [^:]*:).*/\1/' "$1"; }
comparar_node_y_rust() {
  local fallo=0
  for f in "$raiz"/evidence/node/*.txt; do
    if diff -q <(sin_valores_variables "$f") <(sin_valores_variables "$raiz/evidence/rust/$(basename "$f")") > /dev/null; then echo "igual en Node y Rust: $(basename "$f")"; else echo "DISTINTO: $(basename "$f")"; fallo=1; fi
  done
  return $fallo
}
