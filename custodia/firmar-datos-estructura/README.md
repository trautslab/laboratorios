# 17. Firmar datos con estructura: qué ve quien aprueba

Una firma sobre un hash no deja leer qué se aprueba; EIP-712 firma campos con nombre y tipo, atados a una aplicación, una red y un contrato.

La guía completa, con la explicación de cada paso, los diagramas y las salidas reales: https://lab.trautslab.dev/firmar-datos-con-estructura

## Solo este laboratorio

```bash
git clone --filter=blob:none --sparse https://github.com/trautslab/laboratorios.git
cd laboratorios
git sparse-checkout set custodia/lib custodia/rust custodia/firmar-datos-estructura
cd custodia && npm install
```

## Pasos

Los comandos se corren desde la carpeta `custodia`.

### 1. Firma un hash y mira qué se ve

Ver que una firma sobre un hash no deja saber qué se aprueba.

```bash
node firmar-datos-estructura/1-hash-opaco.mjs
```

En Rust:

```bash
cd rust
cargo run -q --bin firmar_datos_estructura_p1
```

### 2. Firma la misma aprobación como datos con tipos

Ver qué puede mostrar una wallet cuando lo que llega a firmar trae nombres y tipos.

```bash
node firmar-datos-estructura/2-datos-tipados.mjs
```

En Rust:

```bash
cargo run -q --bin firmar_datos_estructura_p2
```

### 3. Calcula a mano el hash que se firma

Entender de qué está hecho el hash de EIP-712 rehaciéndolo con keccak256.

```bash
node firmar-datos-estructura/3-a-mano.mjs
```

En Rust:

```bash
cargo run -q --bin firmar_datos_estructura_p3
```

### 4. Presenta la firma en otro dominio

Comprobar que la firma está atada a la aplicación, la red y el contrato para los que se hizo.

```bash
node firmar-datos-estructura/4-otro-dominio.mjs
```

En Rust:

```bash
cargo run -q --bin firmar_datos_estructura_p4
```

### 5. Cambia un campo del mensaje

Comprobar que cada valor y cada nombre de campo están cubiertos por la firma.

```bash
node firmar-datos-estructura/5-otro-mensaje.mjs
```

En Rust:

```bash
cargo run -q --bin firmar_datos_estructura_p5
```

### 6. Arma el control del servicio de aprobaciones

Dejar en código qué acepta y qué guarda un servicio que recibe aprobaciones firmadas.

```bash
node firmar-datos-estructura/6-servicio.mjs
```

En Rust:

```bash
cargo run -q --bin firmar_datos_estructura_p6
```

## Volver a capturar las salidas

```bash
bash firmar-datos-estructura/capturar.sh
```

Ejecuta el laboratorio completo en Node y en Rust, guarda la salida real en `firmar-datos-estructura/evidence/` y comprueba que las dos son iguales.
