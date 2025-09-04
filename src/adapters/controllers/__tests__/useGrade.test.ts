import { renderHook, act } from '@testing-library/react';
import { useGrade, useGradeCorrectionForm } from '../useGrade';
import { GradeUseCase } from '../../../usecases/GradeUseCase';
import { Grade } from '../../../entities/Grade';
import {
  GradeCorrection,
  GradeCorrectionRequest,
} from '../../../entities/GradeCorrection';
import {
  ErrorCode,
  DomainException,
  PaginatedResponse,
} from '../../../shared/types';

// Mock the GradeUseCase
const mockGradeUseCase: jest.Mocked<GradeUseCase> = {
  getStudentGrades: jest.fn(),
  getStudentGradesPaginated: jest.fn(),
  getGradeById: jest.fn(),
  calculateGPA: jest.fn(),
  getTotalCredits: jest.fn(),
  getEarnedCredits: jest.fn(),
  getGradesBySemester: jest.fn(),
  submitGradeCorrection: jest.fn(),
  getGradeCorrections: jest.fn(),
  getGradeCorrectionsPaginated: jest.fn(),
  getCorrectionById: jest.fn(),
  canSubmitCorrection: jest.fn(),
  getCorrectionAttempts: jest.fn(),
  validateGradeData: jest.fn(),
  validateCorrectionRequest: jest.fn(),
  getGradeStatistics: jest.fn(),
  getCorrectionSummary: jest.fn(),
};

