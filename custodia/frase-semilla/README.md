# 13. Frase semilla: de 12 palabras a muchas direcciones

Una frase semilla es un número escrito con palabras: de ella sale una semilla, de la semilla un árbol de llaves, y un camino como m/44'/60'/0'/0/3 nombra una de ellas.

La guía completa, con la explicación de cada paso, los diagramas y las salidas reales: https://lab.trautslab.dev/frase-semilla-a-direcciones

## Solo este laboratorio

```bash
git clone --filter=blob:none --sparse https://github.com/trautslab/laboratorios.git
cd laboratorios
git sparse-checkout set custodia/lib custodia/rust custodia/frase-semilla
cd custodia && npm install
```

## Pasos

Los comandos se corren desde la carpeta `custodia`.

### 1. Arranca la cadena y mira su frase

Ver que las 10 cuentas de prueba de Anvil salen de una sola frase y de un camino.

```bash
npx anvil
```

### 2. Lee la frase como un número y saca la semilla

Comprobar que 12 palabras son 128 bits con 4 de comprobación, y convertir la frase en una semilla de 64 bytes.

```bash
node frase-semilla/2-palabras.mjs
```

En Rust:

```bash
cd rust
cargo run -q --bin frase_semilla_p2
```

### 3. Deriva las cuentas de Anvil desde la frase

Calcular las llaves de las cuentas 0, 1 y 2 con la frase y un camino, y comprobar que son las de Anvil.

```bash
node frase-semilla/3-derivar.mjs
```

En Rust:

```bash
cargo run -q --bin frase_semilla_p3
```

### 4. Añade una passphrase: otro árbol

Ver que la misma frase con una passphrase da otra semilla y otras direcciones, sin ningún error.

```bash
node frase-semilla/4-passphrase.mjs
```

En Rust:

```bash
cargo run -q --bin frase_semilla_p4
```

### 5. Genera direcciones sin ninguna llave privada

Exportar la llave pública extendida del nivel de cuenta y listar con ella las direcciones 0, 1 y 2, sin la frase.

```bash
node frase-semilla/5-exportar-xpub.mjs
node frase-semilla/5-sin-llaves.mjs
```

En Rust:

```bash
node ../frase-semilla/5-exportar-xpub.mjs
cargo run -q --bin frase_semilla_p5
```

## Volver a capturar las salidas

```bash
bash frase-semilla/capturar.sh
```

Ejecuta el laboratorio completo en Node y en Rust, guarda la salida real en `frase-semilla/evidence/` y comprueba que las dos son iguales.
