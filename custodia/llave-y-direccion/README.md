# 10. Generar una llave y derivar su dirección a mano

Una llave privada son 32 bytes al azar. De ella salen, con dos cálculos locales, la llave pública y la dirección: sin registro, en Node y en Rust.

La guía completa, con la explicación de cada paso, los diagramas y las salidas reales: https://lab.trautslab.dev/llave-y-direccion-a-mano

## Solo este laboratorio

```bash
git clone --filter=blob:none --sparse https://github.com/trautslab/laboratorios.git
cd laboratorios
git sparse-checkout set custodia/lib custodia/rust custodia/llave-y-direccion
cd custodia && npm install
```

## Pasos

Los comandos se corren desde la carpeta `custodia`.

### 1. Genera 32 bytes y comprueba que sirven

Ver que una llave privada es un número de 32 bytes al azar, con una sola condición.

```bash
node llave-y-direccion/1-azar.mjs
```

En Rust:

```bash
cd rust
cargo run -q --bin llave_y_direccion_p1
```

### 2. Calcula la llave pública

Ver que la llave pública es un punto de la curva, calculado a partir de la llave privada.

```bash
node llave-y-direccion/2-publica.mjs
```

En Rust:

```bash
cargo run -q --bin llave_y_direccion_p2
```

### 3. Calcula la dirección

Obtener la dirección a partir de la llave pública con un hash y un recorte.

```bash
node llave-y-direccion/3-direccion.mjs
```

En Rust:

```bash
cargo run -q --bin llave_y_direccion_p3
```

### 4. Aplica el checksum EIP-55

Entender qué significan las mayúsculas de una dirección y qué error detectan.

```bash
node llave-y-direccion/4-checksum.mjs
```

En Rust:

```bash
cargo run -q --bin llave_y_direccion_p4
```

### 5. Compara con la librería y con la cadena

Comprobar que lo hecho a mano es lo que hacen las librerías, y que la cadena no registra llaves.

```bash
npx anvil
node llave-y-direccion/5-comparar.mjs
```

En Rust:

```bash
npx anvil
cargo run -q --bin llave_y_direccion_p5
```

## Volver a capturar las salidas

```bash
bash llave-y-direccion/capturar.sh
```

Ejecuta el laboratorio completo en Node y en Rust, guarda la salida real en `llave-y-direccion/evidence/` y comprueba que las dos son iguales.
