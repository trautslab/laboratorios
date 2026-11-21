# 19. Desplegar y llamar un contrato mínimo

Compilar un contrato, ponerlo en la cadena con una transacción sin destino, leerlo gratis con eth_call y cambiarlo con una transacción: los bytes de cada paso, en Node y en Rust.

La guía completa, con la explicación de cada paso, los diagramas y las salidas reales: https://lab.trautslab.dev/desplegar-y-llamar-un-contrato

## Solo este laboratorio

```bash
git clone --filter=blob:none --sparse https://github.com/trautslab/laboratorios.git
cd laboratorios
git sparse-checkout set custodia/lib custodia/rust custodia/contrato-minimo
cd custodia && npm install
```

## Pasos

Los comandos se corren desde la carpeta `custodia`.

### 1. Arranca la cadena

Tener un nodo local en el bloque 0, sin ningún contrato.

```bash
npx anvil
```

### 2. Compila y mira qué sale

Ver los dos productos del compilador: la interfaz (ABI) y los bytes que van a la cadena.

```bash
node lib/compilar.mjs contrato-minimo
node contrato-minimo/2-artefacto.mjs
```

En Rust:

```bash
node lib/compilar.mjs contrato-minimo
cd rust
cargo run -q --bin contrato_minimo_p2
```

### 3. Despliega: una transacción sin destino

Poner el contrato en la cadena y comprobar que su dirección se podía saber antes.

```bash
node contrato-minimo/3-desplegar.mjs
```

En Rust:

```bash
cargo run -q --bin contrato_minimo_p3
```

### 4. Lee sin pagar

Llamar a `valor()` con `eth_call` y ver los bytes que van y vuelven.

```bash
node contrato-minimo/4-leer.mjs
```

En Rust:

```bash
cargo run -q --bin contrato_minimo_p4
```

### 5. Escribe: una transacción al contrato

Llamar a `sumar(5)` con una transacción y ver cambiar la casilla 0 del contrato.

```bash
node contrato-minimo/5-escribir.mjs
```

En Rust:

```bash
cargo run -q --bin contrato_minimo_p5
```

## Volver a capturar las salidas

```bash
bash contrato-minimo/capturar.sh
```

Ejecuta el laboratorio completo en Node y en Rust, guarda la salida real en `contrato-minimo/evidence/` y comprueba que las dos son iguales.
