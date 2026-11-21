# 4. Unidades: wei, decimales y números grandes

En la cadena todo monto es un entero en la unidad mínima: los decimales son de la pantalla, y se calcula con BigInt o U256, en Node y en Rust.

La guía completa, con la explicación de cada paso, los diagramas y las salidas reales: https://lab.trautslab.dev/unidades-wei-decimales

## Solo este laboratorio

```bash
git clone --filter=blob:none --sparse https://github.com/trautslab/laboratorios.git
cd laboratorios
git sparse-checkout set custodia/lib custodia/rust custodia/unidades
cd custodia && npm install
```

## Pasos

Los comandos se corren desde la carpeta `custodia`.

### 1. Arranca la cadena

Tener un nodo de Ethereum corriendo en tu máquina.

```bash
npx anvil
```

### 2. Lee un saldo tal como llega

Ver que la cadena responde con un entero en wei, sin ningún decimal.

```bash
node unidades/2-saldo-crudo.mjs
```

En Rust:

```bash
cd rust
cargo run -q --bin unidades_p2
```

### 3. Mira qué pierde un Number

Comprobar con números concretos que la coma flotante cambia montos en wei y un entero grande no.

```bash
node unidades/3-number-pierde.mjs
```

En Rust:

```bash
cargo run -q --bin unidades_p3
```

### 4. Convierte en los bordes

Pasar de texto con decimales a entero, y de entero a texto, con las funciones de la librería.

```bash
node unidades/4-convertir.mjs
```

En Rust:

```bash
cargo run -q --bin unidades_p4
```

### 5. El mismo «1.5» en dos activos

Ver que los decimales son una convención de cada activo y que confundirlos cambia el monto 10^12 veces.

```bash
node unidades/5-decimales-por-activo.mjs
```

En Rust:

```bash
cargo run -q --bin unidades_p5
```

### 6. Aplica la regla contra la cadena

Recorrer el camino completo: texto a entero al entrar, cuentas en enteros, y decimales solo al final.

```bash
node unidades/6-regla-completa.mjs
```

En Rust:

```bash
cargo run -q --bin unidades_p6
```

## Volver a capturar las salidas

```bash
bash unidades/capturar.sh
```

Ejecuta el laboratorio completo en Node y en Rust, guarda la salida real en `unidades/evidence/` y comprueba que las dos son iguales.
