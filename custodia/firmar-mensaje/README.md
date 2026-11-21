# 11. Firmar y verificar un mensaje

Una firma prueba que quien tiene una llave aprobó exactamente estos bytes, y cualquiera lo comprueba sin secretos: del mensaje y la firma sale la dirección de quien firmó.

La guía completa, con la explicación de cada paso, los diagramas y las salidas reales: https://lab.trautslab.dev/firmar-y-verificar-mensaje

## Solo este laboratorio

```bash
git clone --filter=blob:none --sparse https://github.com/trautslab/laboratorios.git
cd laboratorios
git sparse-checkout set custodia/lib custodia/rust custodia/firmar-mensaje
cd custodia && npm install
```

## Pasos

Los comandos se corren desde la carpeta `custodia`.

### 1. Firma un texto corto y mira sus tres partes

Obtener una firma de 65 bytes y saber qué son `r`, `s` y `v`.

```bash
node firmar-mensaje/1-firmar.mjs
```

En Rust:

```bash
cd rust
cargo run -q --bin firmar_mensaje_p1
```

### 2. Verifica la firma sin tener ninguna llave

Recuperar la dirección de quien firmó a partir del mensaje y la firma, y compararla con la esperada.

```bash
node firmar-mensaje/2-verificar.mjs
```

En Rust:

```bash
cargo run -q --bin firmar_mensaje_p2
```

### 3. Cambia un carácter del mensaje

Ver que la misma firma, con otro mensaje, lleva a otra dirección.

```bash
node firmar-mensaje/3-cambiar.mjs
```

En Rust:

```bash
cargo run -q --bin firmar_mensaje_p3
```

### 4. Reconstruye lo que se firmó de verdad

Armar a mano el hash que firma la librería y obtener con él la misma firma.

```bash
node firmar-mensaje/4-que-se-firmo.mjs
```

En Rust:

```bash
cargo run -q --bin firmar_mensaje_p4
```

### 5. Comprueba una aprobación contra una lista

Usar la verificación como la usa un custodio: saber quién aprobó un retiro y decidir si podía hacerlo.

```bash
node firmar-mensaje/5-aprobacion.mjs
```

En Rust:

```bash
cargo run -q --bin firmar_mensaje_p5
```

## Volver a capturar las salidas

```bash
bash firmar-mensaje/capturar.sh
```

Ejecuta el laboratorio completo en Node y en Rust, guarda la salida real en `firmar-mensaje/evidence/` y comprueba que las dos son iguales.
