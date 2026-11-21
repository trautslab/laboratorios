# 8. Bloques y confirmaciones: cuándo algo es definitivo

Incluida no es definitiva: cuenta las confirmaciones de una transferencia, espera las que pidas y pregunta por los bloques safe y finalized, en Node y en Rust.

La guía completa, con la explicación de cada paso, los diagramas y las salidas reales: https://lab.trautslab.dev/bloques-y-confirmaciones

## Solo este laboratorio

```bash
git clone --filter=blob:none --sparse https://github.com/trautslab/laboratorios.git
cd laboratorios
git sparse-checkout set custodia/lib custodia/rust custodia/confirmaciones
cd custodia && npm install
```

## Pasos

Los comandos se corren desde la carpeta `custodia`.

### 1. Arranca la cadena

Tener un nodo local en el bloque 0, sin nada encima.

```bash
npx anvil
```

### 2. Envía una transferencia y cuenta

Ver en qué bloque quedó una transferencia y cuántas confirmaciones tiene.

```bash
node confirmaciones/2-transferir.mjs
```

En Rust:

```bash
cd rust
cargo run -q --bin confirmaciones_p2
```

### 3. Produce bloques a mano

Ver que cada bloque nuevo suma una confirmación sin tocar la transferencia.

```bash
node confirmaciones/3-minar.mjs
node confirmaciones/3-minar.mjs
```

En Rust:

```bash
cargo run -q --bin confirmaciones_p3
cargo run -q --bin confirmaciones_p3
```

### 4. Espera las confirmaciones que pidas

Escribir una función que no devuelve hasta que la transferencia tiene n confirmaciones.

```bash
node confirmaciones/4-esperar.mjs
node confirmaciones/3-minar.mjs
node confirmaciones/3-minar.mjs
```

En Rust:

```bash
cargo run -q --bin confirmaciones_p4
cd rust
cargo run -q --bin confirmaciones_p3
cargo run -q --bin confirmaciones_p3
```

### 5. Pregunta por safe y finalized

Ver la otra forma de decidir: pedirle al nodo el último bloque seguro y el último finalizado.

```bash
node confirmaciones/5-etiquetas.mjs
```

En Rust:

```bash
cargo run -q --bin confirmaciones_p5
```

## Volver a capturar las salidas

```bash
bash confirmaciones/capturar.sh
```

Ejecuta el laboratorio completo en Node y en Rust, guarda la salida real en `confirmaciones/evidence/` y comprueba que las dos son iguales.
