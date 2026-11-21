# Ethereum reentrancy attack lab

Version: `2.0.44-alpha.2`

Copy `templates/` into `.tmp/reentrancy-lab` and run the tests with traces. No public network is required or allowed.

```bash
mkdir -p .tmp/reentrancy-lab
cp -R clasicos/ethereum-reentrancy-attack-lab/templates/. .tmp/reentrancy-lab/
cd .tmp/reentrancy-lab
forge test -vvvv
```

Compare the two traces:

- `testAttackDrainsVulnerableVault`: `receive` re-enters `VulnerableVault::withdraw` before the balance is zeroed; the vault ends at 0 and the attacker with 4 ETH.
- `testSafeVaultPreservesOtherDeposits`: the same attacker hits `SafeVault`; the nested `withdraw` reverts with `reentrant`, the whole attack reverts with `send`, and the vault keeps 3 ETH.

Evidence: failing invariant, call trace, balances before/after, mitigation and cleanup confirmation.

Cleanup: `rm -rf .tmp/reentrancy-lab`.
