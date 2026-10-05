# Architecture

```mermaid
flowchart LR
  Agent --> Transport
  Transport --> Server
  Server --> Registry
  Registry --> Tool
  Tool --> Cache
  Cache --> Limiter
  Limiter --> Breaker
  Breaker --> Upstream
  Upstream --> Validate
  Validate --> Normalize
```

Agents call tools through stdio or Streamable HTTP. Each tool validates input, checks cache, rate-limits upstream calls, validates upstream JSON (drift detection), then normalizes output.
