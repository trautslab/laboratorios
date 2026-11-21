# 1. Levantar una cadena local y hacerle preguntas

Una cadena es un servicio HTTP: pregúntale por JSON-RPC, a mano y con una librería, en Node y en Rust.

La guía completa, con la explicación de cada paso, los diagramas y las salidas reales: https://lab.trautslab.dev/cadena-local-preguntas

## Solo este laboratorio

```bash
git clone --filter=blob:none --sparse https://github.com/trautslab/laboratorios.git
cd laboratorios
git sparse-checkout set custodia/lib custodia/rust custodia/cadena-local
cd custodia && npm install
```

## Pasos

Los comandos se corren desde la carpeta `custodia`.

### 1. Arranca la cadena

Tener un nodo de Ethereum corriendo en tu máquina.

```bash
npx anvil
```

### 2. Pregúntale a mano

Ver que hablar con la cadena es enviar un JSON por HTTP.

```bash
node cadena-local/2-preguntar.mjs
```

En Rust:

```bash
cd rust
cargo run -q --bin cadena_local_p2
```

### 3. Lo mismo, con una librería

Entender qué te ahorra una librería y qué no cambia.

```bash
node cadena-local/3-con-libreria.mjs
```

En Rust:

```bash
cargo run -q --bin cadena_local_p3
```

### 4. Pregunta por saldos

Ver que el saldo de una cuenta es un dato que guarda la cadena.

```bash
node cadena-local/4-saldos.mjs
```

En Rust:

```bash
cargo run -q --bin cadena_local_p4
```

### 5. Mira los bloques y apaga la cadena

Entender cuándo avanza esta cadena y dónde vive su estado.

```bash
node cadena-local/5-bloques.mjs
node cadena-local/3-con-libreria.mjs
```

En Rust:

```bash
cargo run -q --bin cadena_local_p5
cargo run -q --bin cadena_local_p3
```

## Volver a capturar las salidas

```bash
bash cadena-local/capturar.sh
```

Ejecuta el laboratorio completo en Node y en Rust, guarda la salida real en `cadena-local/evidence/` y comprueba que las dos son iguales.
