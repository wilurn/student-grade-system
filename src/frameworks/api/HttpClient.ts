import { ApiResponse, ErrorCode, DomainException } from '../../shared/types';

export interface HttpClientConfig {
    baseURL: string;
    timeout?: number;
    headers?: Record<string, string>;
}

export interface RequestConfig {
    headers?: Record<string, string>;
    timeout?: number;
    retries?: number;
}

export interface IHttpClient {
    get<T>(url: string, config?: RequestConfig): Promise<T>;
    post<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T>;
    put<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T>;
    delete<T>(url: string, config?: RequestConfig): Promise<T>;
    setAuthToken(token: string): void;
    removeAuthToken(): void;
}

export class HttpClient implements IHttpClient {
    private baseURL: string;
    private timeout: number;
    private defaultHeaders: Record<string, string>;
    private authToken: string | null = null;

    constructor(config: HttpClientConfig) {
        this.baseURL = config.baseURL.replace(/\/$/, ''); // Remove trailing slash
        this.timeout = config.timeout || 10000; // 10 seconds default
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            ...config.headers,
        };
    }

    setAuthToken(token: string): void {
        this.authToken = token;
    }

    removeAuthToken(): void {
        this.authToken = null;
    }

    private getHeaders(
        customHeaders?: Record<string, string>
    ): Record<string, string> {
        const headers = { ...this.defaultHeaders, ...customHeaders };

        if (this.authToken) {
            headers.Authorization = `Bearer ${this.authToken}`;
        }

        return headers;
    }

    private async makeRequest<T>(
        method: string,
        url: string,
        data?: unknown,
        config?: RequestConfig
    ): Promise<T> {
        const fullUrl = `${this.baseURL}${url}`;
        const headers = this.getHeaders(config?.headers);
        const timeout = config?.timeout || this.timeout;
        const retries = config?.retries || 0;

        // Create AbortController for timeout handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const requestOptions: RequestInit = {
            method,
            headers,
            signal: controller.signal,
        };

        if (data && method !== 'GET') {
            requestOptions.body = JSON.stringify(data);
        }

        let lastError: Error;

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const response = await fetch(fullUrl, requestOptions);
                clearTimeout(timeoutId);
                return await this.handleResponse<T>(response);
            } catch (error) {
                clearTimeout(timeoutId);
                lastError = error as Error;

                // Don't retry on client errors (4xx) or auth errors
                if (
                    error instanceof DomainException &&
                    [
                        ErrorCode.AUTHENTICATION_ERROR,
                        ErrorCode.AUTHORIZATION_ERROR,
                        ErrorCode.VALIDATION_ERROR,
                    ].includes(error.code)
                ) {
                    throw error;
                }

                // Only retry on network errors or server errors (5xx)
                if (attempt === retries) {
                    break;
                }

                // Exponential backoff
                await this.delay(Math.pow(2, attempt) * 1000);
            }
        }

        throw lastError!;
    }

    private async handleResponse<T>(response: Response): Promise<T> {
        let responseData: any;

        try {
            const text = await response.text();
            responseData = text ? JSON.parse(text) : {};
        } catch (error) {
            throw new DomainException({
                code: ErrorCode.SERVER_ERROR,
                message: 'Invalid response format from server',
            });
        }

        if (!response.ok) {
            this.handleErrorResponse(response, responseData);
        }

        // Handle API response format
        if (
            responseData &&
            typeof responseData === 'object' &&
            'success' in responseData
        ) {
            const apiResponse = responseData as ApiResponse<T>;

            if (!apiResponse.success && apiResponse.error) {
                throw new DomainException({
                    code: apiResponse.error.code as ErrorCode,
                    message: apiResponse.error.message,
                    details: apiResponse.error.details,
                });
            }

            return apiResponse.data as T;
        }

        // Return raw response data if not in API response format
        return responseData as T;
    }

    private handleErrorResponse(response: Response, data: any): never {
        let errorCode: ErrorCode;
        let errorMessage: string;

        switch (response.status) {
            case 400:
                errorCode = ErrorCode.VALIDATION_ERROR;
                errorMessage = data?.error?.message || 'Invalid request data';
                break;
            case 401:
                errorCode = ErrorCode.AUTHENTICATION_ERROR;
                errorMessage = data?.error?.message || 'Authentication required';
                break;
            case 403:
                errorCode = ErrorCode.AUTHORIZATION_ERROR;
                errorMessage = data?.error?.message || 'Access denied';
                break;
            case 404:
                errorCode = ErrorCode.NOT_FOUND_ERROR;
                errorMessage = data?.error?.message || 'Resource not found';
                break;
            case 409:
                errorCode = ErrorCode.DUPLICATE_ERROR;
                errorMessage = data?.error?.message || 'Resource already exists';
                break;
            case 422:
                errorCode = ErrorCode.BUSINESS_RULE_ERROR;
                errorMessage = data?.error?.message || 'Business rule violation';
                break;
            case 429:
                errorCode = ErrorCode.SERVER_ERROR;
                errorMessage = 'Too many requests. Please try again later.';
                break;
            default:
                if (response.status >= 500) {
                    errorCode = ErrorCode.SERVER_ERROR;
                    errorMessage = 'Server error. Please try again later.';
                } else {
                    errorCode = ErrorCode.NETWORK_ERROR;
                    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                }
        }

        throw new DomainException({
            code: errorCode,
            message: errorMessage,
            details: data?.error?.details,
        });
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async get<T>(url: string, config?: RequestConfig): Promise<T> {
        return this.makeRequest<T>('GET', url, undefined, config);
    }

    async post<T>(
        url: string,
        data?: unknown,
        config?: RequestConfig
    ): Promise<T> {
        return this.makeRequest<T>('POST', url, data, config);
    }

    async put<T>(
        url: string,
        data?: unknown,
        config?: RequestConfig
    ): Promise<T> {
        return this.makeRequest<T>('PUT', url, data, config);
    }

    async delete<T>(url: string, config?: RequestConfig): Promise<T> {
        return this.makeRequest<T>('DELETE', url, undefined, config);
    }
}
