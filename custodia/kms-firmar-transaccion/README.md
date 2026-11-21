# 16. Firmar una transacción con KMS y enviarla

Firmar con un KMS es armar la transacción tú: el servicio recibe un hash de 32 bytes y devuelve una firma DER que hay que convertir en r, s baja y yParity antes de enviarla.

La guía completa, con la explicación de cada paso, los diagramas y las salidas reales: https://lab.trautslab.dev/kms-firmar-transaccion

## Solo este laboratorio

```bash
git clone --filter=blob:none --sparse https://github.com/trautslab/laboratorios.git
cd laboratorios
git sparse-checkout set custodia/lib custodia/rust custodia/kms-firmar-transaccion
cd custodia && npm install
```

## Pasos

Los comandos se corren desde la carpeta `custodia`.

### 1. Prepara la llave, su dirección y sus fondos

Tener una llave secp256k1 en KMS, saber qué dirección le corresponde y darle ETH de prueba.

```bash
npx anvil
node kms-firmar-transaccion/1-preparar.mjs
```

En Rust:

```bash
npx anvil
cd rust
cargo run -q --bin kms_firmar_transaccion_p1
```

### 2. Arma la transacción sin firmar y calcula su hash

Ver los bytes que se firman y que caben en un hash de 32 bytes.

```bash
node kms-firmar-transaccion/2-armar.mjs
```

En Rust:

```bash
cargo run -q --bin kms_firmar_transaccion_p2
```

### 3. Envía el hash a KMS y lee la firma DER

Pedir la firma con solo 32 bytes y sacar r y s de lo que vuelve.

```bash
node kms-firmar-transaccion/3-pedir-firma.mjs
```

En Rust:

```bash
cargo run -q --bin kms_firmar_transaccion_p3
```

### 4. Corrige s y encuentra yParity

Dejar la firma con los tres valores que lleva una transacción: r, s en la mitad baja y yParity.

```bash
node kms-firmar-transaccion/4-corregir.mjs
```

En Rust:

```bash
cargo run -q --bin kms_firmar_transaccion_p4
```

### 5. Adjunta la firma, envía y lee el recibo

Enviar la transacción firmada por KMS y comprobar en la cadena quién la envió.

```bash
node kms-firmar-transaccion/5-enviar.mjs
```

En Rust:

```bash
cargo run -q --bin kms_firmar_transaccion_p5
```

### 6. Quita cada corrección y mira qué responde la cadena

Reconocer los dos fallos típicos de una integración con KMS, y saber cuál no te avisa.

```bash
node kms-firmar-transaccion/6-sin-corregir.mjs
```

En Rust:

```bash
cargo run -q --bin kms_firmar_transaccion_p6
```

## Volver a capturar las salidas

```bash
bash kms-firmar-transaccion/capturar.sh
```

Ejecuta el laboratorio completo en Node y en Rust, guarda la salida real en `kms-firmar-transaccion/evidence/` y comprueba que las dos son iguales.
