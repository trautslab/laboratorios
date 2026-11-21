# 9. Errores por capa: red, nodo y ejecución

Ante un fallo, lo primero es saber qué capa respondió: nadie, el nodo con un error, un rechazo antes del bloque o un recibo con status 0. En Node y en Rust.

La guía completa, con la explicación de cada paso, los diagramas y las salidas reales: https://lab.trautslab.dev/errores-por-capa

## Solo este laboratorio

```bash
git clone --filter=blob:none --sparse https://github.com/trautslab/laboratorios.git
cd laboratorios
git sparse-checkout set custodia/lib custodia/rust custodia/errores-por-capa
cd custodia && npm install
```

## Pasos

Los comandos se corren desde la carpeta `custodia`.

### 1. Capa de red: nadie responde

Ver cómo se ve un fallo cuando la petición no llega a ningún nodo.

```bash
node errores-por-capa/1-red.mjs
```

En Rust:

```bash
cd rust
cargo run -q --bin errores_por_capa_p1
```

### 2. Capa de nodo: responde con un error

Reconocer el objeto `error` que devuelve el nodo cuando no entiende la petición.

```bash
npx anvil
node errores-por-capa/2-nodo.mjs
```

En Rust:

```bash
npx anvil
cargo run -q --bin errores_por_capa_p2
```

### 3. Rechazo antes del bloque: sin hash

Ver una transacción bien formada que el nodo no admite, y comprobar que no dejó rastro.

```bash
node errores-por-capa/3-rechazo.mjs
```

En Rust:

```bash
cargo run -q --bin errores_por_capa_p3
```

### 4. Capa de ejecución: recibo con status 0

Ver una transacción que entra en un bloque, paga comisión y falla dentro de un contrato.

```bash
node errores-por-capa/4-contrato.mjs
node errores-por-capa/4-ejecucion.mjs
```

En Rust:

```bash
cargo run -q --bin errores_por_capa_p4_contrato
cargo run -q --bin errores_por_capa_p4
```

### 5. Clasifica el fallo antes de reaccionar

Escribir una función que nombra la capa de un fallo y dice qué hacer con él.

```bash
node errores-por-capa/5-clasificar.mjs
```

En Rust:

```bash
cargo run -q --bin errores_por_capa_p5
```

## Volver a capturar las salidas

```bash
bash errores-por-capa/capturar.sh
```

Ejecuta el laboratorio completo en Node y en Rust, guarda la salida real en `errores-por-capa/evidence/` y comprueba que las dos son iguales.
