# 18. Ciclo de vida de una llave: deshabilitar, reemplazar y destruir

Una llave de firma tiene estados. Deshabilitarla se deshace, reemplazarla cambia la dirección y obliga a mover los fondos, y destruirla tiene una espera tras la cual la dirección no firma nunca más. En Node y en Rust.

La guía completa, con la explicación de cada paso, los diagramas y las salidas reales: https://lab.trautslab.dev/ciclo-de-vida-de-una-llave

## Solo este laboratorio

```bash
git clone --filter=blob:none --sparse https://github.com/trautslab/laboratorios.git
cd laboratorios
git sparse-checkout set custodia/lib custodia/rust custodia/ciclo-de-vida-llave
cd custodia && npm install
```

## Pasos

Los comandos se corren desde la carpeta `custodia`.

### 1. Una llave que firma

Tener una llave de firma en el KMS, con dirección, saldo y un pago hecho con ella.

```bash
npx anvil
node ciclo-de-vida-llave/1-crear.mjs
```

En Rust:

```bash
npx anvil
cd rust
cargo run -q --bin ciclo_de_vida_llave_p1
```

### 2. Deshabilitar: la firma se detiene y se puede volver

Ver el rechazo real del KMS con la llave deshabilitada y comprobar que el cambio se deshace.

```bash
node ciclo-de-vida-llave/2-deshabilitar.mjs
```

En Rust:

```bash
cargo run -q --bin ciclo_de_vida_llave_p2
```

### 3. Reemplazar: llave nueva, dirección nueva, fondos trasladados

Comprobar que una llave de firma no se rota y hacer el reemplazo completo: otra llave, mover el saldo y reapuntar el alias.

```bash
node ciclo-de-vida-llave/3-reemplazar.mjs
```

En Rust:

```bash
cargo run -q --bin ciclo_de_vida_llave_p3
```

### 4. Programar la destrucción: una espera con fecha

Programar el borrado de la llave anterior, leer su estado y su fecha, y ver qué pasa si llega dinero a su dirección.

```bash
node ciclo-de-vida-llave/4-programar.mjs
```

En Rust:

```bash
cargo run -q --bin ciclo_de_vida_llave_p4
```

### 5. Cancelar a tiempo y retirar en orden

Cancelar el borrado, rescatar el depósito y repetir el retiro de la llave en el orden que no pierde fondos.

```bash
node ciclo-de-vida-llave/5-retirar.mjs
```

En Rust:

```bash
cargo run -q --bin ciclo_de_vida_llave_p5
```

## Volver a capturar las salidas

```bash
bash ciclo-de-vida-llave/capturar.sh
```

Ejecuta el laboratorio completo en Node y en Rust, guarda la salida real en `ciclo-de-vida-llave/evidence/` y comprueba que las dos son iguales.
