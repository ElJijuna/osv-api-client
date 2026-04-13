/**
 * Thrown when the OSV API returns a non-2xx response.
 *
 * @example
 * ```typescript
 * import { OsvApiError } from 'osv-api-client';
 *
 * try {
 *   await osv.vuln('INVALID-ID').get();
 * } catch (err) {
 *   if (err instanceof OsvApiError) {
 *     console.log(err.status);     // 404
 *     console.log(err.statusText); // 'Not Found'
 *     console.log(err.message);    // 'OSV API error: 404 Not Found'
 *   }
 * }
 * ```
 */
export class OsvApiError extends Error {
  /** HTTP status code (e.g. `404`, `400`, `500`) */
  readonly status: number;
  /** HTTP status text (e.g. `'Not Found'`, `'Bad Request'`) */
  readonly statusText: string;

  constructor(status: number, statusText: string) {
    super(`OSV API error: ${status} ${statusText}`);
    this.name = 'OsvApiError';
    this.status = status;
    this.statusText = statusText;
  }
}
