import type { OsvPackageIdentifier, OsvVulnerability } from './Vulnerability';

/**
 * Parameters for a single vulnerability query (`POST /v1/query`).
 *
 * Provide either `package` + `version` to query by package version, or
 * `commit` to query by a specific git commit hash.
 *
 * @example
 * ```typescript
 * // Query by package + version
 * const result = await osv.query({
 *   package: { name: 'lodash', ecosystem: 'npm' },
 *   version: '4.17.20',
 * });
 *
 * // Query by git commit
 * const result = await osv.query({ commit: 'abc123...' });
 * ```
 */
export interface OsvQueryParams {
  /** Git commit hash to query vulnerabilities for */
  commit?: string;
  /** Package version string to query vulnerabilities for */
  version?: string;
  /** Package to query — use alongside `version` */
  package?: OsvPackageIdentifier;
  /** Maximum number of results to return */
  page_size?: number;
  /** Token for retrieving the next page of results */
  page_token?: string;
}

/**
 * Response from `POST /v1/query`.
 */
export interface OsvQueryResult {
  /** List of vulnerabilities affecting the queried package/version */
  vulns?: OsvVulnerability[];
  /** Token for fetching the next page — absent if no more results */
  next_page_token?: string;
}

/**
 * A single query entry within a batch request.
 */
export interface OsvBatchQuery {
  /** Git commit hash to query vulnerabilities for */
  commit?: string;
  /** Package version string to query vulnerabilities for */
  version?: string;
  /** Package to query — use alongside `version` */
  package?: OsvPackageIdentifier;
}

/**
 * Parameters for a batch vulnerability query (`POST /v1/querybatch`).
 *
 * @example
 * ```typescript
 * const result = await osv.queryBatch([
 *   { package: { name: 'lodash', ecosystem: 'npm' }, version: '4.17.20' },
 *   { package: { name: 'express', ecosystem: 'npm' }, version: '4.17.1' },
 * ]);
 * ```
 */
export interface OsvBatchQueryParams {
  /** Array of individual queries to execute in a single request */
  queries: OsvBatchQuery[];
}

/**
 * A single result entry within a batch query response.
 */
export interface OsvBatchResultEntry {
  /** List of vulnerabilities for this query entry — empty array if none found */
  vulns?: OsvVulnerability[];
}

/**
 * Response from `POST /v1/querybatch`.
 *
 * Results are returned in the same order as the queries array.
 */
export interface OsvBatchQueryResult {
  /** One result per query, in the same order as the request */
  results: OsvBatchResultEntry[];
}
