# 3. Tu primera transferencia y su recibo

Envía 1 ETH en una cadena local, guarda el hash y pide el recibo: la prueba de que la transferencia ocurrió. En Node y en Rust.

La guía completa, con la explicación de cada paso, los diagramas y las salidas reales: https://lab.trautslab.dev/primera-transferencia-recibo

## Solo este laboratorio

```bash
git clone --filter=blob:none --sparse https://github.com/trautslab/laboratorios.git
cd laboratorios
git sparse-checkout set custodia/lib custodia/rust custodia/primera-transferencia
cd custodia && npm install
```

## Pasos

Los comandos se corren desde la carpeta `custodia`.

### 1. Arranca la cadena

Tener un nodo corriendo y ubicar la cuenta y la llave con las que vas a enviar.

```bash
npx anvil
```

### 2. Mira los saldos antes de enviar

Dejar a la vista el estado de la cadena antes de cambiarlo.

```bash
node primera-transferencia/2-saldos.mjs
```

En Rust:

```bash
cd rust
cargo run -q --bin primera_transferencia_p2
```

### 3. Envía 1 ETH y guarda el hash

Entregar a la cadena una transferencia firmada y recibir su identificador.

```bash
node primera-transferencia/3-enviar.mjs
```

En Rust:

```bash
cargo run -q --bin primera_transferencia_p3
```

### 4. Pide el recibo

Comprobar con el hash que la transferencia ocurrió, y ver qué responde la cadena cuando no hay nada que comprobar.

```bash
node primera-transferencia/4-recibo.mjs 0x6a6bdb4980c008950cae198884ee80114e0a58b7cfdaee25c578849018c79d3c
```

En Rust:

```bash
cargo run -q --bin primera_transferencia_p4 -- 0x6a6bdb4980c008950cae198884ee80114e0a58b7cfdaee25c578849018c79d3c
```

### 5. Compara la transacción con su recibo

Distinguir lo que pediste de lo que pasó: son dos consultas distintas con el mismo hash.

```bash
node primera-transferencia/5-transaccion.mjs 0x6a6bdb4980c008950cae198884ee80114e0a58b7cfdaee25c578849018c79d3c
```

En Rust:

```bash
cargo run -q --bin primera_transferencia_p5 -- 0x6a6bdb4980c008950cae198884ee80114e0a58b7cfdaee25c578849018c79d3c
```

### 6. Comprueba el cambio de estado

Ver los saldos justo antes y justo después del bloque que indica el recibo.

```bash
node primera-transferencia/6-antes-y-despues.mjs 0x6a6bdb4980c008950cae198884ee80114e0a58b7cfdaee25c578849018c79d3c
```

En Rust:

```bash
cargo run -q --bin primera_transferencia_p6 -- 0x6a6bdb4980c008950cae198884ee80114e0a58b7cfdaee25c578849018c79d3c
```

## Volver a capturar las salidas

```bash
bash primera-transferencia/capturar.sh
```

Ejecuta el laboratorio completo en Node y en Rust, guarda la salida real en `primera-transferencia/evidence/` y comprueba que las dos son iguales.
