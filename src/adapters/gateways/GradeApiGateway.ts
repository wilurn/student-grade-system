import { Grade } from '../../entities/Grade';
import {
  GradeCorrection,
  GradeCorrectionRequest,
} from '../../entities/GradeCorrection';
import { IHttpClient } from '../../frameworks/api/HttpClient';
import {
  GradeFilters,
  CorrectionFilters,
  PaginatedResponse,
  ErrorCode,
  DomainException,
} from '../../shared/types';

export interface GradeApiResponse {
  grades: Grade[];
}

export interface GradeCorrectionApiResponse {
  correction: GradeCorrection;
}

export interface GradeCorrectionsApiResponse {
  corrections: GradeCorrection[];
}

export interface PaginatedGradesResponse extends PaginatedResponse<Grade> {}

export interface PaginatedCorrectionsResponse
  extends PaginatedResponse<GradeCorrection> {}

export interface GradeGateway {
  getStudentGrades(studentId: string, filters?: GradeFilters): Promise<Grade[]>;
  getStudentGradesPaginated(
    studentId: string,
    page: number,
    limit: number,
    filters?: GradeFilters
  ): Promise<PaginatedResponse<Grade>>;
  getGradeById(gradeId: string, studentId: string): Promise<Grade | null>;
  submitGradeCorrection(
    correction: GradeCorrectionRequest
  ): Promise<GradeCorrection>;
  getGradeCorrections(
    studentId: string,
    filters?: CorrectionFilters
  ): Promise<GradeCorrection[]>;
  getGradeCorrectionsPaginated(
    studentId: string,
    page: number,
    limit: number,
    filters?: CorrectionFilters
  ): Promise<PaginatedResponse<GradeCorrection>>;
  getCorrectionById(
    correctionId: string,
    studentId: string
  ): Promise<GradeCorrection | null>;
  canSubmitCorrection(gradeId: string, studentId: string): Promise<boolean>;
  getCorrectionAttempts(gradeId: string, studentId: string): Promise<number>;
}

export class GradeApiGateway implements GradeGateway {
  constructor(private httpClient: IHttpClient) {}

  async getStudentGrades(
    studentId: string,
    filters?: GradeFilters
  ): Promise<Grade[]> {
    try {
      const queryParams = this.buildGradeFiltersQuery(filters);
      const url = `/api/grades/${studentId}${queryParams}`;

      const response = await this.httpClient.get<GradeApiResponse>(url);

      if (!response.grades || !Array.isArray(response.grades)) {
        throw new DomainException({
          code: ErrorCode.SERVER_ERROR,
          message: 'Invalid grades response format',
        });
      }

      return response.grades;
    } catch (error) {
      if (error instanceof DomainException) {
        throw error;
      }

      throw new DomainException({
        code: ErrorCode.SERVER_ERROR,
        message: 'Failed to fetch student grades',
      });
    }
  }

  async getStudentGradesPaginated(
    studentId: string,
    page: number,
    limit: number,
    filters?: GradeFilters
  ): Promise<PaginatedResponse<Grade>> {
    try {
      const queryParams = this.buildPaginatedGradeQuery(page, limit, filters);
      const url = `/api/grades/${studentId}/paginated${queryParams}`;

      const response = await this.httpClient.get<PaginatedGradesResponse>(url);

      if (
        !response.data ||
        !Array.isArray(response.data) ||
        !response.pagination
      ) {
        throw new DomainException({
          code: ErrorCode.SERVER_ERROR,
          message: 'Invalid paginated grades response format',
        });
      }

      return response;
    } catch (error) {
      if (error instanceof DomainException) {
        throw error;
      }

      throw new DomainException({
        code: ErrorCode.SERVER_ERROR,
        message: 'Failed to fetch paginated student grades',
      });
    }
  }

  async getGradeById(
    gradeId: string,
    studentId: string
  ): Promise<Grade | null> {
    try {
      const response = await this.httpClient.get<{ grade: Grade }>(
        `/api/grades/${studentId}/grade/${gradeId}`
      );

      return response.grade || null;
    } catch (error) {
      if (
        error instanceof DomainException &&
        error.code === ErrorCode.NOT_FOUND_ERROR
      ) {
        return null;
      }

      if (error instanceof DomainException) {
        throw error;
      }

      throw new DomainException({
        code: ErrorCode.SERVER_ERROR,
        message: 'Failed to fetch grade',
      });
    }
  }

  async submitGradeCorrection(
    correction: GradeCorrectionRequest
  ): Promise<GradeCorrection> {
    try {
      const response = await this.httpClient.post<GradeCorrectionApiResponse>(
        '/api/grades/corrections',
        correction
      );

      if (!response.correction) {
        throw new DomainException({
          code: ErrorCode.SERVER_ERROR,
          message: 'Invalid correction response format',
        });
      }

      return response.correction;
    } catch (error) {
      if (error instanceof DomainException) {
        // Re-map specific errors
        if (error.code === ErrorCode.DUPLICATE_ERROR) {
          throw new DomainException({
            code: ErrorCode.DUPLICATE_CORRECTION,
            message: 'A correction request for this grade is already pending',
          });
        }
        if (error.code === ErrorCode.BUSINESS_RULE_ERROR) {
          throw new DomainException({
            code: ErrorCode.CORRECTION_NOT_ALLOWED,
            message: error.message,
          });
        }
        throw error;
      }

      throw new DomainException({
        code: ErrorCode.SERVER_ERROR,
        message: 'Failed to submit grade correction',
      });
    }
  }

