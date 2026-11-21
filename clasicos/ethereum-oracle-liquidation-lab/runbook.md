# Ethereum oracle and liquidation lab

Version: `2.0.44-alpha.2`

Copy the fixture into `.tmp/oracle-liquidation-lab`, run `forge test -vv`, then inspect the stale-price and manipulated-price cases separately.

```bash
mkdir -p .tmp/oracle-liquidation-lab
cp -R clasicos/ethereum-oracle-liquidation-lab/templates/. .tmp/oracle-liquidation-lab/
cd .tmp/oracle-liquidation-lab
forge test -vv
forge test -vvvv --match-test testPriceChangesLiquidationDecision
forge test -vvvv --match-test testStalePriceReverts
```

- Manipulated price: `MockPriceFeed::set` has no access control, so whoever writes the price decides who is liquidatable (200 → healthy, 100 → `liquidatable` returns `true`).
- Stale price: a price older than `MAX_AGE` makes `healthAt` revert with `stale price` instead of returning a number.

The mock exists to expose assumptions. It is not a production oracle implementation.

Cleanup: `rm -rf .tmp/oracle-liquidation-lab`.
