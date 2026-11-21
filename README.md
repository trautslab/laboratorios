# Laboratorios de TrautsLab

El código de los laboratorios de https://lab.trautslab.dev. La teoría está en https://trautslab.com; aquí está lo que se ejecuta.

## Qué hay aquí

- [`custodia/`](custodia/): **Custodia desde Node**, la ruta de laboratorios cortos. 19 publicados, en Node y en Rust.
- [`guiados/`](guiados/): los laboratorios largos de custodia (mini custodio con KMS, tesorería hot y warm, KYT antes de firmar, multifirma y MPC).
- [`clasicos/`](clasicos/): los primeros laboratorios de Ethereum y de consenso, con Foundry.

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

## Requisitos

- Node.js 20.18 o superior.
- Para la pestaña de Rust: `cargo` reciente (probado con 1.97).
- Si `npx anvil` dice que no encuentra el programa, corre `npm rebuild` dentro de `custodia`.
- Para los laboratorios de KMS: Docker, con `docker run -d --name floci -p 4566:4566 floci/floci:2.5.0`.
