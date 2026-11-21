# Custodia desde Node

La ruta de laboratorios de https://lab.trautslab.dev: cada uno enseña un concepto de custodia de activos digitales, se ejecuta en tu máquina (Anvil y, para KMS, el emulador Floci) y tiene la misma salida en Node y en Rust. Sin red, sin cuentas en la nube y sin dinero.

| N.º | Etapa | Laboratorio | Página |
| --- | --- | --- | --- |
| 1 | La cadena | [Levantar una cadena local y hacerle preguntas](cadena-local/) | [guía](https://lab.trautslab.dev/cadena-local-preguntas) |
| 2 | La cadena | [Cuentas, saldos y la diferencia entre cuenta y contrato](cuentas-y-contratos/) | [guía](https://lab.trautslab.dev/cuentas-saldos-cuenta-y-contrato) |
| 3 | La cadena | [Tu primera transferencia y su recibo](primera-transferencia/) | [guía](https://lab.trautslab.dev/primera-transferencia-recibo) |
| 4 | La cadena | [Unidades: wei, decimales y números grandes](unidades/) | [guía](https://lab.trautslab.dev/unidades-wei-decimales) |
| 5 | La cadena | [Gas y comisión: qué se paga y a quién](gas-comision/) | [guía](https://lab.trautslab.dev/gas-y-comision) |
| 6 | La cadena | [El nonce: orden de salida y repetición](nonce/) | [guía](https://lab.trautslab.dev/nonce-orden-y-repeticion) |
| 7 | La cadena | [Redes y chain id: por qué una firma no vale en otra red](chain-id/) | [guía](https://lab.trautslab.dev/redes-y-chain-id) |
| 8 | La cadena | [Bloques y confirmaciones: cuándo algo es definitivo](confirmaciones/) | [guía](https://lab.trautslab.dev/bloques-y-confirmaciones) |
| 9 | La cadena | [Errores por capa: red, nodo y ejecución](errores-por-capa/) | [guía](https://lab.trautslab.dev/errores-por-capa) |
| 10 | Llaves y firmas de una persona | [Generar una llave y derivar su dirección a mano](llave-y-direccion/) | [guía](https://lab.trautslab.dev/llave-y-direccion-a-mano) |
| 11 | Llaves y firmas de una persona | [Firmar y verificar un mensaje](firmar-mensaje/) | [guía](https://lab.trautslab.dev/firmar-y-verificar-mensaje) |
| 12 | Llaves y firmas de una persona | [El azar en la firma: dos firmas con el mismo número secreto revelan la llave](azar-en-la-firma/) | [guía](https://lab.trautslab.dev/azar-en-la-firma) |
| 13 | Llaves y firmas de una persona | [Frase semilla: de 12 palabras a muchas direcciones](frase-semilla/) | [guía](https://lab.trautslab.dev/frase-semilla-a-direcciones) |
| 14 | Llaves y firmas de una persona | [Dónde vive una llave: archivo, variable de entorno, almacén cifrado y KMS](donde-vive-la-llave/) | [guía](https://lab.trautslab.dev/donde-vive-una-llave) |
| 15 | Llaves y firmas de una persona | [Crear una llave en KMS y obtener su dirección](kms-llave-y-direccion/) | [guía](https://lab.trautslab.dev/kms-llave-y-direccion) |
| 16 | Llaves y firmas de una persona | [Firmar una transacción con KMS y enviarla](kms-firmar-transaccion/) | [guía](https://lab.trautslab.dev/kms-firmar-transaccion) |
| 17 | Llaves y firmas de una persona | [Firmar datos con estructura: qué ve quien aprueba](firmar-datos-estructura/) | [guía](https://lab.trautslab.dev/firmar-datos-con-estructura) |
| 18 | Llaves y firmas de una persona | [Ciclo de vida de una llave: deshabilitar, reemplazar y destruir](ciclo-de-vida-llave/) | [guía](https://lab.trautslab.dev/ciclo-de-vida-de-una-llave) |
| 19 | Contratos, tokens y stablecoins | [Desplegar y llamar un contrato mínimo](contrato-minimo/) | [guía](https://lab.trautslab.dev/desplegar-y-llamar-un-contrato) |

## Qué hay en esta carpeta

- `package.json`: las librerías de Node de toda la ruta, y Anvil.
- `lib/`: el compilador de contratos y las funciones de captura que comparten los laboratorios.
- `rust/`: un solo crate; cada paso de cada laboratorio es un binario (`rust/src/bin/<laboratorio>_pN.rs`).
- `<laboratorio>/`: los scripts de Node de cada paso, su `capturar.sh` y `evidence/` con las salidas reales.
