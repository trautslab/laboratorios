# 2. Cuentas, saldos y la diferencia entre cuenta y contrato

Qué guarda la cadena de cada dirección (saldo, nonce y código) y cómo saber con eth_getCode si la controla una llave o un contrato.

La guía completa, con la explicación de cada paso, los diagramas y las salidas reales: https://lab.trautslab.dev/cuentas-saldos-cuenta-y-contrato

## Solo este laboratorio

```bash
git clone --filter=blob:none --sparse https://github.com/trautslab/laboratorios.git
cd laboratorios
git sparse-checkout set custodia/lib custodia/rust custodia/cuentas-y-contratos
cd custodia && npm install
```

## Pasos

Los comandos se corren desde la carpeta `custodia`.

### 1. Arranca la cadena

Tener un nodo de Ethereum corriendo en tu máquina, con cuentas de prueba.

```bash
npx anvil
```

### 2. Mira una cuenta de prueba

Ver los tres datos que la cadena guarda de una dirección: saldo, nonce y código.

```bash
node cuentas-y-contratos/2-cuenta.mjs
```

En Rust:

```bash
cd rust
cargo run -q --bin cuentas_y_contratos_p2
```

### 3. Pregunta por una dirección que nadie usó

Comprobar que la cadena responde por cualquier dirección, aunque no tenga historia.

```bash
node cuentas-y-contratos/3-sin-usar.mjs
```

En Rust:

```bash
cargo run -q --bin cuentas_y_contratos_p3
```

### 4. Pon un contrato en la cadena y míralo

Ver que un contrato es una cuenta con código, con su propio saldo y su propio nonce.

```bash
node lib/compilar.mjs cuentas-y-contratos
node cuentas-y-contratos/4-contrato.mjs
```

En Rust:

```bash
node ../lib/compilar.mjs cuentas-y-contratos
cargo run -q --bin cuentas_y_contratos_p4
```

### 5. Escribe la función: ¿cuenta o contrato?

Tener una función que distinga una cuenta de un contrato preguntando por su código.

```bash
node cuentas-y-contratos/5-cuenta-o-contrato.mjs
```

En Rust:

```bash
cargo run -q --bin cuentas_y_contratos_p5
```

## Volver a capturar las salidas

```bash
bash cuentas-y-contratos/capturar.sh
```

Ejecuta el laboratorio completo en Node y en Rust, guarda la salida real en `cuentas-y-contratos/evidence/` y comprueba que las dos son iguales.
