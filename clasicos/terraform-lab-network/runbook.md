# Terraform lab network contract

Version: `3.7.0-alpha.2`

Run `node clasicos/terraform-lab-network/validate-plan.mjs` before using any real provider. The committed plan is deliberately local and has no public ingress, credentials or billable resources.

The deterministic fixture also exposes four companion exercises:

```bash
node clasicos/terraform-lab-network/validate-plan.mjs state
node clasicos/terraform-lab-network/validate-plan.mjs modules
node clasicos/terraform-lab-network/validate-plan.mjs policy
node clasicos/terraform-lab-network/validate-plan.mjs recovery
```

- `state`: versioning, encryption, locking and restore rehearsal.
- `modules`: typed inputs, bounded outputs and explicit providers.
- `policy`: plan evidence, cost ceiling, allowlist and private ingress.
- `recovery`: state copy, lock ownership, remote comparison and post-import plan.

A future provider-backed exercise must preserve every fixture invariant, show the plan before apply and execute the declared destroy step.
