# Laboratorios de TrautsLab

El código de los laboratorios de https://lab.trautslab.dev. La teoría está en https://trautslab.com; aquí está lo que se ejecuta.

## Qué hay aquí

- [`custodia/`](custodia/): **Custodia desde Node**, la ruta de laboratorios cortos. 19 publicados, en Node y en Rust.
- [`guiados/`](guiados/): los laboratorios largos de custodia (mini custodio con KMS, tesorería hot y warm, KYT antes de firmar, multifirma y MPC).

## Clonar todo

```bash
git clone https://github.com/trautslab/laboratorios.git
cd laboratorios/custodia && npm install
```

## Clonar un solo laboratorio

Cada laboratorio necesita su carpeta y las dos carpetas compartidas de su ruta (`lib` y `rust`). Git descarga solo eso:

```bash
git clone --filter=blob:none --sparse https://github.com/trautslab/laboratorios.git
cd laboratorios
git sparse-checkout set custodia/lib custodia/rust custodia/<laboratorio>
cd custodia && npm install
```

El nombre de cada laboratorio está en [`custodia/README.md`](custodia/README.md). Para sumar otro más tarde: `git sparse-checkout add custodia/<otro>`.

## Dónde se probó

Cada salida guardada en `evidence/` se obtuvo ejecutando el laboratorio de verdad, en Node y en Rust, en un contenedor Linux (Ubuntu 24.04, x86_64), con una cadena local Anvil y, para los laboratorios de KMS, con el emulador Floci 2.5.0 en Docker y credenciales ficticias. No se probó en macOS ni en Windows, ni contra AWS real. Las versiones exactas están en la página de cada laboratorio.

La Action `laboratorios` vuelve a ejecutar todo en cada cambio y cada lunes, y falla si una salida cambia o si Node y Rust dejan de coincidir.

## Requisitos

- Node.js 20.18 o superior.
- Para la pestaña de Rust: `cargo` reciente (probado con 1.97).
- Si `npx anvil` dice que no encuentra el programa, corre `npm rebuild` dentro de `custodia`.
- Para los laboratorios de KMS: Docker, con `docker run -d --name floci -p 4566:4566 floci/floci:2.5.0`.
