# ADR 0003: Drift detection

Every upstream response is validated with the tool `upstream` Zod schema before normalization. Failures increment `mck_schema_drift_total` and withhold results.
