import { GradeUseCaseImpl, GradeUseCase } from '../GradeUseCase';
import { Grade } from '../../entities/Grade';
import {
  GradeCorrection,
  GradeCorrectionRequest,
} from '../../entities/GradeCorrection';
import { GradeGateway } from '../../adapters/gateways/GradeApiGateway';
import {
  ErrorCode,
  DomainException,
  PaginatedResponse,
} from '../../shared/types';

// Mock the GradeGateway
const mockGradeGateway: jest.Mocked<GradeGateway> = {
  getStudentGrades: jest.fn(),
  getStudentGradesPaginated: jest.fn(),
  getGradeById: jest.fn(),
  submitGradeCorrection: jest.fn(),
  getGradeCorrections: jest.fn(),
  getGradeCorrectionsPaginated: jest.fn(),
  getCorrectionById: jest.fn(),
  canSubmitCorrection: jest.fn(),
  getCorrectionAttempts: jest.fn(),
};

describe('GradeUseCase', () => {
  let gradeUseCase: GradeUseCase;

  beforeEach(() => {
    gradeUseCase = new GradeUseCaseImpl(mockGradeGateway);
    jest.clearAllMocks();
  });

  const mockGrade: Grade = {
    id: 'grade-1',
    courseCode: 'CS101',
    courseName: 'Introduction to Computer Science',
    grade: 'A',
    creditHours: 3,
    semester: 'Fall 2023',
    studentId: 'student-1',
  };

  const mockGrades: Grade[] = [
    mockGrade,
    {
      id: 'grade-2',
      courseCode: 'MATH201',
      courseName: 'Calculus I',
      grade: 'B+',
      creditHours: 4,
      semester: 'Fall 2023',
      studentId: 'student-1',
    },
  ];

  const mockCorrection: GradeCorrection = {
    id: 'correction-1',
    gradeId: 'grade-1',
    studentId: 'student-1',
    requestedGrade: 'A+',
    reason: 'I believe there was an error in grading my final exam',
    supportingDetails: 'I have reviewed my exam and found discrepancies',
    status: 'pending',
    submissionDate: new Date('2023-12-01'),
    reviewDate: undefined,
  };

  const mockCorrectionRequest: GradeCorrectionRequest = {
    gradeId: 'grade-1',
    studentId: 'student-1',
    requestedGrade: 'A+',
    reason: 'I believe there was an error in grading my final exam',
    supportingDetails: 'I have reviewed my exam and found discrepancies',
  };

  describe('getStudentGrades', () => {
    it('should fetch student grades successfully', async () => {
      mockGradeGateway.getStudentGrades.mockResolvedValue(mockGrades);

      const result = await gradeUseCase.getStudentGrades('student-1');

      expect(result).toEqual(mockGrades);
      expect(mockGradeGateway.getStudentGrades).toHaveBeenCalledWith(
        'student-1',
        undefined
      );
    });

    it('should fetch student grades with filters', async () => {
      const filters = { semester: 'Fall 2023' };
      mockGradeGateway.getStudentGrades.mockResolvedValue(mockGrades);

      const result = await gradeUseCase.getStudentGrades('student-1', filters);

      expect(result).toEqual(mockGrades);
      expect(mockGradeGateway.getStudentGrades).toHaveBeenCalledWith(
        'student-1',
        filters
      );
    });

    it('should throw validation error for empty student ID', async () => {
      await expect(gradeUseCase.getStudentGrades('')).rejects.toThrow(
        new DomainException({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Student ID is required',
        })
      );
    });

    it('should handle gateway errors', async () => {
      mockGradeGateway.getStudentGrades.mockRejectedValue(
        new Error('Network error')
      );

      await expect(gradeUseCase.getStudentGrades('student-1')).rejects.toThrow(
        new DomainException({
          code: ErrorCode.SERVER_ERROR,
          message: 'Failed to fetch student grades',
        })
      );
    });
  });

  describe('getStudentGradesPaginated', () => {
    const mockPaginatedResponse: PaginatedResponse<Grade> = {
      data: mockGrades,
      pagination: {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    };

    it('should fetch paginated grades successfully', async () => {
      mockGradeGateway.getStudentGradesPaginated.mockResolvedValue(
        mockPaginatedResponse
      );

      const result = await gradeUseCase.getStudentGradesPaginated(
        'student-1',
        1,
        10
      );

      expect(result).toEqual(mockPaginatedResponse);
      expect(mockGradeGateway.getStudentGradesPaginated).toHaveBeenCalledWith(
        'student-1',
        1,
        10,
        undefined
      );
    });

    it('should validate pagination parameters', async () => {
      await expect(
        gradeUseCase.getStudentGradesPaginated('student-1', 0, 10)
      ).rejects.toThrow(
        new DomainException({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Page must be greater than 0',
        })
      );

      await expect(
        gradeUseCase.getStudentGradesPaginated('student-1', 1, 0)
      ).rejects.toThrow(
        new DomainException({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Limit must be between 1 and 100',
        })
      );

      await expect(
        gradeUseCase.getStudentGradesPaginated('student-1', 1, 101)
      ).rejects.toThrow(
        new DomainException({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Limit must be between 1 and 100',
        })
      );
    });
  });

  describe('getGradeById', () => {
    it('should fetch grade by ID successfully', async () => {
      mockGradeGateway.getGradeById.mockResolvedValue(mockGrade);

      const result = await gradeUseCase.getGradeById('grade-1', 'student-1');

      expect(result).toEqual(mockGrade);
      expect(mockGradeGateway.getGradeById).toHaveBeenCalledWith(
        'grade-1',
        'student-1'
      );
    });

    it('should return null when grade not found', async () => {
      mockGradeGateway.getGradeById.mockResolvedValue(null);

      const result = await gradeUseCase.getGradeById('grade-1', 'student-1');

      expect(result).toBeNull();
    });

    it('should validate required parameters', async () => {
      await expect(gradeUseCase.getGradeById('', 'student-1')).rejects.toThrow(
        new DomainException({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Grade ID is required',
        })
      );

      await expect(gradeUseCase.getGradeById('grade-1', '')).rejects.toThrow(
        new DomainException({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Student ID is required',
        })
      );
    });
  });

  describe('calculateGPA', () => {
    it('should calculate GPA successfully', async () => {
      mockGradeGateway.getStudentGrades.mockResolvedValue(mockGrades);

      const result = await gradeUseCase.calculateGPA('student-1');

      expect(result).toBeCloseTo(3.6, 1); // A (4.0) * 3 credits + B+ (3.3) * 4 credits = 25.2 / 7 credits = 3.6
      expect(mockGradeGateway.getStudentGrades).toHaveBeenCalledWith(
        'student-1',
        undefined
      );
    });

    it('should calculate semester GPA', async () => {
      mockGradeGateway.getStudentGrades.mockResolvedValue(mockGrades);

      const result = await gradeUseCase.calculateGPA('student-1', 'Fall 2023');

      expect(result).toBeCloseTo(3.6, 1);
      expect(mockGradeGateway.getStudentGrades).toHaveBeenCalledWith(
        'student-1',
        { semester: 'Fall 2023' }
      );
    });
  });

  describe('getTotalCredits', () => {
    it('should calculate total credits successfully', async () => {
      mockGradeGateway.getStudentGrades.mockResolvedValue(mockGrades);

      const result = await gradeUseCase.getTotalCredits('student-1');

      expect(result).toBe(7); // 3 + 4 credits
      expect(mockGradeGateway.getStudentGrades).toHaveBeenCalledWith(
        'student-1'
      );
    });
  });

  describe('getEarnedCredits', () => {
    it('should calculate earned credits successfully', async () => {
      mockGradeGateway.getStudentGrades.mockResolvedValue(mockGrades);

      const result = await gradeUseCase.getEarnedCredits('student-1');

      expect(result).toBe(7); // Both A and B+ are passing grades
      expect(mockGradeGateway.getStudentGrades).toHaveBeenCalledWith(
        'student-1'
      );
    });
  });

  describe('getGradesBySemester', () => {
    it('should group grades by semester successfully', async () => {
      const gradesMultipleSemesters = [
        ...mockGrades,
        {
          id: 'grade-3',
          courseCode: 'ENG101',
          courseName: 'English Composition',
          grade: 'A-',
          creditHours: 3,
          semester: 'Spring 2024',
          studentId: 'student-1',
        },
      ];
      mockGradeGateway.getStudentGrades.mockResolvedValue(
        gradesMultipleSemesters
      );

      const result = await gradeUseCase.getGradesBySemester('student-1');

      expect(result).toEqual({
        'Fall 2023': mockGrades,
        'Spring 2024': [gradesMultipleSemesters[2]],
      });
    });
  });

  describe('submitGradeCorrection', () => {
    it('should submit grade correction successfully', async () => {
      mockGradeGateway.getGradeById.mockResolvedValue(mockGrade);
      mockGradeGateway.canSubmitCorrection.mockResolvedValue(true);
      mockGradeGateway.submitGradeCorrection.mockResolvedValue(mockCorrection);

      const result = await gradeUseCase.submitGradeCorrection(
        mockCorrectionRequest
      );

      expect(result).toEqual(mockCorrection);
      expect(mockGradeGateway.getGradeById).toHaveBeenCalledWith(
        'grade-1',
        'student-1'
      );
      expect(mockGradeGateway.canSubmitCorrection).toHaveBeenCalledWith(
        'grade-1',
        'student-1'
      );
      expect(mockGradeGateway.submitGradeCorrection).toHaveBeenCalledWith(
        mockCorrectionRequest
      );
    });

    it('should throw error when grade not found', async () => {
      mockGradeGateway.getGradeById.mockResolvedValue(null);

      await expect(
        gradeUseCase.submitGradeCorrection(mockCorrectionRequest)
      ).rejects.toThrow(
        new DomainException({
          code: ErrorCode.GRADE_NOT_FOUND,
          message: 'Grade not found',
        })
      );
    });

    it('should throw error when grade not eligible for correction', async () => {
      const incompleteGrade = { ...mockGrade, grade: 'I' };
      mockGradeGateway.getGradeById.mockResolvedValue(incompleteGrade);

      await expect(
        gradeUseCase.submitGradeCorrection(mockCorrectionRequest)
      ).rejects.toThrow(
        new DomainException({
          code: ErrorCode.CORRECTION_NOT_ALLOWED,
          message: 'This grade is not eligible for correction',
        })
      );
    });

    it('should throw error when cannot submit correction', async () => {
      mockGradeGateway.getGradeById.mockResolvedValue(mockGrade);
      mockGradeGateway.canSubmitCorrection.mockResolvedValue(false);

      await expect(
        gradeUseCase.submitGradeCorrection(mockCorrectionRequest)
      ).rejects.toThrow(
        new DomainException({
          code: ErrorCode.CORRECTION_NOT_ALLOWED,
          message: 'Cannot submit correction for this grade at this time',
        })
      );
    });

    it('should validate correction request', async () => {
      mockGradeGateway.getGradeById.mockResolvedValue(mockGrade);
      const invalidRequest = { ...mockCorrectionRequest, reason: '' };

      try {
        await gradeUseCase.submitGradeCorrection(invalidRequest);
        fail('Expected validation error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(DomainException);
        expect((error as DomainException).code).toBe(
          ErrorCode.VALIDATION_ERROR
        );
        expect((error as DomainException).message).toContain(
          'Reason is required'
        );
      }
    });
  });

  describe('getGradeCorrections', () => {
    it('should fetch grade corrections successfully', async () => {
      mockGradeGateway.getGradeCorrections.mockResolvedValue([mockCorrection]);

      const result = await gradeUseCase.getGradeCorrections('student-1');

      expect(result).toEqual([mockCorrection]);
      expect(mockGradeGateway.getGradeCorrections).toHaveBeenCalledWith(
        'student-1',
        undefined
      );
    });

    it('should fetch grade corrections with filters', async () => {
      const filters = { status: 'pending' as const };
      mockGradeGateway.getGradeCorrections.mockResolvedValue([mockCorrection]);

      const result = await gradeUseCase.getGradeCorrections(
        'student-1',
        filters
      );

      expect(result).toEqual([mockCorrection]);
      expect(mockGradeGateway.getGradeCorrections).toHaveBeenCalledWith(
        'student-1',
        filters
      );
    });
  });

  describe('canSubmitCorrection', () => {
    it('should check correction eligibility successfully', async () => {
      mockGradeGateway.canSubmitCorrection.mockResolvedValue(true);

      const result = await gradeUseCase.canSubmitCorrection(
        'grade-1',
        'student-1'
      );

      expect(result).toBe(true);
      expect(mockGradeGateway.canSubmitCorrection).toHaveBeenCalledWith(
        'grade-1',
        'student-1'
      );
    });

    it('should validate required parameters', async () => {
      await expect(
        gradeUseCase.canSubmitCorrection('', 'student-1')
      ).rejects.toThrow(
        new DomainException({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Grade ID is required',
        })
      );
    });
  });

  describe('getCorrectionAttempts', () => {
    it('should get correction attempts count successfully', async () => {
      mockGradeGateway.getCorrectionAttempts.mockResolvedValue(2);

      const result = await gradeUseCase.getCorrectionAttempts(
        'grade-1',
        'student-1'
      );

      expect(result).toBe(2);
      expect(mockGradeGateway.getCorrectionAttempts).toHaveBeenCalledWith(
        'grade-1',
        'student-1'
      );
    });
  });

  describe('validateGradeData', () => {
    it('should validate valid grade data', () => {
      const gradeData = {
        courseCode: 'CS101',
        courseName: 'Introduction to Computer Science',
        grade: 'A',
        creditHours: 3,
        semester: 'Fall 2023',
        studentId: 'student-1',
      };

      const result = gradeUseCase.validateGradeData(gradeData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should validate invalid grade data', () => {
      const gradeData = {
        courseCode: '',
        courseName: '',
        grade: 'X',
        creditHours: 0,
        semester: '',
        studentId: '',
      };

      const result = gradeUseCase.validateGradeData(gradeData);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateCorrectionRequest', () => {
    it('should validate valid correction request', () => {
      const result = gradeUseCase.validateCorrectionRequest(
        mockCorrectionRequest,
        'B'
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should validate invalid correction request', () => {
      const invalidRequest = {
        ...mockCorrectionRequest,
        reason: '',
        requestedGrade: 'X',
      };

      const result = gradeUseCase.validateCorrectionRequest(
        invalidRequest,
        'B'
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('getGradeStatistics', () => {
    it('should calculate grade statistics successfully', async () => {
      mockGradeGateway.getStudentGrades.mockResolvedValue(mockGrades);

      const result = await gradeUseCase.getGradeStatistics('student-1');

      expect(result).toEqual({
        totalCredits: 7,
        earnedCredits: 7,
        gpa: expect.any(Number),
        semesterGPA: {
          'Fall 2023': expect.any(Number),
        },
        gradeDistribution: {
          A: 1,
          'B+': 1,
        },
        passingGrades: 2,
        failingGrades: 0,
      });
    });
  });

  describe('getCorrectionSummary', () => {
    it('should calculate correction summary successfully', async () => {
      const corrections = [
        mockCorrection,
        {
          ...mockCorrection,
          id: 'correction-2',
          status: 'approved' as const,
          reviewDate: new Date('2023-12-05'),
        },
      ];
      mockGradeGateway.getGradeCorrections.mockResolvedValue(corrections);

      const result = await gradeUseCase.getCorrectionSummary('student-1');

      expect(result).toEqual({
        totalRequests: 2,
        pendingRequests: 1,
        approvedRequests: 1,
        rejectedRequests: 0,
        averageProcessingDays: expect.any(Number),
      });
    });
  });
});
