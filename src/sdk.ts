import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { calculateBackoffDelay } from './backoff';
import { GuardiianoNetworkError, GuardiianoSDKError } from './errors';

export interface DataSubject<T = unknown> {
  id: string;
  dsToken: string;
  data: T;
  createdAt: string;
  updatedAt: string;
}

export { GuardiianoNetworkError, GuardiianoSDKError };

export interface Action<M = unknown> {
  userId: string;
  actionType: string;
  timestamp: string;
  payload: M;
}

export function isDataSubject(obj: unknown): obj is DataSubject {
  if (typeof obj !== 'object' || obj === null) return false;

  const record = obj as Record<string, unknown>;
  return (
    typeof record.id === 'string' &&
    typeof record.dsToken === 'string' &&
    'data' in record &&
    typeof record.createdAt === 'string' &&
    typeof record.updatedAt === 'string'
  );
}

export interface GuardiianoSDKApi {
  postAction<M>(params: { action: Action<M>; withRetry?: boolean }): Promise<void>;
  identifyDataSubject<T>(params: { username: string; data: T; withRetry?: boolean }): Promise<DataSubject<T>>;
  getDataSubject<T = unknown>(params: { token: string; withRetry?: boolean }): Promise<DataSubject<T>>;
  getMetrics<T = unknown>(params?: { withRetry?: boolean }): Promise<T>;
}

interface RetryConfig {
  withRetry: boolean;
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
  jitterMs: number;
  retryableStatusCodes: Set<number>;
}

export interface RetryOptions {
  withRetry?: boolean;
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
  jitterMs?: number;
  retryableStatusCodes?: number[];
}

