import {
  Grade,
  ValidationResult,
  GradeValidator,
  GradeCalculations,
  GradeBusinessRules,
} from '../entities/Grade';
import {
  GradeCorrection,
  GradeCorrectionRequest,
  GradeCorrectionValidator,
} from '../entities/GradeCorrection';
import {
  GradeFilters,
  CorrectionFilters,
  PaginatedResponse,
  DomainError,
  ErrorCode,
  DomainException,
} from '../shared/types';
import { GradeGateway } from '../adapters/gateways/GradeApiGateway';

export interface GradeUseCase {
  getStudentGrades(studentId: string, filters?: GradeFilters): Promise<Grade[]>;
  getStudentGradesPaginated(
    studentId: string,
    page: number,
    limit: number,
    filters?: GradeFilters
  ): Promise<PaginatedResponse<Grade>>;
  getGradeById(gradeId: string, studentId: string): Promise<Grade | null>;
  calculateGPA(studentId: string, semester?: string): Promise<number>;
  getTotalCredits(studentId: string): Promise<number>;
  getEarnedCredits(studentId: string): Promise<number>;
  getGradesBySemester(studentId: string): Promise<Record<string, Grade[]>>;

  // Grade correction methods
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

  // Validation methods
  validateGradeData(gradeData: Omit<Grade, 'id'>): ValidationResult;
  validateCorrectionRequest(
    request: GradeCorrectionRequest,
    currentGrade?: string
  ): ValidationResult;
}

// Grade-specific error types
export interface GradeError extends DomainError {
  code:
    | ErrorCode.GRADE_NOT_FOUND
    | ErrorCode.CORRECTION_NOT_ALLOWED
    | ErrorCode.MAX_CORRECTIONS_REACHED
    | ErrorCode.DUPLICATE_CORRECTION
    | ErrorCode.INVALID_GRADE_DATA;
}

// Grade statistics
export interface GradeStatistics {
  totalCredits: number;
  earnedCredits: number;
  gpa: number;
  semesterGPA: Record<string, number>;
  gradeDistribution: Record<string, number>;
  passingGrades: number;
  failingGrades: number;
}

// Correction summary
export interface CorrectionSummary {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  averageProcessingDays: number;
}

// Concrete implementation of GradeUseCase
export class GradeUseCaseImpl implements GradeUseCase {
  constructor(private gradeGateway: GradeGateway) {}

