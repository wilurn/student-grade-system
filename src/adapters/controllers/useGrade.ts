import { useState, useCallback } from 'react';
import { Grade } from '../../entities/Grade';
import {
  GradeCorrection,
  GradeCorrectionRequest,
} from '../../entities/GradeCorrection';
import {
  GradeUseCase,
  GradeStatistics,
  CorrectionSummary,
} from '../../usecases/GradeUseCase';
import {
  GradeFilters,
  CorrectionFilters,
  PaginatedResponse,
  AsyncState,
  DomainException,
  ErrorCode,
} from '../../shared/types';

export interface UseGradeState {
  grades: AsyncState<Grade[]>;
  gradeCorrections: AsyncState<GradeCorrection[]>;
  gradeStatistics: AsyncState<GradeStatistics>;
  correctionSummary: AsyncState<CorrectionSummary>;
  selectedGrade: AsyncState<Grade>;
  selectedCorrection: AsyncState<GradeCorrection>;
}

export interface UseGradeActions {
  // Grade actions
  fetchGrades: (studentId: string, filters?: GradeFilters) => Promise<void>;
  fetchGradesPaginated: (
    studentId: string,
    page: number,
    limit: number,
    filters?: GradeFilters
  ) => Promise<PaginatedResponse<Grade>>;
  fetchGradeById: (gradeId: string, studentId: string) => Promise<void>;
  calculateGPA: (studentId: string, semester?: string) => Promise<number>;
  fetchGradeStatistics: (studentId: string) => Promise<void>;

  // Grade correction actions
  submitGradeCorrection: (
    correction: GradeCorrectionRequest
  ) => Promise<GradeCorrection>;
  fetchGradeCorrections: (
    studentId: string,
    filters?: CorrectionFilters
  ) => Promise<void>;
  fetchGradeCorrectionsPaginated: (
    studentId: string,
    page: number,
    limit: number,
    filters?: CorrectionFilters
  ) => Promise<PaginatedResponse<GradeCorrection>>;
  fetchCorrectionById: (
    correctionId: string,
    studentId: string
  ) => Promise<void>;
  checkCorrectionEligibility: (
    gradeId: string,
    studentId: string
  ) => Promise<boolean>;
  getCorrectionAttempts: (
    gradeId: string,
    studentId: string
  ) => Promise<number>;
  fetchCorrectionSummary: (studentId: string) => Promise<void>;

  // Utility actions
  clearGrades: () => void;
  clearCorrections: () => void;
  clearSelectedGrade: () => void;
  clearSelectedCorrection: () => void;
  clearErrors: () => void;
}

export interface UseGradeReturn extends UseGradeState, UseGradeActions {}

const initialAsyncState = <T>(): AsyncState<T> => ({
  data: null,
  isLoading: false,
  error: null,
});

