# Ethereum storage layout lab

Version: `2.0.44-alpha.1`

Copy `templates/` into `.tmp/storage-layout-lab`, then run (from the repository root):

```bash
node clasicos/ethereum-storage-layout-lab/preflight.mjs
mkdir -p .tmp/storage-layout-lab
cp -R clasicos/ethereum-storage-layout-lab/templates/. .tmp/storage-layout-lab/
cd .tmp/storage-layout-lab
forge inspect StorageLab storageLayout
forge inspect StorageLabUnsafeV2 storageLayout
forge test -vv
```

Compare the slot, offset, byte width and type of every field. The unsafe V2 intentionally changes the first slots; it is evidence, not a deployment recommendation.

The test reads raw slots with `sload` and checks the exact packed words: slot 0 = `owner | counter << 160`, slot 1 = `enabled | mode << 8`, and `credits[deployer]` at `keccak256(abi.encode(deployer, 2))`.

Cleanup removes `.tmp/storage-layout-lab` (`rm -rf .tmp/storage-layout-lab`). No Anvil process is needed for this lab.
