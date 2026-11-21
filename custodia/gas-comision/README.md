# 5. Gas y comisión: qué se paga y a quién

La comisión es gas usado por precio: una parte se quema, otra va a quien produjo el bloque y el techo que firmas no es lo que pagas. En Node y en Rust.

La guía completa, con la explicación de cada paso, los diagramas y las salidas reales: https://lab.trautslab.dev/gas-y-comision

## Solo este laboratorio

```bash
git clone --filter=blob:none --sparse https://github.com/trautslab/laboratorios.git
cd laboratorios
git sparse-checkout set custodia/lib custodia/rust custodia/gas-comision
cd custodia && npm install
```

## Pasos

Los comandos se corren desde la carpeta `custodia`.

### 1. Arranca la cadena y lee la base fee

Ver que el precio mínimo del gas es un dato de cada bloque, no algo que tú decides.

```bash
npx anvil
node gas-comision/1-base-fee.mjs
```

En Rust:

```bash
npx anvil
cd rust
cargo run -q --bin gas_comision_p1
```

### 2. Envía una transferencia con techo y propina

Escribir tú los dos límites del precio y leer en el recibo lo que se cobró.

```bash
node gas-comision/2-enviar.mjs
```

En Rust:

```bash
cargo run -q --bin gas_comision_p2
```

### 3. Calcula la comisión y compárala con el saldo

Comprobar que la comisión es gas usado × precio efectivo, con el saldo de quien envió como testigo.

```bash
node gas-comision/3-calcular.mjs
```

En Rust:

```bash
cargo run -q --bin gas_comision_p3
```

### 4. Sigue el dinero: propina y quema

Ver qué parte de la comisión llegó a alguien y qué parte no llegó a nadie.

```bash
node gas-comision/4-reparto.mjs
```

En Rust:

```bash
cargo run -q --bin gas_comision_p4
```

### 5. Mueve el techo: tres casos

Comprobar que el techo limita lo que pagas y no fija el precio.

```bash
node gas-comision/5-techo.mjs
```

En Rust:

```bash
cargo run -q --bin gas_comision_p5
```

## Volver a capturar las salidas

```bash
bash gas-comision/capturar.sh
```

Ejecuta el laboratorio completo en Node y en Rust, guarda la salida real en `gas-comision/evidence/` y comprueba que las dos son iguales.
