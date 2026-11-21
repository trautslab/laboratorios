# Consensus benchmark fixture

Version: `2.0.44-alpha.4`

Run `node clasicos/consensus-benchmark/simulate.mjs`. The fixture compares recovery and latency signals under three deterministic scenarios. It is a pedagogy harness, not a performance claim about HotStuff or any production implementation.

Record safety violations, committed views, recovery views and median latency. No network sockets or external nodes are used.
