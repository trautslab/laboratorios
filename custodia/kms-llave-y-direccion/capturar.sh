#!/usr/bin/env bash
# Ejecuta el laboratorio completo, en Node y en Rust, y guarda la salida real de cada paso.
# El emulador de KMS (Floci, puerto 4566) debe estar corriendo: esta captura no lo arranca ni lo apaga.
set -euo pipefail
cd "$(dirname "$0")/.."
source lib/captura.sh
lab=kms-llave-y-direccion
pasos="1-crear-llave 2-describir 3-llave-publica 4-direccion 5-comprobar"

# Se suelta el alias de una captura anterior (solo el de este laboratorio): así Node crea la
# llave y Rust la reutiliza, que es lo que ve quien sigue una pestaña y después la otra.
node --input-type=module -e "
import { DeleteAliasCommand, KMSClient } from '@aws-sdk/client-kms';
const kms = new KMSClient({ endpoint: 'http://localhost:4566', region: 'us-east-1', credentials: { accessKeyId: 'test', secretAccessKey: 'test' } });
await kms.send(new DeleteAliasCommand({ AliasName: 'alias/ruta-kms-llave-y-direccion' })).catch((error) => { if (error.name !== 'NotFoundException') throw error; });
"

for paso in $pasos; do correr "$lab/evidence/node/$paso.txt" node "$lab/$paso.mjs"; done
arrancar_cadena
recortar_arranque > "$lab/evidence/6-anvil.txt"
correr "$lab/evidence/node/6-saldo.txt" node "$lab/6-saldo.mjs"
apagar_cadena

# Rust usa la misma llave (el alias ya existe) y una cadena nueva: el saldo vuelve a empezar en 0.
compilar_rust kms_llave_y_direccion
for paso in $pasos; do correr "$lab/evidence/rust/$paso.txt" "$rust_bin/kms_llave_y_direccion_p${paso%%-*}"; done
arrancar_cadena
correr "$lab/evidence/rust/6-saldo.txt" "$rust_bin/kms_llave_y_direccion_p6"

comparar_node_y_rust "$lab"
