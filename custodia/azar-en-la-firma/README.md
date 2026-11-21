# 12. El azar en la firma: dos firmas con el mismo número secreto revelan la llave

Cada firma ECDSA usa un número secreto k. Si se repite, dos firmas bastan para calcular la llave privada: se firma a mano, se recupera la llave y se detecta, en Node y en Rust.

La guía completa, con la explicación de cada paso, los diagramas y las salidas reales: https://lab.trautslab.dev/azar-en-la-firma

## Solo este laboratorio

```bash
git clone --filter=blob:none --sparse https://github.com/trautslab/laboratorios.git
cd laboratorios
git sparse-checkout set custodia/lib custodia/rust custodia/azar-en-la-firma
cd custodia && npm install
```

## Pasos

Los comandos se corren desde la carpeta `custodia`.

### 1. Firma dos mensajes y mira r

Ver que dos firmas normales tienen un `r` distinto y que la librería no usa azar para firmar.

```bash
node azar-en-la-firma/1-dos-firmas.mjs
```

En Rust:

```bash
cd rust
cargo run -q --bin azar_en_la_firma_p1
```

### 2. Escribe la firma a mano, con k a la vista

Hacer las dos cuentas de la firma en una función que recibe `k`, y comprobar que da lo mismo que la librería.

```bash
node azar-en-la-firma/2-firma-a-mano.mjs
```

En Rust:

```bash
cargo run -q --bin azar_en_la_firma_p2
```

### 3. Repite k en dos mensajes

Ver qué deja a la vista un firmante que usa el mismo `k` dos veces.

```bash
node azar-en-la-firma/3-mismo-k.mjs
```

En Rust:

```bash
cargo run -q --bin azar_en_la_firma_p3
```

### 4. Recupera la llave con dos divisiones

Calcular `k` y la llave privada usando solo las dos firmas y los dos mensajes.

```bash
node azar-en-la-firma/4-recuperar-llave.mjs
```

En Rust:

```bash
cargo run -q --bin azar_en_la_firma_p4
```

### 5. Detecta un r repetido

Escribir el control que recorre las firmas de un firmante y avisa si un `r` aparece dos veces.

```bash
node azar-en-la-firma/5-detectar.mjs
```

En Rust:

```bash
cargo run -q --bin azar_en_la_firma_p5
```

## Volver a capturar las salidas

```bash
bash azar-en-la-firma/capturar.sh
```

Ejecuta el laboratorio completo en Node y en Rust, guarda la salida real en `azar-en-la-firma/evidence/` y comprueba que las dos son iguales.
