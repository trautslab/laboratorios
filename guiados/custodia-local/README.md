# Laboratorios de custodia en local

Código de los laboratorios guiados de custodia de [lab.trautslab.dev](https://lab.trautslab.dev).
Todo corre en tu máquina: Anvil es la cadena y Floci emula el KMS de AWS. No hace falta ninguna
cuenta de nube ni dinero real.

| Carpeta | Laboratorio | Página |
|---|---|---|
| `a-retiro/` | Mini custodio: un retiro de punta a punta | https://lab.trautslab.dev/custodia-retiro-kms-anvil |
| `b-tesoreria/` | Tesorería hot y warm: barridos, bandas y aprobaciones | https://lab.trautslab.dev/custodia-tesoreria-hot-warm |
| `d-kyt/` | KYT antes de firmar: seguir el dinero a dos saltos | https://lab.trautslab.dev/custodia-kyt-antes-de-firmar |

## Arranque

```bash
npm install
npx anvil                                                    # Terminal 1: la cadena
docker run -d --name floci -p 4566:4566 floci/floci:2.5.0    # Terminal 2: el llavero
node a-retiro/01-cadena.mjs                                  # y sigue los pasos de la página
```

## Evidencia

Las salidas que muestra la página están en `evidence/`. Se regeneran con una cadena recién
arrancada y el llavero corriendo:

```bash
./capturar-evidencia.sh a-retiro
```

Después hay que sincronizar el contenido del lab desde la raíz del repositorio:
`npm run sync:lab-content`.

## Límite de seguridad

Las credenciales de AWS del código son ficticias a propósito (`lib/config.mjs`) y la cadena es
local. No uses aquí llaves, frases semilla ni credenciales reales.
