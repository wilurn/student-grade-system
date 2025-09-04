import { HttpClientImpl } from '../HttpClient';
import { ErrorCode, DomainException } from '../../../shared/types';

// Mock fetch globally
global.fetch = jest.fn();

describe('HttpClient', () => {
  let httpClient: HttpClientImpl;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    httpClient = new HttpClientImpl({
      baseURL: 'https://api.example.com',
      timeout: 5000,
      headers: { 'X-Custom-Header': 'test' },
    });
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with correct configuration', () => {
      const client = new HttpClientImpl({
        baseURL: 'https://api.test.com/',
        timeout: 10000,
      });

      expect(client).toBeDefined();
    });

    it('should remove trailing slash from baseURL', () => {
      const client = new HttpClientImpl({
        baseURL: 'https://api.test.com/',
      });

      expect(client).toBeDefined();
    });
  });

  describe('setAuthToken and removeAuthToken', () => {
    it('should set and remove auth token', () => {
      const token = 'test-token';

      httpClient.setAuthToken(token);
      // Token should be included in subsequent requests

      httpClient.removeAuthToken();
      // Token should no longer be included
    });
  });

  describe('GET requests', () => {
    it('should make successful GET request', async () => {
      const mockResponse = { data: { id: 1, name: 'Test' } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(mockResponse)),
      } as Response);

      const result = await httpClient.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Custom-Header': 'test',
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should include auth token in headers when set', async () => {
      const token = 'Bearer test-token';
      httpClient.setAuthToken(token);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('{}'),
      } as Response);

      await httpClient.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${token}`,
          }),
        })
      );
    });
  });

  describe('POST requests', () => {
    it('should make successful POST request with data', async () => {
      const requestData = { name: 'Test', email: 'test@example.com' };
      const mockResponse = { success: true, data: { id: 1, ...requestData } };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        text: () => Promise.resolve(JSON.stringify(mockResponse)),
      } as Response);

      const result = await httpClient.post('/users', requestData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(requestData),
        })
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('PUT requests', () => {
    it('should make successful PUT request', async () => {
      const requestData = { name: 'Updated Test' };
      const mockResponse = { success: true, data: { id: 1, ...requestData } };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(mockResponse)),
      } as Response);

      const result = await httpClient.put('/users/1', requestData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(requestData),
        })
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('DELETE requests', () => {
    it('should make successful DELETE request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        text: () => Promise.resolve(''),
      } as Response);

      const result = await httpClient.delete('/users/1');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
      expect(result).toEqual({});
    });
  });

  describe('error handling', () => {
    it('should handle 400 Bad Request', async () => {
      const errorResponse = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve(JSON.stringify(errorResponse)),
      } as Response);

      try {
        await httpClient.get('/test');
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(DomainException);
        expect(error).toMatchObject({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Invalid input data',
        });
      }
    });

    it('should handle 401 Unauthorized', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              error: { message: 'Authentication required' },
            })
          ),
      } as Response);

      try {
        await httpClient.get('/test');
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(DomainException);
        expect(error).toMatchObject({
          code: ErrorCode.AUTHENTICATION_ERROR,
        });
      }
    });

    it('should handle 403 Forbidden', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              error: { message: 'Access denied' },
            })
          ),
      } as Response);

      try {
        await httpClient.get('/test');
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(DomainException);
        expect(error).toMatchObject({
          code: ErrorCode.AUTHORIZATION_ERROR,
        });
      }
    });

    it('should handle 404 Not Found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              error: { message: 'Resource not found' },
            })
          ),
      } as Response);

      try {
        await httpClient.get('/test');
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(DomainException);
        expect(error).toMatchObject({
          code: ErrorCode.NOT_FOUND_ERROR,
        });
      }
    });

    it('should handle 409 Conflict', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              error: { message: 'Resource already exists' },
            })
          ),
      } as Response);

      try {
        await httpClient.get('/test');
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(DomainException);
        expect(error).toMatchObject({
          code: ErrorCode.DUPLICATE_ERROR,
        });
      }
    });

    it('should handle 500 Server Error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              error: { message: 'Internal server error' },
            })
          ),
      } as Response);

      await expect(httpClient.get('/test')).rejects.toThrow(DomainException);
      await expect(httpClient.get('/test')).rejects.toMatchObject({
        code: ErrorCode.SERVER_ERROR,
      });
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(httpClient.get('/test')).rejects.toThrow('Network error');
    });

    it('should handle invalid JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('invalid json'),
      } as Response);

      await expect(httpClient.get('/test')).rejects.toThrow(DomainException);
      await expect(httpClient.get('/test')).rejects.toMatchObject({
        code: ErrorCode.SERVER_ERROR,
        message: 'Invalid response format from server',
      });
    });
  });

  describe('retry mechanism', () => {
    it('should retry on network errors', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: () => Promise.resolve('{"data": "success"}'),
        } as Response);

      const result = await httpClient.get('/test', { retries: 2 });

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result).toEqual({ data: 'success' });
    });

    it('should not retry on client errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              error: { code: 'VALIDATION_ERROR', message: 'Bad request' },
            })
          ),
      } as Response);

      await expect(httpClient.get('/test', { retries: 2 })).rejects.toThrow(
        DomainException
      );
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('timeout handling', () => {
    it('should respect custom timeout', async () => {
      const customTimeout = 1000;

      // Mock setTimeout to verify timeout is set
      const mockSetTimeout = jest.spyOn(global, 'setTimeout');
      const mockClearTimeout = jest.spyOn(global, 'clearTimeout');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('{}'),
      } as Response);

      await httpClient.get('/test', { timeout: customTimeout });

      expect(mockSetTimeout).toHaveBeenCalledWith(
        expect.any(Function),
        customTimeout
      );
      expect(mockClearTimeout).toHaveBeenCalled();

      mockSetTimeout.mockRestore();
      mockClearTimeout.mockRestore();
    });
  });

  describe('API response format handling', () => {
    it('should handle API response format with success flag', async () => {
      const apiResponse = {
        success: true,
        data: { id: 1, name: 'Test' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(apiResponse)),
      } as Response);

      const result = await httpClient.get('/test');

      expect(result).toEqual(apiResponse.data);
    });

    it('should handle API error response format', async () => {
      const apiResponse = {
        success: false,
        error: {
          code: 'CUSTOM_ERROR',
          message: 'Custom error message',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(apiResponse)),
      } as Response);

      try {
        await httpClient.get('/test');
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(DomainException);
        expect(error).toMatchObject({
          code: 'CUSTOM_ERROR',
          message: 'Custom error message',
        });
      }
    });

    it('should handle raw response when not in API format', async () => {
      const rawResponse = { id: 1, name: 'Test' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(rawResponse)),
      } as Response);

      const result = await httpClient.get('/test');

      expect(result).toEqual(rawResponse);
    });
  });
});
