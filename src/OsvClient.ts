import { OsvApiError } from './errors/OsvApiError';
import { VulnerabilityResource } from './resources/VulnerabilityResource';
import type {
  OsvQueryParams,
  OsvQueryResult,
  OsvBatchQueryParams,
  OsvBatchQueryResult,
  OsvBatchQuery,
} from './domain/Query';

const DEFAULT_BASE_URL = 'https://api.osv.dev';

/**
 * Payload emitted on every HTTP request made by {@link OsvClient}.
 */
export interface RequestEvent {
  /** Full URL that was requested */
  url: string;
  /** HTTP method used */
  method: 'GET' | 'POST';
  /** Timestamp when the request started */
  startedAt: Date;
  /** Timestamp when the request finished (success or error) */
  finishedAt: Date;
  /** Total duration in milliseconds */
  durationMs: number;
  /** HTTP status code returned by the server, if a response was received */
  statusCode?: number;
  /** Error thrown, if the request failed */
  error?: Error;
}

/** Map of supported client events to their callback signatures */
export interface OsvClientEvents {
  request: (event: RequestEvent) => void;
}

/**
 * Constructor options for {@link OsvClient}.
 */
export interface OsvClientOptions {
  /**
   * Base URL for the OSV API (default: `'https://api.osv.dev'`).
   * Override to point to a self-hosted or mirrored instance.
   */
  baseUrl?: string;
  /**
   * Bearer token for authenticated requests.
   * Not required for public read operations.
   */
  token?: string;
}

/**
 * Main entry point for the OSV (Open Source Vulnerabilities) API client.
 *
 * @example
 * ```typescript
 * import { OsvClient } from 'osv-api-client';
 *
 * const osv = new OsvClient();
 *
 * // Get a vulnerability by OSV ID (awaitable directly)
 * const vuln = await osv.vuln('GHSA-jfh8-c2jp-hdp8');
 * console.log(vuln.summary);
 *
 * // Query vulnerabilities affecting a specific package version
 * const result = await osv.query({
 *   package: { name: 'lodash', ecosystem: 'npm' },
 *   version: '4.17.20',
 * });
 *
 * // Batch query for multiple packages at once
 * const batch = await osv.queryBatch([
 *   { package: { name: 'lodash', ecosystem: 'npm' }, version: '4.17.20' },
 *   { package: { name: 'express', ecosystem: 'npm' }, version: '4.17.1' },
 * ]);
 * ```
 */
export class OsvClient {
  private readonly baseUrl: string;
  private readonly token?: string;
  private readonly listeners: Map<
    keyof OsvClientEvents,
    OsvClientEvents[keyof OsvClientEvents][]
  > = new Map();

  /**
   * @param options - Optional configuration for base URL and auth token
   */
  constructor(options: OsvClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');
    this.token = options.token;
  }

  /**
   * Subscribes to a client event.
   *
   * @example
   * ```typescript
   * osv.on('request', (event) => {
   *   console.log(`${event.method} ${event.url} — ${event.durationMs}ms`);
   *   if (event.error) console.error('Request failed:', event.error);
   * });
   * ```
   */
  on<K extends keyof OsvClientEvents>(event: K, callback: OsvClientEvents[K]): this {
    const callbacks = this.listeners.get(event) ?? [];
    callbacks.push(callback);
    this.listeners.set(event, callbacks);
    return this;
  }

  private emit<K extends keyof OsvClientEvents>(
    event: K,
    payload: Parameters<OsvClientEvents[K]>[0],
  ): void {
    const callbacks = this.listeners.get(event) ?? [];
    for (const cb of callbacks) {
      (cb as (p: typeof payload) => void)(payload);
    }
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  /**
   * Performs an HTTP request to the OSV API.
   *
   * @param path - API path (e.g. `/v1/vulns/GHSA-xxxx`)
   * @param body - Optional request body (triggers a POST when provided)
   * @param method - HTTP method — defaults to `'POST'` when body is present, `'GET'` otherwise
   * @internal
   */
  private async request<T>(
    path: string,
    body?: unknown,
    method: 'GET' | 'POST' = body !== undefined ? 'POST' : 'GET',
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const startedAt = new Date();
    let statusCode: number | undefined;
    try {
      const response = await fetch(url, {
        method,
        headers: this.buildHeaders(),
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      statusCode = response.status;
      if (!response.ok) {
        throw new OsvApiError(response.status, response.statusText);
      }
      const data = await response.json() as T;
      this.emit('request', {
        url,
        method,
        startedAt,
        finishedAt: new Date(),
        durationMs: Date.now() - startedAt.getTime(),
        statusCode,
      });
      return data;
    } catch (err) {
      const finishedAt = new Date();
      this.emit('request', {
        url,
        method,
        startedAt,
        finishedAt,
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        statusCode,
        error: err instanceof Error ? err : new Error(String(err)),
      });
      throw err;
    }
  }

  /**
   * Returns a {@link VulnerabilityResource} for a given OSV ID. The resource
   * can be awaited directly to fetch the full vulnerability record.
   *
   * `GET /v1/vulns/{id}`
   *
   * @param id - OSV vulnerability ID (e.g. `'GHSA-jfh8-c2jp-hdp8'`, `'CVE-2021-44228'`)
   * @returns A chainable vulnerability resource
   *
   * @example
   * ```typescript
   * const vuln = await osv.vuln('GHSA-jfh8-c2jp-hdp8');
   * console.log(vuln.summary);
   * console.log(vuln.severity);
   * ```
   */
  vuln(id: string): VulnerabilityResource {
    return new VulnerabilityResource(
      <T>(path: string, body?: unknown, method?: 'GET' | 'POST') =>
        this.request<T>(path, body, method),
      id,
    );
  }

  /**
   * Queries vulnerabilities affecting a specific package version or git commit.
   *
   * `POST /v1/query`
   *
   * @param params - Query parameters (package + version, or commit)
   * @returns Matching vulnerabilities and optional pagination token
   *
   * @example
   * ```typescript
   * const result = await osv.query({
   *   package: { name: 'lodash', ecosystem: 'npm' },
   *   version: '4.17.20',
   * });
   * result.vulns?.forEach(v => console.log(v.id, v.summary));
   * ```
   */
  async query(params: OsvQueryParams): Promise<OsvQueryResult> {
    return this.request<OsvQueryResult>('/v1/query', params);
  }

  /**
   * Queries vulnerabilities for multiple packages in a single request.
   *
   * `POST /v1/querybatch`
   *
   * Results are returned in the same order as the input queries array.
   *
   * @param queries - Array of individual query entries
   * @returns One result entry per query, in the same order
   *
   * @example
   * ```typescript
   * const batch = await osv.queryBatch([
   *   { package: { name: 'lodash', ecosystem: 'npm' }, version: '4.17.20' },
   *   { package: { name: 'express', ecosystem: 'npm' }, version: '4.17.1' },
   * ]);
   * batch.results.forEach((r, i) => {
   *   console.log(`Query ${i}: ${r.vulns?.length ?? 0} vulnerabilities`);
   * });
   * ```
   */
  async queryBatch(queries: OsvBatchQuery[]): Promise<OsvBatchQueryResult> {
    const body: OsvBatchQueryParams = { queries };
    return this.request<OsvBatchQueryResult>('/v1/querybatch', body);
  }
}