  async getStudentGrades(
    studentId: string,
    filters?: GradeFilters
  ): Promise<Grade[]> {
    if (!studentId || studentId.trim().length === 0) {
      throw new DomainException({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Student ID is required',
      });
    }

    try {
      return await this.gradeGateway.getStudentGrades(
        studentId.trim(),
        filters
      );
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
    if (!studentId || studentId.trim().length === 0) {
      throw new DomainException({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Student ID is required',
      });
    }

    if (page < 1) {
      throw new DomainException({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Page must be greater than 0',
      });
    }

    if (limit < 1 || limit > 100) {
      throw new DomainException({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Limit must be between 1 and 100',
      });
    }

    try {
      return await this.gradeGateway.getStudentGradesPaginated(
        studentId.trim(),
        page,
        limit,
        filters
      );
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
    if (!gradeId || gradeId.trim().length === 0) {
      throw new DomainException({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Grade ID is required',
      });
    }

    if (!studentId || studentId.trim().length === 0) {
      throw new DomainException({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Student ID is required',
      });
    }

    try {
      return await this.gradeGateway.getGradeById(
        gradeId.trim(),
        studentId.trim()
      );
    } catch (error) {
      if (error instanceof DomainException) {
        throw error;
      }
      throw new DomainException({
        code: ErrorCode.SERVER_ERROR,
        message: 'Failed to fetch grade',
      });
    }
  }

  async calculateGPA(studentId: string, semester?: string): Promise<number> {
    if (!studentId || studentId.trim().length === 0) {
      throw new DomainException({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Student ID is required',
      });
    }

    try {
      const filters: GradeFilters = semester ? { semester } : undefined;
      const grades = await this.gradeGateway.getStudentGrades(
        studentId.trim(),
        filters
      );
      return GradeCalculations.calculateGPA(grades);
    } catch (error) {
      if (error instanceof DomainException) {
        throw error;
      }
      throw new DomainException({
        code: ErrorCode.SERVER_ERROR,
        message: 'Failed to calculate GPA',
      });
    }
  }

  async getTotalCredits(studentId: string): Promise<number> {
    if (!studentId || studentId.trim().length === 0) {
      throw new DomainException({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Student ID is required',
      });
    }

    try {
      const grades = await this.gradeGateway.getStudentGrades(studentId.trim());
      return GradeCalculations.calculateTotalCredits(grades);
    } catch (error) {
      if (error instanceof DomainException) {
        throw error;
      }
      throw new DomainException({
        code: ErrorCode.SERVER_ERROR,
        message: 'Failed to calculate total credits',
      });
    }
  }

  async getEarnedCredits(studentId: string): Promise<number> {
    if (!studentId || studentId.trim().length === 0) {
      throw new DomainException({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Student ID is required',
      });
    }

    try {
      const grades = await this.gradeGateway.getStudentGrades(studentId.trim());
      return GradeCalculations.calculateEarnedCredits(grades);
    } catch (error) {
      if (error instanceof DomainException) {
        throw error;
      }
      throw new DomainException({
        code: ErrorCode.SERVER_ERROR,
        message: 'Failed to calculate earned credits',
      });
    }
  }

  async getGradesBySemester(
    studentId: string
  ): Promise<Record<string, Grade[]>> {
    if (!studentId || studentId.trim().length === 0) {
      throw new DomainException({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Student ID is required',
      });
    }

    try {
      const grades = await this.gradeGateway.getStudentGrades(studentId.trim());
      return GradeCalculations.getGradesBysemester(grades);
    } catch (error) {
      if (error instanceof DomainException) {
        throw error;
      }
      throw new DomainException({
        code: ErrorCode.SERVER_ERROR,
        message: 'Failed to fetch grades by semester',
      });
    }
  }

  async submitGradeCorrection(
    correction: GradeCorrectionRequest
  ): Promise<GradeCorrection> {
    // First, get the current grade to validate the correction request
    const currentGrade = await this.getGradeById(
      correction.gradeId,
      correction.studentId
    );
    if (!currentGrade) {
      throw new DomainException({
        code: ErrorCode.GRADE_NOT_FOUND,
        message: 'Grade not found',
      });
    }

    // Validate the correction request
    const validation = this.validateCorrectionRequest(
      correction,
      currentGrade.grade
    );
    if (!validation.isValid) {
      throw new DomainException({
        code: ErrorCode.VALIDATION_ERROR,
        message: validation.errors.join(', '),
      });
    }

    // Check if the grade is eligible for correction
    if (!GradeBusinessRules.isGradeEligibleForCorrection(currentGrade.grade)) {
      throw new DomainException({
        code: ErrorCode.CORRECTION_NOT_ALLOWED,
        message: 'This grade is not eligible for correction',
      });
    }

    // Check if student can submit a new correction
    const canSubmit = await this.canSubmitCorrection(
      correction.gradeId,
      correction.studentId
    );
    if (!canSubmit) {
      throw new DomainException({
        code: ErrorCode.CORRECTION_NOT_ALLOWED,
        message: 'Cannot submit correction for this grade at this time',
      });
    }

    try {
      return await this.gradeGateway.submitGradeCorrection(correction);
    } catch (error) {
      if (error instanceof DomainException) {
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
    if (!studentId || studentId.trim().length === 0) {
      throw new DomainException({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Student ID is required',
      });
    }

    try {
      return await this.gradeGateway.getGradeCorrections(
        studentId.trim(),
        filters
      );
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
    if (!studentId || studentId.trim().length === 0) {
      throw new DomainException({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Student ID is required',
      });
    }

    if (page < 1) {
      throw new DomainException({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Page must be greater than 0',
      });
    }

    if (limit < 1 || limit > 100) {
      throw new DomainException({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Limit must be between 1 and 100',
      });
    }

    try {
      return await this.gradeGateway.getGradeCorrectionsPaginated(
        studentId.trim(),
        page,
        limit,
        filters
      );
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
    if (!correctionId || correctionId.trim().length === 0) {
      throw new DomainException({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Correction ID is required',
      });
    }

    if (!studentId || studentId.trim().length === 0) {
      throw new DomainException({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Student ID is required',
      });
    }

    try {
      return await this.gradeGateway.getCorrectionById(
        correctionId.trim(),
        studentId.trim()
      );
    } catch (error) {
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
    if (!gradeId || gradeId.trim().length === 0) {
      throw new DomainException({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Grade ID is required',
      });
    }

    if (!studentId || studentId.trim().length === 0) {
      throw new DomainException({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Student ID is required',
      });
    }

    try {
      return await this.gradeGateway.canSubmitCorrection(
        gradeId.trim(),
        studentId.trim()
      );
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
    if (!gradeId || gradeId.trim().length === 0) {
      throw new DomainException({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Grade ID is required',
      });
    }

    if (!studentId || studentId.trim().length === 0) {
      throw new DomainException({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Student ID is required',
      });
    }

    try {
      return await this.gradeGateway.getCorrectionAttempts(
        gradeId.trim(),
        studentId.trim()
      );
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

  validateGradeData(gradeData: Omit<Grade, 'id'>): ValidationResult {
    return GradeValidator.validateGradeData(gradeData);
  }

  validateCorrectionRequest(
    request: GradeCorrectionRequest,
    currentGrade?: string
  ): ValidationResult {
    return GradeCorrectionValidator.validateCorrectionRequest(
      request,
      currentGrade
    );
  }

  // Additional utility methods for statistics
  async getGradeStatistics(studentId: string): Promise<GradeStatistics> {
    if (!studentId || studentId.trim().length === 0) {
      throw new DomainException({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Student ID is required',
      });
    }

    try {
      const grades = await this.gradeGateway.getStudentGrades(studentId.trim());
      const gradesBySemester = GradeCalculations.getGradesBysemester(grades);

      const semesterGPA: Record<string, number> = {};
      for (const [semester, semesterGrades] of Object.entries(
        gradesBySemester
      )) {
        semesterGPA[semester] = GradeCalculations.calculateGPA(semesterGrades);
      }

      const gradeDistribution: Record<string, number> = {};
      grades.forEach((grade) => {
        gradeDistribution[grade.grade] =
          (gradeDistribution[grade.grade] || 0) + 1;
      });

      return {
        totalCredits: GradeCalculations.calculateTotalCredits(grades),
        earnedCredits: GradeCalculations.calculateEarnedCredits(grades),
        gpa: GradeCalculations.calculateGPA(grades),
        semesterGPA,
        gradeDistribution,
        passingGrades: grades.filter((g) =>
          GradeBusinessRules.isPassingGrade(g.grade)
        ).length,
        failingGrades: grades.filter(
          (g) => !GradeBusinessRules.isPassingGrade(g.grade)
        ).length,
      };
    } catch (error) {
      if (error instanceof DomainException) {
        throw error;
      }
      throw new DomainException({
        code: ErrorCode.SERVER_ERROR,
        message: 'Failed to calculate grade statistics',
      });
    }
  }

  async getCorrectionSummary(studentId: string): Promise<CorrectionSummary> {
    if (!studentId || studentId.trim().length === 0) {
      throw new DomainException({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Student ID is required',
      });
    }

    try {
      const corrections = await this.gradeGateway.getGradeCorrections(
        studentId.trim()
      );

      const totalRequests = corrections.length;
      const pendingRequests = corrections.filter(
        (c) => c.status === 'pending'
      ).length;
      const approvedRequests = corrections.filter(
        (c) => c.status === 'approved'
      ).length;
      const rejectedRequests = corrections.filter(
        (c) => c.status === 'rejected'
      ).length;

      // Calculate average processing days for completed requests
      const completedCorrections = corrections.filter((c) => c.reviewDate);
      const averageProcessingDays =
        completedCorrections.length > 0
          ? completedCorrections.reduce((sum, correction) => {
              const processingTime =
                correction.reviewDate!.getTime() -
                correction.submissionDate.getTime();
              return sum + processingTime / (1000 * 60 * 60 * 24);
            }, 0) / completedCorrections.length
          : 0;

      return {
        totalRequests,
        pendingRequests,
        approvedRequests,
        rejectedRequests,
        averageProcessingDays: Math.round(averageProcessingDays * 100) / 100,
      };
    } catch (error) {
      if (error instanceof DomainException) {
        throw error;
      }
      throw new DomainException({
        code: ErrorCode.SERVER_ERROR,
        message: 'Failed to get correction summary',
      });
    }
  }
}
