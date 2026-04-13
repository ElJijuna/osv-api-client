import { OsvClient } from './OsvClient';
import { OsvApiError } from './errors/OsvApiError';
import type { OsvVulnerability } from './domain/Vulnerability';
import type { OsvQueryResult, OsvBatchQueryResult } from './domain/Query';

const mockVuln: OsvVulnerability = {
  id: 'GHSA-jfh8-c2jp-hdp8',
  schema_version: '1.0.0',
  modified: '2023-06-01T00:00:00Z',
  published: '2023-05-01T00:00:00Z',
  summary: 'Prototype pollution in lodash',
  affected: [
    {
      package: { name: 'lodash', ecosystem: 'npm' },
      ranges: [
        {
          type: 'SEMVER',
          events: [{ introduced: '0' }, { fixed: '4.17.21' }],
        },
      ],
    },
  ],
};

const mockQueryResult: OsvQueryResult = {
  vulns: [mockVuln],
};

const mockBatchResult: OsvBatchQueryResult = {
  results: [{ vulns: [mockVuln] }, { vulns: [] }],
};

function mockFetch(data: unknown, status = 200): jest.Mock {
  return jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: jest.fn().mockResolvedValue(data),
  });
}

describe('OsvClient', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('vuln()', () => {
    it('fetches a vulnerability by ID', async () => {
      global.fetch = mockFetch(mockVuln);
      const osv = new OsvClient();

      const result = await osv.vuln('GHSA-jfh8-c2jp-hdp8').get();

      expect(fetch).toHaveBeenCalledWith(
        'https://api.osv.dev/v1/vulns/GHSA-jfh8-c2jp-hdp8',
        expect.objectContaining({ method: 'GET' }),
      );
      expect(result).toEqual(mockVuln);
    });

    it('can be awaited directly (PromiseLike)', async () => {
      global.fetch = mockFetch(mockVuln);
      const osv = new OsvClient();

      const result = await osv.vuln('GHSA-jfh8-c2jp-hdp8');

      expect(result).toEqual(mockVuln);
    });

    it('throws OsvApiError on non-2xx response', async () => {
      global.fetch = mockFetch({}, 404);
      const osv = new OsvClient();

      await expect(osv.vuln('INVALID-ID').get()).rejects.toBeInstanceOf(OsvApiError);
    });
  });

  describe('query()', () => {
    it('sends POST /v1/query with package and version', async () => {
      global.fetch = mockFetch(mockQueryResult);
      const osv = new OsvClient();

      const result = await osv.query({
        package: { name: 'lodash', ecosystem: 'npm' },
        version: '4.17.20',
      });

      expect(fetch).toHaveBeenCalledWith(
        'https://api.osv.dev/v1/query',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            package: { name: 'lodash', ecosystem: 'npm' },
            version: '4.17.20',
          }),
        }),
      );
      expect(result.vulns).toHaveLength(1);
    });

    it('throws OsvApiError on non-2xx response', async () => {
      global.fetch = mockFetch({}, 400);
      const osv = new OsvClient();

      await expect(
        osv.query({ package: { name: 'lodash', ecosystem: 'npm' }, version: '4.17.20' }),
      ).rejects.toBeInstanceOf(OsvApiError);
    });
  });

  describe('queryBatch()', () => {
    it('sends POST /v1/querybatch with queries array', async () => {
      global.fetch = mockFetch(mockBatchResult);
      const osv = new OsvClient();

      const result = await osv.queryBatch([
        { package: { name: 'lodash', ecosystem: 'npm' }, version: '4.17.20' },
        { package: { name: 'express', ecosystem: 'npm' }, version: '4.17.1' },
      ]);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.osv.dev/v1/querybatch',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            queries: [
              { package: { name: 'lodash', ecosystem: 'npm' }, version: '4.17.20' },
              { package: { name: 'express', ecosystem: 'npm' }, version: '4.17.1' },
            ],
          }),
        }),
      );
      expect(result.results).toHaveLength(2);
    });
  });

  describe('on() event listener', () => {
    it('emits request event on successful GET', async () => {
      global.fetch = mockFetch(mockVuln);
      const osv = new OsvClient();
      const listener = jest.fn();

      osv.on('request', listener);
      await osv.vuln('GHSA-jfh8-c2jp-hdp8').get();

      expect(listener).toHaveBeenCalledTimes(1);
      const event = listener.mock.calls[0][0];
      expect(event.method).toBe('GET');
      expect(event.statusCode).toBe(200);
      expect(event.durationMs).toBeGreaterThanOrEqual(0);
      expect(event.error).toBeUndefined();
    });

    it('emits request event with error on failed request', async () => {
      global.fetch = mockFetch({}, 404);
      const osv = new OsvClient();
      const listener = jest.fn();

      osv.on('request', listener);
      await osv.vuln('INVALID').get().catch(() => {});

      const event = listener.mock.calls[0][0];
      expect(event.error).toBeInstanceOf(OsvApiError);
    });
  });

  describe('constructor options', () => {
    it('uses custom baseUrl', async () => {
      global.fetch = mockFetch(mockVuln);
      const osv = new OsvClient({ baseUrl: 'https://my-osv-mirror.example.com' });

      await osv.vuln('GHSA-jfh8-c2jp-hdp8').get();

      expect(fetch).toHaveBeenCalledWith(
        'https://my-osv-mirror.example.com/v1/vulns/GHSA-jfh8-c2jp-hdp8',
        expect.anything(),
      );
    });

    it('adds Authorization header when token is set', async () => {
      global.fetch = mockFetch(mockVuln);
      const osv = new OsvClient({ token: 'my-secret-token' });

      await osv.vuln('GHSA-jfh8-c2jp-hdp8').get();

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer my-secret-token',
          }),
        }),
      );
    });
  });
});