describe('useGrade', () => {
  beforeEach(() => {
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

  const mockGrades: Grade[] = [mockGrade];

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

  describe('fetchGrades', () => {
    it('should fetch grades successfully', async () => {
      mockGradeUseCase.getStudentGrades.mockResolvedValue(mockGrades);

      const { result } = renderHook(() => useGrade(mockGradeUseCase));

      expect(result.current.grades.isLoading).toBe(false);
      expect(result.current.grades.data).toBeNull();
      expect(result.current.grades.error).toBeNull();

      await act(async () => {
        await result.current.fetchGrades('student-1');
      });

      expect(result.current.grades.isLoading).toBe(false);
      expect(result.current.grades.data).toEqual(mockGrades);
      expect(result.current.grades.error).toBeNull();
      expect(mockGradeUseCase.getStudentGrades).toHaveBeenCalledWith(
        'student-1',
        undefined
      );
    });

    it('should handle fetch grades error', async () => {
      const error = new DomainException({
        code: ErrorCode.SERVER_ERROR,
        message: 'Failed to fetch grades',
      });
      mockGradeUseCase.getStudentGrades.mockRejectedValue(error);

      const { result } = renderHook(() => useGrade(mockGradeUseCase));

      await act(async () => {
        await result.current.fetchGrades('student-1');
      });

      expect(result.current.grades.isLoading).toBe(false);
      expect(result.current.grades.data).toBeNull();
      expect(result.current.grades.error).toBe('Failed to fetch grades');
    });

    it('should set loading state during fetch', async () => {
      let resolvePromise: (value: Grade[]) => void;
      const promise = new Promise<Grade[]>((resolve) => {
        resolvePromise = resolve;
      });
      mockGradeUseCase.getStudentGrades.mockReturnValue(promise);

      const { result } = renderHook(() => useGrade(mockGradeUseCase));

      act(() => {
        result.current.fetchGrades('student-1');
      });

      expect(result.current.grades.isLoading).toBe(true);
      expect(result.current.grades.error).toBeNull();

      await act(async () => {
        resolvePromise!(mockGrades);
        await promise;
      });

      expect(result.current.grades.isLoading).toBe(false);
      expect(result.current.grades.data).toEqual(mockGrades);
    });
  });

  describe('fetchGradesPaginated', () => {
    const mockPaginatedResponse: PaginatedResponse<Grade> = {
      data: mockGrades,
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    };

    it('should fetch paginated grades successfully', async () => {
      mockGradeUseCase.getStudentGradesPaginated.mockResolvedValue(
        mockPaginatedResponse
      );

      const { result } = renderHook(() => useGrade(mockGradeUseCase));

      let paginatedResult: PaginatedResponse<Grade>;
      await act(async () => {
        paginatedResult = await result.current.fetchGradesPaginated(
          'student-1',
          1,
          10
        );
      });

      expect(paginatedResult!).toEqual(mockPaginatedResponse);
      expect(mockGradeUseCase.getStudentGradesPaginated).toHaveBeenCalledWith(
        'student-1',
        1,
        10,
        undefined
      );
    });
  });

  describe('fetchGradeById', () => {
    it('should fetch grade by ID successfully', async () => {
      mockGradeUseCase.getGradeById.mockResolvedValue(mockGrade);

      const { result } = renderHook(() => useGrade(mockGradeUseCase));

      await act(async () => {
        await result.current.fetchGradeById('grade-1', 'student-1');
      });

      expect(result.current.selectedGrade.data).toEqual(mockGrade);
      expect(mockGradeUseCase.getGradeById).toHaveBeenCalledWith(
        'grade-1',
        'student-1'
      );
    });

    it('should handle grade not found', async () => {
      mockGradeUseCase.getGradeById.mockResolvedValue(null);

      const { result } = renderHook(() => useGrade(mockGradeUseCase));

      await act(async () => {
        await result.current.fetchGradeById('grade-1', 'student-1');
      });

      expect(result.current.selectedGrade.error).toBe('Grade not found');
    });
  });

  describe('calculateGPA', () => {
    it('should calculate GPA successfully', async () => {
      mockGradeUseCase.calculateGPA.mockResolvedValue(3.5);

      const { result } = renderHook(() => useGrade(mockGradeUseCase));

      let gpa: number;
      await act(async () => {
        gpa = await result.current.calculateGPA('student-1');
      });

      expect(gpa!).toBe(3.5);
      expect(mockGradeUseCase.calculateGPA).toHaveBeenCalledWith(
        'student-1',
        undefined
      );
    });
  });

  describe('submitGradeCorrection', () => {
    const mockCorrectionRequest: GradeCorrectionRequest = {
      gradeId: 'grade-1',
      studentId: 'student-1',
      requestedGrade: 'A+',
      reason: 'I believe there was an error in grading my final exam',
      supportingDetails: 'I have reviewed my exam and found discrepancies',
    };

    it('should submit grade correction successfully', async () => {
      mockGradeUseCase.submitGradeCorrection.mockResolvedValue(mockCorrection);

      const { result } = renderHook(() => useGrade(mockGradeUseCase));

      let correction: GradeCorrection;
      await act(async () => {
        correction = await result.current.submitGradeCorrection(
          mockCorrectionRequest
        );
      });

      expect(correction!).toEqual(mockCorrection);
      expect(mockGradeUseCase.submitGradeCorrection).toHaveBeenCalledWith(
        mockCorrectionRequest
      );
    });
  });

  describe('fetchGradeCorrections', () => {
    it('should fetch grade corrections successfully', async () => {
      mockGradeUseCase.getGradeCorrections.mockResolvedValue([mockCorrection]);

      const { result } = renderHook(() => useGrade(mockGradeUseCase));

      await act(async () => {
        await result.current.fetchGradeCorrections('student-1');
      });

      expect(result.current.gradeCorrections.data).toEqual([mockCorrection]);
      expect(mockGradeUseCase.getGradeCorrections).toHaveBeenCalledWith(
        'student-1',
        undefined
      );
    });
  });

  describe('utility actions', () => {
    it('should clear grades', () => {
      const { result } = renderHook(() => useGrade(mockGradeUseCase));

      act(() => {
        result.current.clearGrades();
      });

      expect(result.current.grades.data).toBeNull();
      expect(result.current.grades.isLoading).toBe(false);
      expect(result.current.grades.error).toBeNull();
    });

    it('should clear corrections', () => {
      const { result } = renderHook(() => useGrade(mockGradeUseCase));

      act(() => {
        result.current.clearCorrections();
      });

      expect(result.current.gradeCorrections.data).toBeNull();
      expect(result.current.gradeCorrections.isLoading).toBe(false);
      expect(result.current.gradeCorrections.error).toBeNull();
    });

    it('should clear errors', () => {
      const { result } = renderHook(() => useGrade(mockGradeUseCase));

      act(() => {
        result.current.clearErrors();
      });

      expect(result.current.grades.error).toBeNull();
      expect(result.current.gradeCorrections.error).toBeNull();
      expect(result.current.gradeStatistics.error).toBeNull();
      expect(result.current.correctionSummary.error).toBeNull();
      expect(result.current.selectedGrade.error).toBeNull();
      expect(result.current.selectedCorrection.error).toBeNull();
    });
  });
});

describe('useGradeCorrectionForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const initialData: Partial<GradeCorrectionRequest> = {
    gradeId: 'grade-1',
    studentId: 'student-1',
  };

  describe('form state management', () => {
    it('should initialize with provided data', () => {
      const { result } = renderHook(() =>
        useGradeCorrectionForm(initialData, mockGradeUseCase)
      );

      expect(result.current.formData.gradeId).toBe('grade-1');
      expect(result.current.formData.studentId).toBe('student-1');
      expect(result.current.formData.requestedGrade).toBe('');
      expect(result.current.formData.reason).toBe('');
      expect(result.current.formData.supportingDetails).toBe('');
      expect(result.current.isDirty).toBe(false);
      expect(result.current.isSubmitting).toBe(false);
    });

    it('should update field values', () => {
      const { result } = renderHook(() =>
        useGradeCorrectionForm(initialData, mockGradeUseCase)
      );

      act(() => {
        result.current.updateField('requestedGrade', 'A+');
      });

      expect(result.current.formData.requestedGrade).toBe('A+');
      expect(result.current.isDirty).toBe(true);
    });

    it('should clear field errors when updating field', () => {
      const { result } = renderHook(() =>
        useGradeCorrectionForm(initialData, mockGradeUseCase)
      );

      act(() => {
        result.current.setErrors({ requestedGrade: 'Invalid grade' });
      });

      expect(result.current.errors.requestedGrade).toBe('Invalid grade');

      act(() => {
        result.current.updateField('requestedGrade', 'A+');
      });

      expect(result.current.errors.requestedGrade).toBeUndefined();
    });

    it('should reset form to initial state', () => {
      const { result } = renderHook(() =>
        useGradeCorrectionForm(initialData, mockGradeUseCase)
      );

      act(() => {
        result.current.updateField('requestedGrade', 'A+');
        result.current.updateField('reason', 'Test reason');
        result.current.setErrors({ general: 'Some error' });
        result.current.setSubmitting(true);
      });

      expect(result.current.isDirty).toBe(true);
      expect(result.current.isSubmitting).toBe(true);
      expect(result.current.errors.general).toBe('Some error');

      act(() => {
        result.current.resetForm();
      });

      expect(result.current.formData.requestedGrade).toBe('');
      expect(result.current.formData.reason).toBe('');
      expect(result.current.isDirty).toBe(false);
      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.errors).toEqual({});
    });
  });

  describe('form validation', () => {
    it('should validate valid form data', () => {
      mockGradeUseCase.validateCorrectionRequest.mockReturnValue({
        isValid: true,
        errors: [],
      });

      const { result } = renderHook(() =>
        useGradeCorrectionForm(initialData, mockGradeUseCase)
      );

      act(() => {
        result.current.updateField('requestedGrade', 'A+');
        result.current.updateField('reason', 'Valid reason for correction');
      });

      let isValid: boolean;
      act(() => {
        isValid = result.current.validateForm();
      });

      expect(isValid!).toBe(true);
      expect(result.current.errors).toEqual({});
    });

    it('should validate invalid form data', () => {
      mockGradeUseCase.validateCorrectionRequest.mockReturnValue({
        isValid: false,
        errors: [
          'Reason is required',
          'Requested grade must be one of: A+, A, A-, B+, B, B-, C+, C, C-, D+, D, F, I, W',
        ],
      });

      const { result } = renderHook(() =>
        useGradeCorrectionForm(initialData, mockGradeUseCase)
      );

      let isValid: boolean;
      act(() => {
        isValid = result.current.validateForm();
      });

      expect(isValid!).toBe(false);
      expect(result.current.errors.reason).toContain('Reason is required');
      expect(result.current.errors.requestedGrade).toContain(
        'Requested grade must be one of'
      );
    });

    it('should map validation errors to form fields', () => {
      mockGradeUseCase.validateCorrectionRequest.mockReturnValue({
        isValid: false,
        errors: [
          'Grade ID is required',
          'Student ID is required',
          'Requested grade is required',
          'Reason is required',
          'Supporting details must be at least 5 characters long if provided',
        ],
      });

      const { result } = renderHook(() =>
        useGradeCorrectionForm({}, mockGradeUseCase)
      );

      act(() => {
        result.current.validateForm();
      });

      expect(result.current.errors.gradeId).toContain('Grade ID is required');
      expect(result.current.errors.studentId).toContain(
        'Student ID is required'
      );
      expect(result.current.errors.requestedGrade).toContain(
        'Requested grade is required'
      );
      expect(result.current.errors.reason).toContain('Reason is required');
      expect(result.current.errors.supportingDetails).toContain(
        'Supporting details must be at least 5 characters'
      );
    });
  });

  describe('error management', () => {
    it('should set and clear errors', () => {
      const { result } = renderHook(() =>
        useGradeCorrectionForm(initialData, mockGradeUseCase)
      );

      act(() => {
        result.current.setErrors({
          requestedGrade: 'Invalid grade',
          reason: 'Reason too short',
        });
      });

      expect(result.current.errors.requestedGrade).toBe('Invalid grade');
      expect(result.current.errors.reason).toBe('Reason too short');

      act(() => {
        result.current.clearErrors();
      });

      expect(result.current.errors).toEqual({});
    });
  });

  describe('submission state', () => {
    it('should manage submission state', () => {
      const { result } = renderHook(() =>
        useGradeCorrectionForm(initialData, mockGradeUseCase)
      );

      expect(result.current.isSubmitting).toBe(false);

      act(() => {
        result.current.setSubmitting(true);
      });

      expect(result.current.isSubmitting).toBe(true);

      act(() => {
        result.current.setSubmitting(false);
      });

      expect(result.current.isSubmitting).toBe(false);
    });
  });
});