  async getGradeCorrections(
    studentId: string,
    filters?: CorrectionFilters
  ): Promise<GradeCorrection[]> {
    try {
      const queryParams = this.buildCorrectionFiltersQuery(filters);
      const url = `/api/grades/corrections/${studentId}${queryParams}`;

      const response =
        await this.httpClient.get<GradeCorrectionsApiResponse>(url);

      if (!response.corrections || !Array.isArray(response.corrections)) {
        throw new DomainException({
          code: ErrorCode.SERVER_ERROR,
          message: 'Invalid corrections response format',
        });
      }

      return response.corrections;
    } catch (error) {
      if (error instanceof DomainException) {
        throw error;
      }

      throw new DomainException({
        code: ErrorCode.SERVER_ERROR,
        message: 'Failed to fetch grade corrections',
      });
    }
  }

  async getGradeCorrectionsPaginated(
    studentId: string,
    page: number,
    limit: number,
    filters?: CorrectionFilters
  ): Promise<PaginatedResponse<GradeCorrection>> {
    try {
      const queryParams = this.buildPaginatedCorrectionQuery(
        page,
        limit,
        filters
      );
      const url = `/api/grades/corrections/${studentId}/paginated${queryParams}`;

      const response =
        await this.httpClient.get<PaginatedCorrectionsResponse>(url);

      if (
        !response.data ||
        !Array.isArray(response.data) ||
        !response.pagination
      ) {
        throw new DomainException({
          code: ErrorCode.SERVER_ERROR,
          message: 'Invalid paginated corrections response format',
        });
      }

      return response;
    } catch (error) {
      if (error instanceof DomainException) {
        throw error;
      }

      throw new DomainException({
        code: ErrorCode.SERVER_ERROR,
        message: 'Failed to fetch paginated grade corrections',
      });
    }
  }

  async getCorrectionById(
    correctionId: string,
    studentId: string
  ): Promise<GradeCorrection | null> {
    try {
      const response = await this.httpClient.get<{
        correction: GradeCorrection;
      }>(`/api/grades/corrections/${studentId}/correction/${correctionId}`);

      return response.correction || null;
    } catch (error) {
      if (
        error instanceof DomainException &&
        error.code === ErrorCode.NOT_FOUND_ERROR
      ) {
        return null;
      }

      if (error instanceof DomainException) {
        throw error;
      }

      throw new DomainException({
        code: ErrorCode.SERVER_ERROR,
        message: 'Failed to fetch correction',
      });
    }
  }

  async canSubmitCorrection(
    gradeId: string,
    studentId: string
  ): Promise<boolean> {
    try {
      const response = await this.httpClient.get<{ canSubmit: boolean }>(
        `/api/grades/${studentId}/grade/${gradeId}/can-correct`
      );

      return response.canSubmit;
    } catch (error) {
      if (error instanceof DomainException) {
        throw error;
      }

      throw new DomainException({
        code: ErrorCode.SERVER_ERROR,
        message: 'Failed to check correction eligibility',
      });
    }
  }

  async getCorrectionAttempts(
    gradeId: string,
    studentId: string
  ): Promise<number> {
    try {
      const response = await this.httpClient.get<{ attempts: number }>(
        `/api/grades/${studentId}/grade/${gradeId}/correction-attempts`
      );

      return response.attempts;
    } catch (error) {
      if (error instanceof DomainException) {
        throw error;
      }

      throw new DomainException({
        code: ErrorCode.SERVER_ERROR,
        message: 'Failed to get correction attempts count',
      });
    }
  }

  private buildGradeFiltersQuery(filters?: GradeFilters): string {
    if (!filters) return '';

    const params = new URLSearchParams();

    if (filters.semester) {
      params.append('semester', filters.semester);
    }
    if (filters.courseCode) {
      params.append('courseCode', filters.courseCode);
    }
    if (filters.minGrade) {
      params.append('minGrade', filters.minGrade);
    }
    if (filters.maxGrade) {
      params.append('maxGrade', filters.maxGrade);
    }

    return params.toString() ? `?${params.toString()}` : '';
  }

  private buildCorrectionFiltersQuery(filters?: CorrectionFilters): string {
    if (!filters) return '';

    const params = new URLSearchParams();

    if (filters.status) {
      params.append('status', filters.status);
    }
    if (filters.semester) {
      params.append('semester', filters.semester);
    }
    if (filters.dateFrom) {
      params.append('dateFrom', filters.dateFrom.toISOString());
    }
    if (filters.dateTo) {
      params.append('dateTo', filters.dateTo.toISOString());
    }

    return params.toString() ? `?${params.toString()}` : '';
  }

  private buildPaginatedGradeQuery(
    page: number,
    limit: number,
    filters?: GradeFilters
  ): string {
    const params = new URLSearchParams();

    params.append('page', page.toString());
    params.append('limit', limit.toString());

    if (filters?.semester) {
      params.append('semester', filters.semester);
    }
    if (filters?.courseCode) {
      params.append('courseCode', filters.courseCode);
    }
    if (filters?.minGrade) {
      params.append('minGrade', filters.minGrade);
    }
    if (filters?.maxGrade) {
      params.append('maxGrade', filters.maxGrade);
    }

    return `?${params.toString()}`;
  }

  private buildPaginatedCorrectionQuery(
    page: number,
    limit: number,
    filters?: CorrectionFilters
  ): string {
    const params = new URLSearchParams();

    params.append('page', page.toString());
    params.append('limit', limit.toString());

    if (filters?.status) {
      params.append('status', filters.status);
    }
    if (filters?.semester) {
      params.append('semester', filters.semester);
    }
    if (filters?.dateFrom) {
      params.append('dateFrom', filters.dateFrom.toISOString());
    }
    if (filters?.dateTo) {
      params.append('dateTo', filters.dateTo.toISOString());
    }

    return `?${params.toString()}`;
  }
}
