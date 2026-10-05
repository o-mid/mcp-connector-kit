# ADR 0002: Connector error taxonomy

All failures map to stable `ConnectorError` codes with agent-facing hints. Legacy servers can enable `MCK_LEGACY_ERRORS` for `{ error: string }` compatibility.
