# Aviso de licencia

Este laboratorio usa la librería `@silencelaboratories/dkls-wasm-ll-node` (firma ECDSA por umbral,
protocolo DKLs23) para su parte de MPC. Esa librería **no es de código abierto**: se distribuye
bajo la licencia de uso no comercial de Silence Laboratories.

> This software library is licensed under the Silence Laboratories License Agreement,
> Copyright © Silence Laboratories Pte. Ltd. All Rights Reserved.

Consecuencias prácticas:

- Puedes instalarla y ejecutar este laboratorio para aprender, sin costo.
- El código de esta carpeta que la usa (`lib/mpc.mjs` y los pasos 4, 5, 6 y 8) queda sujeto a la
  misma restricción de uso no comercial y a este aviso.
- Cualquier uso comercial requiere una licencia comercial de Silence Laboratories.
- La licencia define el uso no comercial como uso personal de estudio, investigación o educación,
  «sin aplicación comercial prevista», y dice expresamente que usar la librería «para fines internos
  de negocio» no cuenta como no comercial. Si vas a correr este laboratorio como capacitación de un
  equipo dentro de una empresa, revisa ese punto antes: la interpretación le corresponde a
  Silence Laboratories.
- El texto completo de la licencia viene con el paquete, en
  `node_modules/@silencelaboratories/dkls-wasm-ll-node/LICENSE.md`. Léelo antes de reutilizar este código.

El resto de la carpeta (el contrato `Multifirma.sol` y los pasos 1, 2, 3 y 7) no usa esa librería.

La librería no fue modificada. Se usa tal como se publica en npm, versión 1.2.0.
