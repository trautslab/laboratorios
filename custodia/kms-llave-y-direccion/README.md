# 15. Crear una llave en KMS y obtener su dirección

La llave privada nace dentro del KMS y no sale: pides la llave pública, calculas tú la dirección de Ethereum y la compruebas con una firma.

La guía completa, con la explicación de cada paso, los diagramas y las salidas reales: https://lab.trautslab.dev/kms-llave-y-direccion

## Solo este laboratorio

```bash
git clone --filter=blob:none --sparse https://github.com/trautslab/laboratorios.git
cd laboratorios
git sparse-checkout set custodia/lib custodia/rust custodia/kms-llave-y-direccion
cd custodia && npm install
```

## Pasos

Los comandos se corren desde la carpeta `custodia`.

### 1. Crea la llave dentro del KMS

Tener una llave de firma secp256k1 que vive en el servicio, con un nombre para encontrarla.

```bash
node kms-llave-y-direccion/1-crear-llave.mjs
```

En Rust:

```bash
cd rust
cargo run -q --bin kms_llave_y_direccion_p1
```

### 2. Lee lo que el servicio dice de la llave

Ver qué sabe el KMS de la llave y comprobar que responde con datos sobre ella, no con ella.

```bash
node kms-llave-y-direccion/2-describir.mjs
```

En Rust:

```bash
cargo run -q --bin kms_llave_y_direccion_p2
```

### 3. Pide la llave pública y ábrela

Obtener la llave pública del KMS y encontrar dentro los dos números que la forman.

```bash
node kms-llave-y-direccion/3-llave-publica.mjs
```

En Rust:

```bash
cargo run -q --bin kms_llave_y_direccion_p3
```

### 4. Calcula la dirección

Convertir la llave pública en la dirección de Ethereum del custodio.

```bash
node kms-llave-y-direccion/4-direccion.mjs
```

En Rust:

```bash
cargo run -q --bin kms_llave_y_direccion_p4
```

### 5. Comprueba la dirección con una firma

Demostrar que la llave privada de esa dirección es la que está en el KMS, sin verla.

```bash
node kms-llave-y-direccion/5-comprobar.mjs
```

En Rust:

```bash
cargo run -q --bin kms_llave_y_direccion_p5
```

### 6. Mira esa dirección en una cadena

Ver que la dirección calculada desde el KMS es una cuenta como cualquier otra: recibe fondos y tiene saldo.

```bash
npx anvil
node kms-llave-y-direccion/6-saldo.mjs
```

En Rust:

```bash
npx anvil
cargo run -q --bin kms_llave_y_direccion_p6
```

## Volver a capturar las salidas

```bash
bash kms-llave-y-direccion/capturar.sh
```

Ejecuta el laboratorio completo en Node y en Rust, guarda la salida real en `kms-llave-y-direccion/evidence/` y comprueba que las dos son iguales.
