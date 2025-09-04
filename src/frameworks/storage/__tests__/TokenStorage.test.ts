import {
  LocalStorageTokenStorage,
  SessionStorageTokenStorage,
  MemoryTokenStorage,
} from '../TokenStorage';

// Mock localStorage and sessionStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

// Mock atob for JWT decoding
global.atob = jest.fn((str: string) => {
  return Buffer.from(str, 'base64').toString('binary');
});

describe('TokenStorage', () => {
  const validToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdHVkZW50SWQiOiIxMjM0NTYiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE2MzAwMDAwMDAsImV4cCI6OTk5OTk5OTk5OX0.signature';
  const expiredToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdHVkZW50SWQiOiIxMjM0NTYiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE2MzAwMDAwMDAsImV4cCI6MTYzMDAwMDAwMH0.signature';

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock atob to return valid JSON for token payload
    (global.atob as jest.Mock).mockImplementation((str: string) => {
      if (str.includes('eyJzdHVkZW50SWQiOiIxMjM0NTYi')) {
        return JSON.stringify({
          studentId: '123456',
          email: 'test@example.com',
          iat: 1630000000,
          exp: 9999999999, // Far future
        });
      }
      if (str.includes('eyJzdHVkZW50SWQiOiIxMjM0NTYi')) {
        return JSON.stringify({
          studentId: '123456',
          email: 'test@example.com',
          iat: 1630000000,
          exp: 1630000000, // Past date
        });
      }
      return '{}';
    });
  });

  describe('LocalStorageTokenStorage', () => {
    let tokenStorage: LocalStorageTokenStorage;

    beforeEach(() => {
      tokenStorage = new LocalStorageTokenStorage();
    });

    describe('getToken', () => {
      it('should get token from localStorage', () => {
        mockLocalStorage.getItem.mockReturnValue('test-token');

        const result = tokenStorage.getToken();

        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('auth_token');
        expect(result).toBe('test-token');
      });

      it('should return null when no token exists', () => {
        mockLocalStorage.getItem.mockReturnValue(null);

        const result = tokenStorage.getToken();

        expect(result).toBeNull();
      });

      it('should handle localStorage errors gracefully', () => {
        mockLocalStorage.getItem.mockImplementation(() => {
          throw new Error('localStorage error');
        });

        const result = tokenStorage.getToken();

        expect(result).toBeNull();
      });
    });

    describe('setToken', () => {
      it('should set token in localStorage', () => {
        tokenStorage.setToken('test-token');

        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'auth_token',
          'test-token'
        );
      });

      it('should throw error when localStorage fails', () => {
        mockLocalStorage.setItem.mockImplementation(() => {
          throw new Error('localStorage error');
        });

        expect(() => tokenStorage.setToken('test-token')).toThrow(
          'Failed to save authentication token'
        );
      });
    });

    describe('removeToken', () => {
      it('should remove token from localStorage', () => {
        tokenStorage.removeToken();

        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token');
      });

      it('should handle localStorage errors gracefully', () => {
        mockLocalStorage.removeItem.mockImplementation(() => {
          throw new Error('localStorage error');
        });

        expect(() => tokenStorage.removeToken()).not.toThrow();
      });
    });

    describe('isTokenExpired', () => {
      beforeEach(() => {
        // Mock Date.now to return a fixed timestamp
        jest.spyOn(Date, 'now').mockReturnValue(1630000000000); // 2021-08-26 12:00:00 UTC
      });

      afterEach(() => {
        jest.restoreAllMocks();
      });

      it('should return false for valid token', () => {
        (global.atob as jest.Mock).mockReturnValue(
          JSON.stringify({
            studentId: '123456',
            email: 'test@example.com',
            iat: 1630000000,
            exp: 9999999999, // Far future
          })
        );

        const result = tokenStorage.isTokenExpired(validToken);

        expect(result).toBe(false);
      });

      it('should return true for expired token', () => {
        (global.atob as jest.Mock).mockReturnValue(
          JSON.stringify({
            studentId: '123456',
            email: 'test@example.com',
            iat: 1630000000,
            exp: 1629999999, // Past date
          })
        );

        const result = tokenStorage.isTokenExpired(expiredToken);

        expect(result).toBe(true);
      });

      it('should return true for token expiring within 5 minutes', () => {
        const soonToExpire = Math.floor(Date.now() / 1000) + 240; // 4 minutes from now
        (global.atob as jest.Mock).mockReturnValue(
          JSON.stringify({
            studentId: '123456',
            email: 'test@example.com',
            iat: 1630000000,
            exp: soonToExpire,
          })
        );

        const result = tokenStorage.isTokenExpired('token');

        expect(result).toBe(true);
      });

      it('should return true for invalid token format', () => {
        const result = tokenStorage.isTokenExpired('invalid-token');

        expect(result).toBe(true);
      });

      it('should return true for token without expiration', () => {
        (global.atob as jest.Mock).mockReturnValue(
          JSON.stringify({
            studentId: '123456',
            email: 'test@example.com',
            iat: 1630000000,
            // No exp field
          })
        );

        const result = tokenStorage.isTokenExpired('token');

        expect(result).toBe(true);
      });
    });
  });

  describe('SessionStorageTokenStorage', () => {
    let tokenStorage: SessionStorageTokenStorage;

    beforeEach(() => {
      tokenStorage = new SessionStorageTokenStorage();
    });

    describe('getToken', () => {
      it('should get token from sessionStorage', () => {
        mockSessionStorage.getItem.mockReturnValue('test-token');

        const result = tokenStorage.getToken();

        expect(mockSessionStorage.getItem).toHaveBeenCalledWith('auth_token');
        expect(result).toBe('test-token');
      });

      it('should return null when no token exists', () => {
        mockSessionStorage.getItem.mockReturnValue(null);

        const result = tokenStorage.getToken();

        expect(result).toBeNull();
      });
    });

    describe('setToken', () => {
      it('should set token in sessionStorage', () => {
        tokenStorage.setToken('test-token');

        expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
          'auth_token',
          'test-token'
        );
      });
    });

    describe('removeToken', () => {
      it('should remove token from sessionStorage', () => {
        tokenStorage.removeToken();

        expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(
          'auth_token'
        );
      });
    });
  });

  describe('MemoryTokenStorage', () => {
    let tokenStorage: MemoryTokenStorage;

    beforeEach(() => {
      tokenStorage = new MemoryTokenStorage();
    });

    describe('getToken', () => {
      it('should return null initially', () => {
        const result = tokenStorage.getToken();

        expect(result).toBeNull();
      });

      it('should return stored token', () => {
        tokenStorage.setToken('test-token');

        const result = tokenStorage.getToken();

        expect(result).toBe('test-token');
      });
    });

    describe('setToken', () => {
      it('should store token in memory', () => {
        tokenStorage.setToken('test-token');

        expect(tokenStorage.getToken()).toBe('test-token');
      });
    });

    describe('removeToken', () => {
      it('should remove token from memory', () => {
        tokenStorage.setToken('test-token');
        tokenStorage.removeToken();

        expect(tokenStorage.getToken()).toBeNull();
      });
    });

    describe('isTokenExpired', () => {
      beforeEach(() => {
        jest.spyOn(Date, 'now').mockReturnValue(1630000000000);
      });

      afterEach(() => {
        jest.restoreAllMocks();
      });

      it('should return false for valid token', () => {
        (global.atob as jest.Mock).mockReturnValue(
          JSON.stringify({
            studentId: '123456',
            email: 'test@example.com',
            iat: 1630000000,
            exp: 9999999999,
          })
        );

        const result = tokenStorage.isTokenExpired(validToken);

        expect(result).toBe(false);
      });

      it('should return true for invalid token', () => {
        const result = tokenStorage.isTokenExpired('invalid');

        expect(result).toBe(true);
      });
    });
  });

  describe('Token decoding', () => {
    let tokenStorage: LocalStorageTokenStorage;

    beforeEach(() => {
      tokenStorage = new LocalStorageTokenStorage();
    });

    it('should handle malformed JWT tokens', () => {
      const result = tokenStorage.isTokenExpired('not.a.jwt');

      expect(result).toBe(true);
    });

    it('should handle JWT with invalid base64 encoding', () => {
      const result = tokenStorage.isTokenExpired(
        'header.invalid-base64.signature'
      );

      expect(result).toBe(true);
    });

    it('should handle JWT with invalid JSON in payload', () => {
      (global.atob as jest.Mock).mockReturnValue('invalid json');

      const result = tokenStorage.isTokenExpired('header.payload.signature');

      expect(result).toBe(true);
    });
  });
});
