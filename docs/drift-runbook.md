# Schema drift runbook

When Wikipedia, GitHub, or another upstream changes response JSON, tools start failing with `upstream_schema_changed`. This is intentional: the gateway refuses to guess.

## Detect

1. **`/readyz`** — source shows `degraded` or `failing`.
2. **Metrics** — `mck_schema_drift_total{source="..."}` increases.
3. **Logs** — `tool_call_end` with `outcome: error` and drift code in the payload.
4. **CI** — `pnpm mck check` or source `contract.test.ts` fails after you refresh fixtures.

## Triage

| Signal | Likely cause |
|--------|----------------|
| Single tool fails | Field rename or nested shape change on that endpoint |
| All tools on source fail | Base URL, auth, or global API version change |
| Intermittent | Upstream rate limit or breaker (check `mck_breaker_state`) |

## Fix

1. Reproduce with live call: `MCK_LIVE=1 pnpm mck record <source> <tool> --input '{...}'`.
2. Update `upstream` Zod in the tool definition in `source.ts`.
3. Adjust `api.ts` mapping if needed.
4. Update `fixtures/*.contract.json` mocks and expected `output`.
5. Run `pnpm check` and `pnpm mck check .`.
6. Ship source package + redeploy gateway if you bumped dependencies.

## Prevent regressions

- Keep one contract fixture per tool with mocked HTTP.
- For high-churn APIs, shorten cache TTL temporarily while validating a fix.
- Watch `mck_schema_drift_total` in Grafana ([slo.md](./slo.md)).

## Related

- [ADR-0003](./adr/0003-upstream-schema-drift.md)
- [adding-a-source.md](./adding-a-source.md)
