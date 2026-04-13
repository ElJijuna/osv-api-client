import { OsvApiError } from './OsvApiError';

describe('OsvApiError', () => {
  it('sets message, status, and statusText', () => {
    const err = new OsvApiError(404, 'Not Found');
    expect(err.message).toBe('OSV API error: 404 Not Found');
    expect(err.status).toBe(404);
    expect(err.statusText).toBe('Not Found');
  });

  it('is an instance of Error', () => {
    const err = new OsvApiError(500, 'Internal Server Error');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(OsvApiError);
  });

  it('has the correct name', () => {
    const err = new OsvApiError(400, 'Bad Request');
    expect(err.name).toBe('OsvApiError');
  });
});
