# Lab ERC-20 con Foundry

Versión: `1.3.0-alpha.1`

## Objetivo

Construir un ERC-20 mínimo, probar transferencias y allowances, desplegarlo en Anvil y documentar evidencia sin tocar redes ni claves reales.

## Límite de seguridad

- Red local únicamente.
- No usar seed phrases ni private keys reales.
- No apuntar `RPC_URL` a mainnet, Sepolia, Holesky ni proveedores externos.
- El fixture temporal vive en `.tmp/erc20-foundry-lab` y debe eliminarse al final.

## Ejecución corta

```bash
node clasicos/ethereum-erc20-foundry-lab/preflight.mjs
mkdir -p .tmp/erc20-foundry-lab
cp clasicos/ethereum-erc20-foundry-lab/templates/foundry.toml .tmp/erc20-foundry-lab/foundry.toml
cp -R clasicos/ethereum-erc20-foundry-lab/templates/src .tmp/erc20-foundry-lab/src
cp -R clasicos/ethereum-erc20-foundry-lab/templates/test .tmp/erc20-foundry-lab/test
cd .tmp/erc20-foundry-lab
forge build
forge test -vv
```

Luego levanta Anvil en otra terminal:

```bash
anvil --host 127.0.0.1 --port 8545 --chain-id 31337
```

Despliega con la clave prefundida de Anvil (cuenta 0, pública y solo válida en Anvil) y consulta con Cast desde `.tmp/erc20-foundry-lab`:

```bash
export RPC_URL=http://127.0.0.1:8545
export PK=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
export FROM=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
export TO=0x70997970C51812dc3A010C7d01b50e0d17dc79C8
forge create src/LabToken.sol:LabToken --rpc-url $RPC_URL --private-key $PK --broadcast --constructor-args "TrautsLab Token" TLAB 1000000
export TOKEN=<Deployed to>
cast call $TOKEN "totalSupply()(uint256)" --rpc-url $RPC_URL
cast call $TOKEN "balanceOf(address)(uint256)" $TO --rpc-url $RPC_URL
cast send $TOKEN "transfer(address,uint256)" $TO 100ether --private-key $PK --rpc-url $RPC_URL
cast call $TOKEN "balanceOf(address)(uint256)" $FROM --rpc-url $RPC_URL
cast call $TOKEN "balanceOf(address)(uint256)" $TO --rpc-url $RPC_URL
```

Para la nota sobre approvals:

```bash
cast send $TOKEN "approve(address,uint256)" $TO 50ether --private-key $PK --rpc-url $RPC_URL
cast call $TOKEN "allowance(address,address)(uint256)" $FROM $TO --rpc-url $RPC_URL
cast send $TOKEN "transferFrom(address,address,uint256)" $FROM $TO 50ether --from $TO --unlocked --rpc-url $RPC_URL
cast call $TOKEN "allowance(address,address)(uint256)" $FROM $TO --rpc-url $RPC_URL
```

## Evidencia mínima

- versiones de `forge`, `anvil`, `cast`;
- salida de `forge test`;
- dirección del contrato;
- hash de deployment;
- hash de transferencia;
- balances antes/después;
- nota breve sobre el riesgo de approvals.

## Cleanup

```bash
rm -rf .tmp/erc20-foundry-lab
unset RPC_URL PK TOKEN FROM TO
```
