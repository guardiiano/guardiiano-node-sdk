export class GuardiianoSDKError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly responseBody?: unknown;
  readonly responseHeaders?: Record<string, string>;
  readonly requestId?: string;
  readonly correlationId?: string;
  readonly traceparent?: string;
  readonly tracestate?: string;
  readonly baggage?: string;
  readonly xAmznTraceId?: string;
  readonly xB3TraceId?: string;
  readonly xB3SpanId?: string;
  readonly xB3ParentSpanId?: string;
  readonly xB3Sampled?: string;
  readonly xB3Flags?: string;
  readonly xOtSpanContext?: string;
  readonly code: 'ERR_HTTP';
  trace(): string {
    const parts = [
      this.requestId ? `requestId=${this.requestId}` : undefined,
      this.correlationId ? `correlationId=${this.correlationId}` : undefined,
      this.traceparent ? `traceparent=${this.traceparent}` : undefined,
      this.tracestate ? `tracestate=${this.tracestate}` : undefined,
      this.baggage ? `baggage=${this.baggage}` : undefined,
      this.xAmznTraceId ? `x-amzn-trace-id=${this.xAmznTraceId}` : undefined,
      this.xB3TraceId ? `x-b3-traceid=${this.xB3TraceId}` : undefined,
      this.xB3SpanId ? `x-b3-spanid=${this.xB3SpanId}` : undefined,
      this.xB3ParentSpanId ? `x-b3-parentspanid=${this.xB3ParentSpanId}` : undefined,
      this.xB3Sampled ? `x-b3-sampled=${this.xB3Sampled}` : undefined,
      this.xB3Flags ? `x-b3-flags=${this.xB3Flags}` : undefined,
      this.xOtSpanContext ? `x-ot-span-context=${this.xOtSpanContext}` : undefined,
    ];

    return parts.filter(Boolean).join(' ');
  }

  constructor(
    status: number,
    statusText: string,
    responseBody?: unknown,
    responseHeaders?: Record<string, string>,
    requestId?: string,
    correlationId?: string,
    traceparent?: string,
    tracestate?: string,
    baggage?: string,
    xAmznTraceId?: string,
    xB3TraceId?: string,
    xB3SpanId?: string,
    xB3ParentSpanId?: string,
    xB3Sampled?: string,
    xB3Flags?: string,
    xOtSpanContext?: string,
    message?: string,
  ) {
    super(message ?? `API Error: ${status} ${statusText}`);
    this.status = status;
    this.statusText = statusText;
    this.responseBody = responseBody;
    this.responseHeaders = responseHeaders;
    this.requestId = requestId;
    this.correlationId = correlationId;
    this.traceparent = traceparent;
    this.tracestate = tracestate;
    this.baggage = baggage;
    this.xAmznTraceId = xAmznTraceId;
    this.xB3TraceId = xB3TraceId;
    this.xB3SpanId = xB3SpanId;
    this.xB3ParentSpanId = xB3ParentSpanId;
    this.xB3Sampled = xB3Sampled;
    this.xB3Flags = xB3Flags;
    this.xOtSpanContext = xOtSpanContext;
    this.code = 'ERR_HTTP';
  }
}

export class GuardiianoNetworkError extends Error {
  readonly code: 'ERR_NETWORK';

  constructor(message = 'Network error') {
    super(message);
    this.code = 'ERR_NETWORK';
  }
}
