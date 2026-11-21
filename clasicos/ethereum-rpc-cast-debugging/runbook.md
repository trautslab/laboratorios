# Ethereum RPC + Cast debugging

Version: `2.0.44-alpha.1`

## Boundary

Use only `http://127.0.0.1:8545` with an ephemeral Anvil instance. Never paste a personal private key or public RPC credential.

## Start

```powershell
node clasicos/ethereum-rpc-cast-debugging/preflight.mjs
anvil --host 127.0.0.1 --port 8545 --chain-id 31337
```

In a second terminal:

```powershell
$env:RPC_URL="http://127.0.0.1:8545"
cast chain-id --rpc-url $env:RPC_URL
cast block-number --rpc-url $env:RPC_URL
cast rpc eth_getBlockByNumber latest false --rpc-url $env:RPC_URL
```

Bash equivalent:

```bash
export RPC_URL="http://127.0.0.1:8545"
cast chain-id --rpc-url $RPC_URL
cast block-number --rpc-url $RPC_URL
cast rpc eth_getBlockByNumber latest false --rpc-url $RPC_URL
```

Then provoke one failure per layer:

```bash
cast block-number --rpc-url http://127.0.0.1:8546            # transport: Connection refused
cast rpc eth_foo --rpc-url $RPC_URL                           # JSON-RPC: -32601 Method not found
cast rpc eth_call '{"data":"0x60006000fd"}' latest --rpc-url $RPC_URL   # EVM: code 3 execution reverted
```

Record endpoint, method, parameters, result or error, and the layer responsible: transport, JSON-RPC, or EVM.

## Cleanup

Stop Anvil with `Ctrl+C` and remove `RPC_URL` from the environment (`unset RPC_URL` in Bash).