export function useGrade(gradeUseCase: GradeUseCase): UseGradeReturn {
  const [grades, setGrades] = useState<AsyncState<Grade[]>>(initialAsyncState);
  const [gradeCorrections, setGradeCorrections] =
    useState<AsyncState<GradeCorrection[]>>(initialAsyncState);
  const [gradeStatistics, setGradeStatistics] =
    useState<AsyncState<GradeStatistics>>(initialAsyncState);
  const [correctionSummary, setCorrectionSummary] =
    useState<AsyncState<CorrectionSummary>>(initialAsyncState);
  const [selectedGrade, setSelectedGrade] =
    useState<AsyncState<Grade>>(initialAsyncState);
  const [selectedCorrection, setSelectedCorrection] =
    useState<AsyncState<GradeCorrection>>(initialAsyncState);

  // Helper function to handle async operations
  const handleAsyncOperation = useCallback(
    async <T>(
      operation: () => Promise<T>,
      setState: React.Dispatch<React.SetStateAction<AsyncState<T>>>,
      returnResult = false
    ): Promise<T | void> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const result = await operation();
        setState({ data: result, isLoading: false, error: null });

        if (returnResult) {
          return result;
        }
      } catch (error) {
        const errorMessage =
          error instanceof DomainException
            ? error.message
            : 'An unexpected error occurred';

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));

        if (returnResult) {
          throw error;
        }
      }
    },
    []
  );

  // Grade actions
  const fetchGrades = useCallback(
    async (studentId: string, filters?: GradeFilters): Promise<void> => {
      await handleAsyncOperation(
        () => gradeUseCase.getStudentGrades(studentId, filters),
        setGrades
      );
    },
    [gradeUseCase, handleAsyncOperation]
  );

  const fetchGradesPaginated = useCallback(
    async (
      studentId: string,
      page: number,
      limit: number,
      filters?: GradeFilters
    ): Promise<PaginatedResponse<Grade>> => {
      return (await handleAsyncOperation(
        () =>
          gradeUseCase.getStudentGradesPaginated(
            studentId,
            page,
            limit,
            filters
          ),
        setGrades,
        true
      )) as Promise<PaginatedResponse<Grade>>;
    },
    [gradeUseCase, handleAsyncOperation]
  );

  const fetchGradeById = useCallback(
    async (gradeId: string, studentId: string): Promise<void> => {
      await handleAsyncOperation(async () => {
        const grade = await gradeUseCase.getGradeById(gradeId, studentId);
        if (!grade) {
          throw new DomainException({
            code: ErrorCode.GRADE_NOT_FOUND,
            message: 'Grade not found',
          });
        }
        return grade;
      }, setSelectedGrade);
    },
    [gradeUseCase, handleAsyncOperation]
  );

  const calculateGPA = useCallback(
    async (studentId: string, semester?: string): Promise<number> => {
      return await gradeUseCase.calculateGPA(studentId, semester);
    },
    [gradeUseCase]
  );

  const fetchGradeStatistics = useCallback(
    async (studentId: string): Promise<void> => {
      await handleAsyncOperation(
        () => gradeUseCase.getGradeStatistics(studentId),
        setGradeStatistics
      );
    },
    [gradeUseCase, handleAsyncOperation]
  );

  // Grade correction actions
  const submitGradeCorrection = useCallback(
    async (correction: GradeCorrectionRequest): Promise<GradeCorrection> => {
      return await gradeUseCase.submitGradeCorrection(correction);
    },
    [gradeUseCase]
  );

  const fetchGradeCorrections = useCallback(
    async (studentId: string, filters?: CorrectionFilters): Promise<void> => {
      await handleAsyncOperation(
        () => gradeUseCase.getGradeCorrections(studentId, filters),
        setGradeCorrections
      );
    },
    [gradeUseCase, handleAsyncOperation]
  );

  const fetchGradeCorrectionsPaginated = useCallback(
    async (
      studentId: string,
      page: number,
      limit: number,
      filters?: CorrectionFilters
    ): Promise<PaginatedResponse<GradeCorrection>> => {
      return (await handleAsyncOperation(
        () =>
          gradeUseCase.getGradeCorrectionsPaginated(
            studentId,
            page,
            limit,
            filters
          ),
        setGradeCorrections,
        true
      )) as Promise<PaginatedResponse<GradeCorrection>>;
    },
    [gradeUseCase, handleAsyncOperation]
  );

  const fetchCorrectionById = useCallback(
    async (correctionId: string, studentId: string): Promise<void> => {
      await handleAsyncOperation(async () => {
        const correction = await gradeUseCase.getCorrectionById(
          correctionId,
          studentId
        );
        if (!correction) {
          throw new DomainException({
            code: ErrorCode.NOT_FOUND_ERROR,
            message: 'Correction not found',
          });
        }
        return correction;
      }, setSelectedCorrection);
    },
    [gradeUseCase, handleAsyncOperation]
  );

  const checkCorrectionEligibility = useCallback(
    async (gradeId: string, studentId: string): Promise<boolean> => {
      return await gradeUseCase.canSubmitCorrection(gradeId, studentId);
    },
    [gradeUseCase]
  );

  const getCorrectionAttempts = useCallback(
    async (gradeId: string, studentId: string): Promise<number> => {
      return await gradeUseCase.getCorrectionAttempts(gradeId, studentId);
    },
    [gradeUseCase]
  );

  const fetchCorrectionSummary = useCallback(
    async (studentId: string): Promise<void> => {
      await handleAsyncOperation(
        () => gradeUseCase.getCorrectionSummary(studentId),
        setCorrectionSummary
      );
    },
    [gradeUseCase, handleAsyncOperation]
  );

  // Utility actions
  const clearGrades = useCallback(() => {
    setGrades(initialAsyncState());
  }, []);

  const clearCorrections = useCallback(() => {
    setGradeCorrections(initialAsyncState());
  }, []);

  const clearSelectedGrade = useCallback(() => {
    setSelectedGrade(initialAsyncState());
  }, []);

  const clearSelectedCorrection = useCallback(() => {
    setSelectedCorrection(initialAsyncState());
  }, []);

  const clearErrors = useCallback(() => {
    setGrades((prev) => ({ ...prev, error: null }));
    setGradeCorrections((prev) => ({ ...prev, error: null }));
    setGradeStatistics((prev) => ({ ...prev, error: null }));
    setCorrectionSummary((prev) => ({ ...prev, error: null }));
    setSelectedGrade((prev) => ({ ...prev, error: null }));
    setSelectedCorrection((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    // State
    grades,
    gradeCorrections,
    gradeStatistics,
    correctionSummary,
    selectedGrade,
    selectedCorrection,

    // Actions
    fetchGrades,
    fetchGradesPaginated,
    fetchGradeById,
    calculateGPA,
    fetchGradeStatistics,
    submitGradeCorrection,
    fetchGradeCorrections,
    fetchGradeCorrectionsPaginated,
    fetchCorrectionById,
    checkCorrectionEligibility,
    getCorrectionAttempts,
    fetchCorrectionSummary,
    clearGrades,
    clearCorrections,
    clearSelectedGrade,
    clearSelectedCorrection,
    clearErrors,
  };
}

// Hook for grade form management
export interface UseGradeCorrectionFormState {
  formData: GradeCorrectionRequest;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isDirty: boolean;
}

export interface UseGradeCorrectionFormActions {
  updateField: (field: keyof GradeCorrectionRequest, value: string) => void;
  setErrors: (errors: Record<string, string>) => void;
  clearErrors: () => void;
  resetForm: () => void;
  validateForm: () => boolean;
  setSubmitting: (isSubmitting: boolean) => void;
}

export interface UseGradeCorrectionFormReturn
  extends UseGradeCorrectionFormState,
    UseGradeCorrectionFormActions {}

export function useGradeCorrectionForm(
  initialData: Partial<GradeCorrectionRequest> = {},
  gradeUseCase: GradeUseCase
): UseGradeCorrectionFormReturn {
  const [formData, setFormData] = useState<GradeCorrectionRequest>({
    gradeId: initialData.gradeId || '',
    studentId: initialData.studentId || '',
    requestedGrade: initialData.requestedGrade || '',
    reason: initialData.reason || '',
    supportingDetails: initialData.supportingDetails || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const updateField = useCallback(
    (field: keyof GradeCorrectionRequest, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setIsDirty(true);

      // Clear field error when user starts typing
      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [errors]
  );

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      gradeId: initialData.gradeId || '',
      studentId: initialData.studentId || '',
      requestedGrade: initialData.requestedGrade || '',
      reason: initialData.reason || '',
      supportingDetails: initialData.supportingDetails || '',
    });
    setErrors({});
    setIsSubmitting(false);
    setIsDirty(false);
  }, [initialData]);

  const validateForm = useCallback((): boolean => {
    const validation = gradeUseCase.validateCorrectionRequest(formData);

    if (!validation.isValid) {
      const fieldErrors: Record<string, string> = {};
      validation.errors.forEach((error) => {
        if (error.includes('Grade ID')) {
          fieldErrors.gradeId = error;
        } else if (error.includes('Student ID')) {
          fieldErrors.studentId = error;
        } else if (error.includes('Requested grade')) {
          fieldErrors.requestedGrade = error;
        } else if (error.includes('Reason')) {
          fieldErrors.reason = error;
        } else if (error.includes('Supporting details')) {
          fieldErrors.supportingDetails = error;
        } else {
          fieldErrors.general = error;
        }
      });

      setErrors(fieldErrors);
      return false;
    }

    clearErrors();
    return true;
  }, [formData, gradeUseCase, clearErrors]);

  const setSubmitting = useCallback((submitting: boolean) => {
    setIsSubmitting(submitting);
  }, []);

  return {
    formData,
    errors,
    isSubmitting,
    isDirty,
    updateField,
    setErrors,
    clearErrors,
    resetForm,
    validateForm,
    setSubmitting,
  };
}
