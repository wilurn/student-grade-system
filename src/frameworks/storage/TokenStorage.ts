import { TokenStorage as ITokenStorage } from '../../usecases/AuthUseCase';
import { TokenPayload } from '../../shared/types';

export class TokenStorage implements ITokenStorage {
  private readonly TOKEN_KEY = 'auth_token';

  getToken(): string | null {
    try {
      return localStorage.getItem(this.TOKEN_KEY);
    } catch (error) {
      console.warn('Failed to get token from localStorage:', error);
      return null;
    }
  }

  setToken(token: string): void {
    try {
      localStorage.setItem(this.TOKEN_KEY, token);
    } catch (error) {
      console.error('Failed to save token to localStorage:', error);
      throw new Error('Failed to save authentication token');
    }
  }

  removeToken(): void {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
    } catch (error) {
      console.warn('Failed to remove token from localStorage:', error);
    }
  }

  isTokenExpired(token: string): boolean {
    try {
      const payload = this.decodeToken(token);
      if (!payload || !payload.exp) {
        return true;
      }

      // Check if token expires within the next 5 minutes (300 seconds)
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds

      return expirationTime <= currentTime + bufferTime;
    } catch (error) {
      console.warn('Failed to check token expiration:', error);
      return true;
    }
  }

  private decodeToken(token: string): TokenPayload | null {
    try {
      // JWT tokens have 3 parts separated by dots
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      // Decode the payload (second part)
      const payload = parts[1];
      const decodedPayload = atob(
        payload.replace(/-/g, '+').replace(/_/g, '/')
      );
      return JSON.parse(decodedPayload) as TokenPayload;
    } catch (error) {
      console.warn('Failed to decode token:', error);
      return null;
    }
  }

  getTokenPayload(): TokenPayload | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    return this.decodeToken(token);
  }

  isTokenValid(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    return !this.isTokenExpired(token);
  }
}

export class SessionStorageTokenStorage implements TokenStorage {
  private readonly TOKEN_KEY = 'auth_token';

  getToken(): string | null {
    try {
      return sessionStorage.getItem(this.TOKEN_KEY);
    } catch (error) {
      console.warn('Failed to get token from sessionStorage:', error);
      return null;
    }
  }

  setToken(token: string): void {
    try {
      sessionStorage.setItem(this.TOKEN_KEY, token);
    } catch (error) {
      console.error('Failed to save token to sessionStorage:', error);
      throw new Error('Failed to save authentication token');
    }
  }

  removeToken(): void {
    try {
      sessionStorage.removeItem(this.TOKEN_KEY);
    } catch (error) {
      console.warn('Failed to remove token from sessionStorage:', error);
    }
  }

  isTokenExpired(token: string): boolean {
    try {
      const payload = this.decodeToken(token);
      if (!payload || !payload.exp) {
        return true;
      }

      const expirationTime = payload.exp * 1000;
      const currentTime = Date.now();
      const bufferTime = 5 * 60 * 1000; // 5 minutes buffer

      return expirationTime <= currentTime + bufferTime;
    } catch (error) {
      console.warn('Failed to check token expiration:', error);
      return true;
    }
  }

  private decodeToken(token: string): TokenPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payload = parts[1];
      const decodedPayload = atob(
        payload.replace(/-/g, '+').replace(/_/g, '/')
      );
      return JSON.parse(decodedPayload) as TokenPayload;
    } catch (error) {
      console.warn('Failed to decode token:', error);
      return null;
    }
  }
}

// Memory-based token storage for testing or when localStorage is not available
export class MemoryTokenStorage implements TokenStorage {
  private token: string | null = null;

  getToken(): string | null {
    return this.token;
  }

  setToken(token: string): void {
    this.token = token;
  }

  removeToken(): void {
    this.token = null;
  }

  isTokenExpired(token: string): boolean {
    try {
      const payload = this.decodeToken(token);
      if (!payload || !payload.exp) {
        return true;
      }

      const expirationTime = payload.exp * 1000;
      const currentTime = Date.now();
      const bufferTime = 5 * 60 * 1000; // 5 minutes buffer

      return expirationTime <= currentTime + bufferTime;
    } catch (error) {
      return true;
    }
  }

  private decodeToken(token: string): TokenPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payload = parts[1];
      const decodedPayload = atob(
        payload.replace(/-/g, '+').replace(/_/g, '/')
      );
      return JSON.parse(decodedPayload) as TokenPayload;
    } catch (error) {
      return null;
    }
  }
}
