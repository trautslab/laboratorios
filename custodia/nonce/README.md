# 6. El nonce: orden de salida y repetición

Cada cuenta lleva un contador, el nonce: ordena lo que envía y hace que la cadena rechace la misma transacción dos veces. En Node y en Rust.

La guía completa, con la explicación de cada paso, los diagramas y las salidas reales: https://lab.trautslab.dev/nonce-orden-y-repeticion

## Solo este laboratorio

```bash
git clone --filter=blob:none --sparse https://github.com/trautslab/laboratorios.git
cd laboratorios
git sparse-checkout set custodia/lib custodia/rust custodia/nonce
cd custodia && npm install
```

## Pasos

Los comandos se corren desde la carpeta `custodia`.

### 1. Arranca la cadena

Tener un nodo de Ethereum corriendo en tu máquina, con todas las cuentas sin estrenar.

```bash
npx anvil
```

### 2. Lee el contador y míralo subir

Ver que el nonce es un dato de la cuenta y que sube en uno con cada transacción que envía.

```bash
node nonce/2-contador.mjs
```

En Rust:

```bash
cd rust
cargo run -q --bin nonce_p2
```

### 3. Firma una vez, envía dos

Comprobar que la cadena ejecuta una transacción firmada una sola vez.

```bash
node nonce/3-repetir.mjs
```

En Rust:

```bash
cargo run -q --bin nonce_p3
```

### 4. Sáltate un número

Ver qué pasa con una transacción cuyo nonce va adelantado.

```bash
node nonce/4-hueco.mjs
```

En Rust:

```bash
cargo run -q --bin nonce_p4
```

### 5. Envía el que faltaba

Ver que al llenar el hueco entran las dos transacciones, en el orden de sus nonces.

```bash
node nonce/5-completar.mjs
```

En Rust:

```bash
cargo run -q --bin nonce_p5
```

### 6. Dos en espera: latest y pending

Saber qué responde cada etiqueta cuando hay transacciones aceptadas que todavía no están en un bloque.

```bash
node nonce/6-pendientes.mjs
```

En Rust:

```bash
cargo run -q --bin nonce_p6
```

## Volver a capturar las salidas

```bash
bash nonce/capturar.sh
```

Ejecuta el laboratorio completo en Node y en Rust, guarda la salida real en `nonce/evidence/` y comprueba que las dos son iguales.
