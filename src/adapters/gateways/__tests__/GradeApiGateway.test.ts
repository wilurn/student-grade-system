import { GradeApiGateway } from '../GradeApiGateway';
import { HttpClient } from '../../../frameworks/api/HttpClient';
import { Grade } from '../../../entities/Grade';
import {
  GradeCorrection,
  GradeCorrectionRequest,
} from '../../../entities/GradeCorrection';
import {
  ErrorCode,
  DomainException,
  GradeFilters,
  CorrectionFilters,
  PaginatedResponse,
} from '../../../shared/types';

// Mock HttpClient
const mockHttpClient: jest.Mocked<HttpClient> = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  setAuthToken: jest.fn(),
  removeAuthToken: jest.fn(),
};

describe('GradeApiGateway', () => {
  let gradeGateway: GradeApiGateway;

  const mockGrade: Grade = {
    id: 'grade-1',
    courseCode: 'CS101',
    courseName: 'Introduction to Computer Science',
    grade: 'A',
    creditHours: 3,
    semester: 'Fall 2023',
    studentId: 'student-1',
  };

  const mockGradeCorrection: GradeCorrection = {
    id: 'correction-1',
    gradeId: 'grade-1',
    studentId: 'student-1',
    requestedGrade: 'A+',
    reason: 'Calculation error in final exam',
    supportingDetails: 'I believe there was an error in grading my final exam.',
    status: 'pending',
    submissionDate: new Date('2023-12-01'),
    reviewDate: undefined,
  };

  const mockCorrectionRequest: GradeCorrectionRequest = {
    gradeId: 'grade-1',
    studentId: 'student-1',
    requestedGrade: 'A+',
    reason: 'Calculation error in final exam',
    supportingDetails: 'I believe there was an error in grading my final exam.',
  };

  beforeEach(() => {
    gradeGateway = new GradeApiGateway(mockHttpClient);
    jest.clearAllMocks();
  });

  describe('getStudentGrades', () => {
    it('should fetch student grades successfully', async () => {
      const mockResponse = {
        grades: [mockGrade],
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await gradeGateway.getStudentGrades('student-1');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/grades/student-1');
      expect(result).toEqual([mockGrade]);
    });

    it('should fetch student grades with filters', async () => {
      const mockResponse = {
        grades: [mockGrade],
      };
      const filters: GradeFilters = {
        semester: 'Fall 2023',
        courseCode: 'CS101',
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await gradeGateway.getStudentGrades('student-1', filters);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/grades/student-1?semester=Fall+2023&courseCode=CS101'
      );
      expect(result).toEqual([mockGrade]);
    });

    it('should handle invalid response format', async () => {
      mockHttpClient.get.mockResolvedValue({
        grades: null,
      });

      await expect(gradeGateway.getStudentGrades('student-1')).rejects.toThrow(
        DomainException
      );
      await expect(
        gradeGateway.getStudentGrades('student-1')
      ).rejects.toMatchObject({
        code: ErrorCode.SERVER_ERROR,
        message: 'Invalid grades response format',
      });
    });

    it('should handle network errors', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('Network error'));

      await expect(gradeGateway.getStudentGrades('student-1')).rejects.toThrow(
        DomainException
      );
      await expect(
        gradeGateway.getStudentGrades('student-1')
      ).rejects.toMatchObject({
        code: ErrorCode.SERVER_ERROR,
        message: 'Failed to fetch student grades',
      });
    });

    it('should propagate domain exceptions', async () => {
      const domainError = new DomainException({
        code: ErrorCode.NOT_FOUND_ERROR,
        message: 'Student not found',
      });

      mockHttpClient.get.mockRejectedValue(domainError);

      await expect(gradeGateway.getStudentGrades('student-1')).rejects.toThrow(
        domainError
      );
    });
  });

  describe('getStudentGradesPaginated', () => {
    it('should fetch paginated grades successfully', async () => {
      const mockResponse: PaginatedResponse<Grade> = {
        data: [mockGrade],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await gradeGateway.getStudentGradesPaginated(
        'student-1',
        1,
        10
      );

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/grades/student-1/paginated?page=1&limit=10'
      );
      expect(result).toEqual(mockResponse);
    });

    it('should fetch paginated grades with filters', async () => {
      const mockResponse: PaginatedResponse<Grade> = {
        data: [mockGrade],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };
      const filters: GradeFilters = {
        semester: 'Fall 2023',
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await gradeGateway.getStudentGradesPaginated(
        'student-1',
        1,
        10,
        filters
      );

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/grades/student-1/paginated?page=1&limit=10&semester=Fall+2023'
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle invalid paginated response format', async () => {
      mockHttpClient.get.mockResolvedValue({
        data: null,
        pagination: null,
      });

      await expect(
        gradeGateway.getStudentGradesPaginated('student-1', 1, 10)
      ).rejects.toThrow(DomainException);
      await expect(
        gradeGateway.getStudentGradesPaginated('student-1', 1, 10)
      ).rejects.toMatchObject({
        code: ErrorCode.SERVER_ERROR,
        message: 'Invalid paginated grades response format',
      });
    });
  });

  describe('getGradeById', () => {
    it('should fetch grade by ID successfully', async () => {
      const mockResponse = {
        grade: mockGrade,
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await gradeGateway.getGradeById('grade-1', 'student-1');

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/grades/student-1/grade/grade-1'
      );
      expect(result).toEqual(mockGrade);
    });

    it('should return null when grade not found', async () => {
      const notFoundError = new DomainException({
        code: ErrorCode.NOT_FOUND_ERROR,
        message: 'Grade not found',
      });

      mockHttpClient.get.mockRejectedValue(notFoundError);

      const result = await gradeGateway.getGradeById('grade-1', 'student-1');

      expect(result).toBeNull();
    });

    it('should handle other domain exceptions', async () => {
      const domainError = new DomainException({
        code: ErrorCode.AUTHORIZATION_ERROR,
        message: 'Access denied',
      });

      mockHttpClient.get.mockRejectedValue(domainError);

      await expect(
        gradeGateway.getGradeById('grade-1', 'student-1')
      ).rejects.toThrow(domainError);
    });
  });

  describe('submitGradeCorrection', () => {
    it('should submit grade correction successfully', async () => {
      const mockResponse = {
        correction: mockGradeCorrection,
      };

      mockHttpClient.post.mockResolvedValue(mockResponse);

      const result = await gradeGateway.submitGradeCorrection(
        mockCorrectionRequest
      );

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/grades/corrections',
        mockCorrectionRequest
      );
      expect(result).toEqual(mockGradeCorrection);
    });

    it('should handle duplicate correction error', async () => {
      const duplicateError = new DomainException({
        code: ErrorCode.DUPLICATE_ERROR,
        message: 'Duplicate correction',
      });

      mockHttpClient.post.mockRejectedValue(duplicateError);

      await expect(
        gradeGateway.submitGradeCorrection(mockCorrectionRequest)
      ).rejects.toThrow(DomainException);
      await expect(
        gradeGateway.submitGradeCorrection(mockCorrectionRequest)
      ).rejects.toMatchObject({
        code: ErrorCode.DUPLICATE_CORRECTION,
        message: 'A correction request for this grade is already pending',
      });
    });

    it('should handle business rule errors', async () => {
      const businessRuleError = new DomainException({
        code: ErrorCode.BUSINESS_RULE_ERROR,
        message: 'Maximum corrections reached',
      });

      mockHttpClient.post.mockRejectedValue(businessRuleError);

      await expect(
        gradeGateway.submitGradeCorrection(mockCorrectionRequest)
      ).rejects.toThrow(DomainException);
      await expect(
        gradeGateway.submitGradeCorrection(mockCorrectionRequest)
      ).rejects.toMatchObject({
        code: ErrorCode.CORRECTION_NOT_ALLOWED,
        message: 'Maximum corrections reached',
      });
    });

    it('should handle invalid response format', async () => {
      mockHttpClient.post.mockResolvedValue({
        correction: null,
      });

      await expect(
        gradeGateway.submitGradeCorrection(mockCorrectionRequest)
      ).rejects.toThrow(DomainException);
      await expect(
        gradeGateway.submitGradeCorrection(mockCorrectionRequest)
      ).rejects.toMatchObject({
        code: ErrorCode.SERVER_ERROR,
        message: 'Invalid correction response format',
      });
    });

    it('should handle network errors', async () => {
      mockHttpClient.post.mockRejectedValue(new Error('Network error'));

      await expect(
        gradeGateway.submitGradeCorrection(mockCorrectionRequest)
      ).rejects.toThrow(DomainException);
      await expect(
        gradeGateway.submitGradeCorrection(mockCorrectionRequest)
      ).rejects.toMatchObject({
        code: ErrorCode.SERVER_ERROR,
        message: 'Failed to submit grade correction',
      });
    });
  });

  describe('getGradeCorrections', () => {
    it('should fetch grade corrections successfully', async () => {
      const mockResponse = {
        corrections: [mockGradeCorrection],
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await gradeGateway.getGradeCorrections('student-1');

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/grades/corrections/student-1'
      );
      expect(result).toEqual([mockGradeCorrection]);
    });

    it('should fetch grade corrections with filters', async () => {
      const mockResponse = {
        corrections: [mockGradeCorrection],
      };
      const filters: CorrectionFilters = {
        status: 'pending',
        semester: 'Fall 2023',
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await gradeGateway.getGradeCorrections(
        'student-1',
        filters
      );

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/grades/corrections/student-1?status=pending&semester=Fall+2023'
      );
      expect(result).toEqual([mockGradeCorrection]);
    });

    it('should handle date filters', async () => {
      const mockResponse = {
        corrections: [mockGradeCorrection],
      };
      const filters: CorrectionFilters = {
        dateFrom: new Date('2023-01-01'),
        dateTo: new Date('2023-12-31'),
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      await gradeGateway.getGradeCorrections('student-1', filters);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/grades/corrections/student-1?dateFrom=2023-01-01T00%3A00%3A00.000Z&dateTo=2023-12-31T00%3A00%3A00.000Z'
      );
    });

    it('should handle invalid response format', async () => {
      mockHttpClient.get.mockResolvedValue({
        corrections: null,
      });

      await expect(
        gradeGateway.getGradeCorrections('student-1')
      ).rejects.toThrow(DomainException);
      await expect(
        gradeGateway.getGradeCorrections('student-1')
      ).rejects.toMatchObject({
        code: ErrorCode.SERVER_ERROR,
        message: 'Invalid corrections response format',
      });
    });
  });

  describe('getGradeCorrectionsPaginated', () => {
    it('should fetch paginated corrections successfully', async () => {
      const mockResponse: PaginatedResponse<GradeCorrection> = {
        data: [mockGradeCorrection],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await gradeGateway.getGradeCorrectionsPaginated(
        'student-1',
        1,
        10
      );

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/grades/corrections/student-1/paginated?page=1&limit=10'
      );
      expect(result).toEqual(mockResponse);
    });

    it('should fetch paginated corrections with filters', async () => {
      const mockResponse: PaginatedResponse<GradeCorrection> = {
        data: [mockGradeCorrection],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };
      const filters: CorrectionFilters = {
        status: 'approved',
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await gradeGateway.getGradeCorrectionsPaginated(
        'student-1',
        1,
        10,
        filters
      );

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/grades/corrections/student-1/paginated?page=1&limit=10&status=approved'
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getCorrectionById', () => {
    it('should fetch correction by ID successfully', async () => {
      const mockResponse = {
        correction: mockGradeCorrection,
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await gradeGateway.getCorrectionById(
        'correction-1',
        'student-1'
      );

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/grades/corrections/student-1/correction/correction-1'
      );
      expect(result).toEqual(mockGradeCorrection);
    });

    it('should return null when correction not found', async () => {
      const notFoundError = new DomainException({
        code: ErrorCode.NOT_FOUND_ERROR,
        message: 'Correction not found',
      });

      mockHttpClient.get.mockRejectedValue(notFoundError);

      const result = await gradeGateway.getCorrectionById(
        'correction-1',
        'student-1'
      );

      expect(result).toBeNull();
    });
  });

  describe('canSubmitCorrection', () => {
    it('should check correction eligibility successfully', async () => {
      const mockResponse = {
        canSubmit: true,
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await gradeGateway.canSubmitCorrection(
        'grade-1',
        'student-1'
      );

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/grades/student-1/grade/grade-1/can-correct'
      );
      expect(result).toBe(true);
    });

    it('should handle eligibility check errors', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('Server error'));

      await expect(
        gradeGateway.canSubmitCorrection('grade-1', 'student-1')
      ).rejects.toThrow(DomainException);
      await expect(
        gradeGateway.canSubmitCorrection('grade-1', 'student-1')
      ).rejects.toMatchObject({
        code: ErrorCode.SERVER_ERROR,
        message: 'Failed to check correction eligibility',
      });
    });
  });

  describe('getCorrectionAttempts', () => {
    it('should get correction attempts count successfully', async () => {
      const mockResponse = {
        attempts: 2,
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await gradeGateway.getCorrectionAttempts(
        'grade-1',
        'student-1'
      );

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/grades/student-1/grade/grade-1/correction-attempts'
      );
      expect(result).toBe(2);
    });

    it('should handle attempts count errors', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('Server error'));

      await expect(
        gradeGateway.getCorrectionAttempts('grade-1', 'student-1')
      ).rejects.toThrow(DomainException);
      await expect(
        gradeGateway.getCorrectionAttempts('grade-1', 'student-1')
      ).rejects.toMatchObject({
        code: ErrorCode.SERVER_ERROR,
        message: 'Failed to get correction attempts count',
      });
    });
  });

  describe('query building methods', () => {
    it('should build grade filters query correctly', async () => {
      const filters: GradeFilters = {
        semester: 'Fall 2023',
        courseCode: 'CS101',
        minGrade: 'B',
        maxGrade: 'A+',
      };

      mockHttpClient.get.mockResolvedValue({ grades: [] });

      await gradeGateway.getStudentGrades('student-1', filters);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/grades/student-1?semester=Fall+2023&courseCode=CS101&minGrade=B&maxGrade=A%2B'
      );
    });

    it('should build correction filters query correctly', async () => {
      const filters: CorrectionFilters = {
        status: 'pending',
        semester: 'Fall 2023',
        dateFrom: new Date('2023-01-01'),
        dateTo: new Date('2023-12-31'),
      };

      mockHttpClient.get.mockResolvedValue({ corrections: [] });

      await gradeGateway.getGradeCorrections('student-1', filters);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/api/grades/corrections/student-1?status=pending&semester=Fall+2023&dateFrom=2023-01-01T00%3A00%3A00.000Z&dateTo=2023-12-31T00%3A00%3A00.000Z'
      );
    });

    it('should handle empty filters', async () => {
      mockHttpClient.get.mockResolvedValue({ grades: [] });

      await gradeGateway.getStudentGrades('student-1', {});

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/grades/student-1');
    });

    it('should handle undefined filters', async () => {
      mockHttpClient.get.mockResolvedValue({ grades: [] });

      await gradeGateway.getStudentGrades('student-1');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/grades/student-1');
    });
  });
});
