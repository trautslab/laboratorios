# Laboratorio del bootcamp: huella, Merkle, firma, cadena permisionada y verificador

Guía: https://lab.trautslab.dev/bootcamp-blockchain-r7m4 (texto en `lib/bootcampLabRunbook.ts`, en la raíz del repo).
Todo corre en tu máquina, sin red y sin dinero. Cada paso existe en Node y en Rust e imprime lo mismo.

```bash
npm install                      # viem, @noble/*, OpenZeppelin, y forge + anvil de Foundry por npm
node 1-huella.mjs                # SHA-256 y Keccak-256; un carácter cambia la mitad de los bits
node 2-merkle.mjs                # 8 documentos → raíz; prueba de 3 hermanos; mutar una hoja
node 3-firma.mjs                 # llave fija → pública → dirección; firma r, s, v; recuperar; alterar
node 4-cadena.mjs                # 3 bloques firmados por validadores; el verificador rechaza 2 casos
npx forge build --root contratos && npx forge test --root contratos
npx anvil                        # en otra terminal
npx forge create --root contratos --rpc-url http://127.0.0.1:8545 --broadcast \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 src/Registro.sol:Registro
node 5-registrar.mjs             # registra la raíz y verifica pruebas en el contrato
```

Rust: `cd rust && cargo run -q --bin bootcamp_p1` (… `bootcamp_p5`; el paso 5 necesita antes `forge build`).

`bash capturar.sh` corre todo (Node, forge y Rust, con una Anvil nueva por variante), escribe `evidence/`
y compara las salidas de Node y Rust. Las llaves del código son de prueba: la llave de la cuenta 0 de
Anvil es pública y las demás se fijaron para que la salida se repita. No las uses fuera del laboratorio.