export function createGuardiianoSDK(baseUrl: string, options?: RetryOptions): GuardiianoSDKApi {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
  const retryConfig: RetryConfig = {
    withRetry: options?.withRetry ?? true,
    maxRetries: options?.maxRetries ?? 3,
    baseDelayMs: options?.baseDelayMs ?? 200,
    maxDelayMs: options?.maxDelayMs ?? 2000,
    backoffFactor: options?.backoffFactor ?? 2,
    jitterMs: options?.jitterMs ?? options?.baseDelayMs ?? 200,
    retryableStatusCodes: new Set(options?.retryableStatusCodes ?? [408, 429, 500, 502, 503, 504]),
  };

  async function sleepWithBackoff(
    attempt: number,
    baseDelayMs: number,
    maxDelayMs: number,
    backoffFactor: number,
    jitterMs: number,
  ) {
    const delay = calculateBackoffDelay(attempt, baseDelayMs, maxDelayMs, backoffFactor, jitterMs);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  function isNetworkError(error: unknown) {
    return error instanceof TypeError;
  }

  async function parseErrorBody(response: Response): Promise<unknown> {
    try {
      const text = await response.text();
      if (!text) return undefined;
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    } catch {
      return undefined;
    }
  }

  function parseHeaders(response: Response): Record<string, string> {
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    return headers;
  }

  function getRequestId(response: Response): string | undefined {
    return response.headers.get('x-request-id') ?? response.headers.get('x-requestid') ?? undefined;
  }

  function getCorrelationId(response: Response): string | undefined {
    return response.headers.get('x-correlation-id') ?? response.headers.get('x-correlationid') ?? undefined;
  }

  function getTraceHeaders(response: Response) {
    return {
      traceparent: response.headers.get('traceparent') ?? undefined,
      tracestate: response.headers.get('tracestate') ?? undefined,
      baggage: response.headers.get('baggage') ?? undefined,
      xAmznTraceId: response.headers.get('x-amzn-trace-id') ?? undefined,
      xB3TraceId: response.headers.get('x-b3-traceid') ?? undefined,
      xB3SpanId: response.headers.get('x-b3-spanid') ?? undefined,
      xB3ParentSpanId: response.headers.get('x-b3-parentspanid') ?? undefined,
      xB3Sampled: response.headers.get('x-b3-sampled') ?? undefined,
      xB3Flags: response.headers.get('x-b3-flags') ?? undefined,
      xOtSpanContext: response.headers.get('x-ot-span-context') ?? undefined,
    };
  }

  async function request<T>(path: string, options: RequestInit, withRetry: boolean): Promise<T> {
    const { maxRetries, baseDelayMs, maxDelayMs, backoffFactor, jitterMs, retryableStatusCodes } = retryConfig;
    const canRetry = retryConfig.withRetry && withRetry;

    for (let attempt = 0; attempt <= (canRetry ? maxRetries : 0); attempt += 1) {
      try {
        const response = await fetch(`${normalizedBaseUrl}${path}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });

        if (!response.ok) {
          const responseBody = await parseErrorBody(response);
          const responseHeaders = parseHeaders(response);
          const requestId = getRequestId(response);
          const correlationId = getCorrelationId(response);
          const traceHeaders = getTraceHeaders(response);
          const shouldRetry = retryableStatusCodes.has(response.status);
          if (canRetry && shouldRetry && attempt < maxRetries) {
            await sleepWithBackoff(attempt, baseDelayMs, maxDelayMs, backoffFactor, jitterMs);
            continue;
          }
          throw new GuardiianoSDKError(
            response.status,
            response.statusText,
            responseBody,
            responseHeaders,
            requestId,
            correlationId,
            traceHeaders.traceparent,
            traceHeaders.tracestate,
            traceHeaders.baggage,
            traceHeaders.xAmznTraceId,
            traceHeaders.xB3TraceId,
            traceHeaders.xB3SpanId,
            traceHeaders.xB3ParentSpanId,
            traceHeaders.xB3Sampled,
            traceHeaders.xB3Flags,
            traceHeaders.xOtSpanContext,
          );
        }

        if (response.status === 204) return {} as T;
        return response.json() as Promise<T>;
      } catch (error) {
        if (isNetworkError(error)) {
          const networkError = new GuardiianoNetworkError(error instanceof Error ? error.message : 'Network error');
          if (!canRetry || attempt >= maxRetries) {
            throw networkError;
          }
          await sleepWithBackoff(attempt, baseDelayMs, maxDelayMs, backoffFactor, jitterMs);
          continue;
        }
        if (!canRetry || attempt >= maxRetries) {
          throw error;
        }
        await sleepWithBackoff(attempt, baseDelayMs, maxDelayMs, backoffFactor, jitterMs);
      }
    }

    throw new Error('Unexpected error: retry loop exited without returning.');
  }

  return {
    async postAction<M>({ action, withRetry = true }: { action: Action<M>; withRetry?: boolean }) {
      await request<void>(
        '/actions',
        {
          method: 'POST',
          body: JSON.stringify(action),
        },
        withRetry,
      );
    },

    async identifyDataSubject<T>({
      username,
      data,
      withRetry = true,
    }: {
      username: string;
      data: T;
      withRetry?: boolean;
    }): Promise<DataSubject<T>> {
      return request<DataSubject<T>>(
        '/data-subjects',
        {
          method: 'POST',
          body: JSON.stringify({ username, data }),
        },
        withRetry,
      );
    },

    async getDataSubject<T = unknown>({
      token,
      withRetry = true,
    }: {
      token: string;
      withRetry?: boolean;
    }): Promise<DataSubject<T>> {
      return request<DataSubject<T>>(
        `/data-subjects/${token}`,
        {
          method: 'GET',
        },
        withRetry,
      );
    },

    async getMetrics<T = unknown>({ withRetry = true }: { withRetry?: boolean } = {}): Promise<T> {
      return request<T>('/metrics', { method: 'GET' }, withRetry);
    },
  };
}

declare module 'fastify' {
  interface FastifyInstance {
    guardiiano: GuardiianoSDKApi;
  }
}

interface GuardiianoPluginOptions {
  baseUrl: string;
  retry?: RetryOptions;
}

async function guardiianoSdkPlugin(fastify: FastifyInstance, options: GuardiianoPluginOptions) {
  const sdk = createGuardiianoSDK(options.baseUrl, options.retry);
  fastify.decorate('guardiiano', sdk);
}

export default fp(guardiianoSdkPlugin, {
  name: 'guardiiano-sdk',
  fastify: '4.x - 5.x',
});
