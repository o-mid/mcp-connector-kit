/** Stable failure codes agents can branch on without parsing HTTP bodies. */
export type ConnectorErrorCode =
  | "invalid_input"
  | "upstream_rate_limited"
  | "upstream_unavailable"
  | "upstream_timeout"
  | "upstream_schema_changed"
  | "not_found"
  | "blocked_host"
  | "internal";

export type ConnectorErrorPayload = {
  code: ConnectorErrorCode;
  message: string;
  hint: string;
  retryable: boolean;
  source?: string;
};

/**
 * Typed connector failure so MCP layers never leak raw stack traces upstream.
 */
export class ConnectorError extends Error {
  readonly code: ConnectorErrorCode;
  readonly hint: string;
  readonly retryable: boolean;
  readonly source: string | undefined;

  constructor(
    code: ConnectorErrorCode,
    message: string,
    opts?: { hint?: string; retryable?: boolean; source?: string; cause?: unknown },
  ) {
    super(message, { cause: opts?.cause });
    this.name = "ConnectorError";
    this.code = code;
    this.hint = opts?.hint ?? defaultHint(code);
    this.retryable = opts?.retryable ?? defaultRetryable(code);
    this.source = opts?.source;
  }

  toPayload(): ConnectorErrorPayload {
    const payload: ConnectorErrorPayload = {
      code: this.code,
      message: this.message,
      hint: this.hint,
      retryable: this.retryable,
    };
    if (this.source !== undefined) {
      payload.source = this.source;
    }
    return payload;
  }
}

function defaultHint(code: ConnectorErrorCode): string {
  switch (code) {
    case "invalid_input":
      return "Fix the tool arguments and try again.";
    case "upstream_rate_limited":
      return "Retry after a short wait or narrow the query.";
    case "upstream_unavailable":
      return "The upstream source is unreachable; try again later.";
    case "upstream_timeout":
      return "The request timed out; try again with a simpler query.";
    case "upstream_schema_changed":
      return "The source changed its format; results were withheld.";
    case "not_found":
      return "No matching record was found.";
    case "blocked_host":
      return "Request was blocked by the connector host policy.";
    default:
      return "An internal error occurred.";
  }
}

function defaultRetryable(code: ConnectorErrorCode): boolean {
  return (
    code === "upstream_rate_limited" ||
    code === "upstream_unavailable" ||
    code === "upstream_timeout"
  );
}

export function isConnectorError(err: unknown): err is ConnectorError {
  return err instanceof ConnectorError;
}
