export { OsvClient } from './OsvClient';
export { OsvApiError } from './errors/OsvApiError';
export type { OsvClientOptions, RequestEvent, OsvClientEvents } from './OsvClient';
export { VulnerabilityResource } from './resources/VulnerabilityResource';
export type {
  OsvVulnerability,
  OsvPackageIdentifier,
  OsvEcosystem,
  OsvAffected,
  OsvRange,
  OsvRangeEvent,
  OsvReference,
  OsvSeverity,
  OsvCredit,
} from './domain/Vulnerability';
export type {
  OsvQueryParams,
  OsvQueryResult,
  OsvBatchQuery,
  OsvBatchQueryParams,
  OsvBatchQueryResult,
  OsvBatchResultEntry,
} from './domain/Query';
