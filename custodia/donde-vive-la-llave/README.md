# 14. Dónde vive una llave: archivo, variable de entorno, almacén cifrado y KMS

La misma firma sale de una llave guardada en cuatro lugares. Lo que cambia es quién puede leer la llave: en tres, tu programa la tiene en la mano; en un KMS solo pide firmas. En Node y en Rust.

La guía completa, con la explicación de cada paso, los diagramas y las salidas reales: https://lab.trautslab.dev/donde-vive-una-llave

## Solo este laboratorio

```bash
git clone --filter=blob:none --sparse https://github.com/trautslab/laboratorios.git
cd laboratorios
git sparse-checkout set custodia/lib custodia/rust custodia/donde-vive-la-llave
cd custodia && npm install
```

## Pasos

Los comandos se corren desde la carpeta `custodia`.

### 1. Un archivo en claro

Firmar con una llave leída de un archivo y ver que cualquier copia del archivo firma igual.

```bash
node donde-vive-la-llave/1-archivo.mjs
```

En Rust:

```bash
cd rust
cargo run -q --bin donde_vive_la_llave_p1
```

### 2. Una variable de entorno

Firmar con una llave que llega por el entorno y ver quién más la recibe.

```bash
LLAVE_PRIVADA=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 node donde-vive-la-llave/2-variable.mjs
```

En Rust:

```bash
LLAVE_PRIVADA=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 cargo run -q --bin donde_vive_la_llave_p2
```

### 3. Un almacén cifrado

Guardar la llave cifrada con una contraseña, ver qué queda en el archivo y abrirlo para firmar.

```bash
node donde-vive-la-llave/3-almacen.mjs
```

En Rust:

```bash
cargo run -q --bin donde_vive_la_llave_p3
```

### 4. Un KMS: la llave nace dentro

Crear una llave dentro de un KMS y ver qué entrega el servicio cuando le pides la llave.

```bash
node donde-vive-la-llave/4-kms.mjs
```

En Rust:

```bash
cargo run -q --bin donde_vive_la_llave_p4
```

### 5. Firmar sin tener la llave

Pedirle una firma al KMS y verificarla fuera, con la llave pública.

```bash
node donde-vive-la-llave/5-firmar-kms.mjs
```

En Rust:

```bash
cargo run -q --bin donde_vive_la_llave_p5
```

### 6. Las cuatro, lado a lado

Comparar los cuatro lugares con las mismas dos preguntas y la misma firma.

```bash
LLAVE_PRIVADA=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 node donde-vive-la-llave/6-comparar.mjs
```

En Rust:

```bash
LLAVE_PRIVADA=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 cargo run -q --bin donde_vive_la_llave_p6
```

## Volver a capturar las salidas

```bash
bash donde-vive-la-llave/capturar.sh
```

Ejecuta el laboratorio completo en Node y en Rust, guarda la salida real en `donde-vive-la-llave/evidence/` y comprueba que las dos son iguales.
