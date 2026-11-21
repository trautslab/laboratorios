# 7. Redes y chain id: por qué una firma no vale en otra red

La misma llave da la misma dirección en todas las redes; lo que ata una transacción a una sola es el chain id que va dentro de lo firmado.

La guía completa, con la explicación de cada paso, los diagramas y las salidas reales: https://lab.trautslab.dev/redes-y-chain-id

## Solo este laboratorio

```bash
git clone --filter=blob:none --sparse https://github.com/trautslab/laboratorios.git
cd laboratorios
git sparse-checkout set custodia/lib custodia/rust custodia/chain-id
cd custodia && npm install
```

## Pasos

Los comandos se corren desde la carpeta `custodia`.

### 1. Arranca la red 31337 y mira la cuenta

Tener una red corriendo y saber qué responde sobre la cuenta que va a firmar.

```bash
npx anvil
node chain-id/1-cuenta.mjs
```

En Rust:

```bash
npx anvil
cd rust
cargo run -q --bin chain_id_p1
```

### 2. Firma una transferencia sin enviarla

Ver que el chain id es uno de los campos que quedan firmados.

```bash
node chain-id/2-firmar.mjs
```

En Rust:

```bash
cargo run -q --bin chain_id_p2
```

### 3. Reinicia la cadena como otra red

Comprobar que la misma llave da la misma dirección en una red con otro chain id.

```bash
npx anvil --chain-id 1337
node chain-id/1-cuenta.mjs
```

En Rust:

```bash
npx anvil --chain-id 1337
cargo run -q --bin chain_id_p1
```

### 4. Envía a la red 1337 lo firmado para la 31337

Ver el rechazo real de una firma hecha para otra red.

```bash
node chain-id/4-enviar-a-otra-red.mjs
```

En Rust:

```bash
cargo run -q --bin chain_id_p4
```

### 5. Firma la misma transferencia para esta red

Ver que con el chain id de la red, la misma llave y los mismos campos sí valen.

```bash
node chain-id/5-firmar-para-esta-red.mjs
```

En Rust:

```bash
cargo run -q --bin chain_id_p5
```

### 6. Comprueba la red antes de firmar

Dejar en código el control que evita firmar para una red que no es la que crees.

```bash
node chain-id/6-comprobar-antes.mjs
```

En Rust:

```bash
cargo run -q --bin chain_id_p6
```

## Volver a capturar las salidas

```bash
bash chain-id/capturar.sh
```

Ejecuta el laboratorio completo en Node y en Rust, guarda la salida real en `chain-id/evidence/` y comprueba que las dos son iguales.
