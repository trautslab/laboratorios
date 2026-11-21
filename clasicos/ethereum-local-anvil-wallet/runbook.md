# Lab: Ethereum local con Anvil, wallet y primera transacción

SemVer: `1.0.51-alpha.1`

Este archivo acompaña la página pública `/labs/ethereum-local-anvil-wallet`. La regla del lab es simple: mirar una transición de estado local antes/después y guardar evidencia verificable.

## Límite de seguridad

- Red local con Anvil.
- Sin private keys reales.
- Sin RPC de mainnet.
- Sin testnets con fondos.
- Sin seed phrases personales.

## Preflight

```bash
node clasicos/ethereum-local-anvil-wallet/preflight.mjs
```

Debe confirmar:

- `anvil` disponible;
- `cast` disponible;
- puerto `8545` libre;
- no hay variables obvias con secretos reales.

## Terminal A: cadena local

```bash
anvil --host 127.0.0.1 --port 8545 --chain-id 31337
```

## Terminal B: lectura inicial

PowerShell:

```powershell
$env:RPC_URL="http://127.0.0.1:8545"
$env:FROM="0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
$env:TO="0x70997970c51812dc3a010c7d01b50e0d17dc79c8"

cast chain-id --rpc-url $env:RPC_URL
cast block-number --rpc-url $env:RPC_URL
cast balance $env:FROM --ether --rpc-url $env:RPC_URL
cast balance $env:TO --ether --rpc-url $env:RPC_URL
cast nonce $env:FROM --rpc-url $env:RPC_URL
```

Bash:

```bash
export RPC_URL="http://127.0.0.1:8545"
export FROM="0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
export TO="0x70997970c51812dc3a010c7d01b50e0d17dc79c8"

cast chain-id --rpc-url $RPC_URL
cast block-number --rpc-url $RPC_URL
cast balance $FROM --ether --rpc-url $RPC_URL
cast balance $TO --ether --rpc-url $RPC_URL
cast nonce $FROM --rpc-url $RPC_URL
```

## Enviar transferencia

```powershell
cast send $env:TO --value 1ether --from $env:FROM --unlocked --rpc-url $env:RPC_URL
```

En Bash el comando es el mismo con `$TO`, `$FROM` y `$RPC_URL`. Guarda el `transactionHash`.

## Validar

```powershell
cast receipt <TX_HASH> status --rpc-url $env:RPC_URL
cast receipt <TX_HASH> gasUsed --rpc-url $env:RPC_URL
cast balance $env:FROM --ether --rpc-url $env:RPC_URL
cast balance $env:TO --ether --rpc-url $env:RPC_URL
cast nonce $env:FROM --rpc-url $env:RPC_URL
```

## Reporte mínimo

```markdown
# Lab: Anvil wallet

- chainId:
- from:
- to:
- nonce antes/después:
- balance antes/después:
- tx hash:
- receipt status:
- observación:
- cleanup realizado:
```

## Cleanup

PowerShell:

```powershell
Remove-Item Env:RPC_URL, Env:FROM, Env:TO -ErrorAction SilentlyContinue
```

Bash:

```bash
unset RPC_URL FROM TO
```

Detén Anvil con `Ctrl+C`.
