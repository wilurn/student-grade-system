import React, {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useCallback,
} from 'react';
import { Grade } from '../../../entities/Grade';
import {
  GradeCorrection,
  GradeCorrectionRequest,
} from '../../../entities/GradeCorrection';
import { GradeUseCase } from '../../../usecases/GradeUseCase';
import {
  GradeFilters,
  CorrectionFilters,
  PaginatedResponse,
} from '../../../shared/types';

// Import types that might be missing
export interface GradeStatistics {
  totalCredits: number;
  earnedCredits: number;
  gpa: number;
  semesterGPA: Record<string, number>;
  gradeDistribution: Record<string, number>;
  passingGrades: number;
  failingGrades: number;
}

export interface CorrectionSummary {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  averageProcessingDays: number;
}

// Grade State
export interface GradeState {
  grades: {
    data: Grade[];
    isLoading: boolean;
    error: string | null;
    lastFetched: number | null;
  };
  corrections: {
    data: GradeCorrection[];
    isLoading: boolean;
    error: string | null;
    lastFetched: number | null;
  };
  statistics: {
    data: GradeStatistics | null;
    isLoading: boolean;
    error: string | null;
    lastFetched: number | null;
  };
  correctionSummary: {
    data: CorrectionSummary | null;
    isLoading: boolean;
    error: string | null;
    lastFetched: number | null;
  };
  selectedGrade: Grade | null;
  selectedCorrection: GradeCorrection | null;
  filters: {
    gradeFilters: GradeFilters | null;
    correctionFilters: CorrectionFilters | null;
  };
}

// Grade Actions
export type GradeAction =
  | { type: 'GRADES_FETCH_START' }
  | {
      type: 'GRADES_FETCH_SUCCESS';
      payload: { grades: Grade[]; timestamp: number };
    }
  | { type: 'GRADES_FETCH_ERROR'; payload: string }
  | { type: 'CORRECTIONS_FETCH_START' }
  | {
      type: 'CORRECTIONS_FETCH_SUCCESS';
      payload: { corrections: GradeCorrection[]; timestamp: number };
    }
  | { type: 'CORRECTIONS_FETCH_ERROR'; payload: string }
  | { type: 'STATISTICS_FETCH_START' }
  | {
      type: 'STATISTICS_FETCH_SUCCESS';
      payload: { statistics: GradeStatistics; timestamp: number };
    }
  | { type: 'STATISTICS_FETCH_ERROR'; payload: string }
  | { type: 'CORRECTION_SUMMARY_FETCH_START' }
  | {
      type: 'CORRECTION_SUMMARY_FETCH_SUCCESS';
      payload: { summary: CorrectionSummary; timestamp: number };
    }
  | { type: 'CORRECTION_SUMMARY_FETCH_ERROR'; payload: string }
  | { type: 'CORRECTION_SUBMIT_SUCCESS'; payload: GradeCorrection }
  | { type: 'SET_SELECTED_GRADE'; payload: Grade | null }
  | { type: 'SET_SELECTED_CORRECTION'; payload: GradeCorrection | null }
  | { type: 'SET_GRADE_FILTERS'; payload: GradeFilters | null }
  | { type: 'SET_CORRECTION_FILTERS'; payload: CorrectionFilters | null }
  | { type: 'CLEAR_GRADES' }
  | { type: 'CLEAR_CORRECTIONS' }
  | { type: 'CLEAR_STATISTICS' }
  | { type: 'CLEAR_CORRECTION_SUMMARY' }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'CLEAR_ALL' };

// Initial state
const initialState: GradeState = {
  grades: {
    data: [],
    isLoading: false,
    error: null,
    lastFetched: null,
  },
  corrections: {
    data: [],
    isLoading: false,
    error: null,
    lastFetched: null,
  },
  statistics: {
    data: null,
    isLoading: false,
    error: null,
    lastFetched: null,
  },
  correctionSummary: {
    data: null,
    isLoading: false,
    error: null,
    lastFetched: null,
  },
  selectedGrade: null,
  selectedCorrection: null,
  filters: {
    gradeFilters: null,
    correctionFilters: null,
  },
};

// Grade reducer
function gradeReducer(state: GradeState, action: GradeAction): GradeState {
  switch (action.type) {
    case 'GRADES_FETCH_START':
      return {
        ...state,
        grades: {
          ...state.grades,
          isLoading: true,
          error: null,
        },
      };
    case 'GRADES_FETCH_SUCCESS':
      return {
        ...state,
        grades: {
          data: action.payload.grades,
          isLoading: false,
          error: null,
          lastFetched: action.payload.timestamp,
        },
      };
    case 'GRADES_FETCH_ERROR':
      return {
        ...state,
        grades: {
          ...state.grades,
          isLoading: false,
          error: action.payload,
        },
      };
    case 'CORRECTIONS_FETCH_START':
      return {
        ...state,
        corrections: {
          ...state.corrections,
          isLoading: true,
          error: null,
        },
      };
    case 'CORRECTIONS_FETCH_SUCCESS':
      return {
        ...state,
        corrections: {
          data: action.payload.corrections,
          isLoading: false,
          error: null,
          lastFetched: action.payload.timestamp,
        },
      };
    case 'CORRECTIONS_FETCH_ERROR':
      return {
        ...state,
        corrections: {
          ...state.corrections,
          isLoading: false,
          error: action.payload,
        },
      };
    case 'STATISTICS_FETCH_START':
      return {
        ...state,
        statistics: {
          ...state.statistics,
          isLoading: true,
          error: null,
        },
      };
    case 'STATISTICS_FETCH_SUCCESS':
      return {
        ...state,
        statistics: {
          data: action.payload.statistics,
          isLoading: false,
          error: null,
          lastFetched: action.payload.timestamp,
        },
      };
    case 'STATISTICS_FETCH_ERROR':
      return {
        ...state,
        statistics: {
          ...state.statistics,
          isLoading: false,
          error: action.payload,
        },
      };
    case 'CORRECTION_SUMMARY_FETCH_START':
      return {
        ...state,
        correctionSummary: {
          ...state.correctionSummary,
          isLoading: true,
          error: null,
        },
      };
    case 'CORRECTION_SUMMARY_FETCH_SUCCESS':
      return {
        ...state,
        correctionSummary: {
          data: action.payload.summary,
          isLoading: false,
          error: null,
          lastFetched: action.payload.timestamp,
        },
      };
    case 'CORRECTION_SUMMARY_FETCH_ERROR':
      return {
        ...state,
        correctionSummary: {
          ...state.correctionSummary,
          isLoading: false,
          error: action.payload,
        },
      };
    case 'CORRECTION_SUBMIT_SUCCESS':
      return {
        ...state,
        corrections: {
          ...state.corrections,
          data: [action.payload, ...state.corrections.data],
        },
      };
    case 'SET_SELECTED_GRADE':
      return {
        ...state,
        selectedGrade: action.payload,
      };
    case 'SET_SELECTED_CORRECTION':
      return {
        ...state,
        selectedCorrection: action.payload,
      };
    case 'SET_GRADE_FILTERS':
      return {
        ...state,
        filters: {
          ...state.filters,
          gradeFilters: action.payload,
        },
      };
    case 'SET_CORRECTION_FILTERS':
      return {
        ...state,
        filters: {
          ...state.filters,
          correctionFilters: action.payload,
        },
      };
    case 'CLEAR_GRADES':
      return {
        ...state,
        grades: initialState.grades,
        selectedGrade: null,
      };
    case 'CLEAR_CORRECTIONS':
      return {
        ...state,
        corrections: initialState.corrections,
        selectedCorrection: null,
      };
    case 'CLEAR_STATISTICS':
      return {
        ...state,
        statistics: initialState.statistics,
      };
    case 'CLEAR_CORRECTION_SUMMARY':
      return {
        ...state,
        correctionSummary: initialState.correctionSummary,
      };
    case 'CLEAR_ERRORS':
      return {
        ...state,
        grades: { ...state.grades, error: null },
        corrections: { ...state.corrections, error: null },
        statistics: { ...state.statistics, error: null },
        correctionSummary: { ...state.correctionSummary, error: null },
      };
    case 'CLEAR_ALL':
      return initialState;
    default:
      return state;
  }
}

// Context interface
export interface GradeContextValue {
  state: GradeState;
  fetchGrades: (
    studentId: string,
    filters?: GradeFilters,
    forceRefresh?: boolean
  ) => Promise<void>;
  fetchGradesPaginated: (
    studentId: string,
    page: number,
    limit: number,
    filters?: GradeFilters
  ) => Promise<PaginatedResponse<Grade>>;
  fetchCorrections: (
    studentId: string,
    filters?: CorrectionFilters,
    forceRefresh?: boolean
  ) => Promise<void>;
  fetchCorrectionsPaginated: (
    studentId: string,
    page: number,
    limit: number,
    filters?: CorrectionFilters
  ) => Promise<PaginatedResponse<GradeCorrection>>;
  fetchStatistics: (studentId: string, forceRefresh?: boolean) => Promise<void>;
  fetchCorrectionSummary: (
    studentId: string,
    forceRefresh?: boolean
  ) => Promise<void>;
  submitCorrection: (
    correction: GradeCorrectionRequest
  ) => Promise<GradeCorrection>;
  calculateGPA: (studentId: string, semester?: string) => Promise<number>;
  checkCorrectionEligibility: (
    gradeId: string,
    studentId: string
  ) => Promise<boolean>;
  getCorrectionAttempts: (
    gradeId: string,
    studentId: string
  ) => Promise<number>;
  setSelectedGrade: (grade: Grade | null) => void;
  setSelectedCorrection: (correction: GradeCorrection | null) => void;
  setGradeFilters: (filters: GradeFilters | null) => void;
  setCorrectionFilters: (filters: CorrectionFilters | null) => void;
  clearGrades: () => void;
  clearCorrections: () => void;
  clearStatistics: () => void;
  clearCorrectionSummary: () => void;
  clearErrors: () => void;
  clearAll: () => void;
}

// Create context
const GradeContext = createContext<GradeContextValue | undefined>(undefined);

// Grade provider props
interface GradeProviderProps {
  children: ReactNode;
  gradeUseCase: GradeUseCase;
}

// Cache duration (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Grade provider component
export function GradeProvider({ children, gradeUseCase }: GradeProviderProps) {
  const [state, dispatch] = useReducer(gradeReducer, initialState);

  // Helper function to check if data is fresh
  const isDataFresh = (lastFetched: number | null): boolean => {
    if (!lastFetched) return false;
    return Date.now() - lastFetched < CACHE_DURATION;
  };

  // Fetch grades
  const fetchGrades = useCallback(
    async (
      studentId: string,
      filters?: GradeFilters,
      forceRefresh = false
    ): Promise<void> => {
      // Check cache if not forcing refresh
      if (!forceRefresh && isDataFresh(state.grades.lastFetched)) {
        return;
      }

      dispatch({ type: 'GRADES_FETCH_START' });

      try {
        const grades = await gradeUseCase.getStudentGrades(studentId, filters);
        dispatch({
          type: 'GRADES_FETCH_SUCCESS',
          payload: { grades, timestamp: Date.now() },
        });
      } catch (error) {
        dispatch({
          type: 'GRADES_FETCH_ERROR',
          payload:
            error instanceof Error ? error.message : 'Failed to fetch grades',
        });
      }
    },
    [gradeUseCase, state.grades.lastFetched]
  );

  // Fetch grades paginated
  const fetchGradesPaginated = useCallback(
    async (
      studentId: string,
      page: number,
      limit: number,
      filters?: GradeFilters
    ): Promise<PaginatedResponse<Grade>> => {
      return await gradeUseCase.getStudentGradesPaginated(
        studentId,
        page,
        limit,
        filters
      );
    },
    [gradeUseCase]
  );

  // Fetch corrections
  const fetchCorrections = useCallback(
    async (
      studentId: string,
      filters?: CorrectionFilters,
      forceRefresh = false
    ): Promise<void> => {
      // Check cache if not forcing refresh
      if (!forceRefresh && isDataFresh(state.corrections.lastFetched)) {
        return;
      }

      dispatch({ type: 'CORRECTIONS_FETCH_START' });

      try {
        const corrections = await gradeUseCase.getGradeCorrections(
          studentId,
          filters
        );
        dispatch({
          type: 'CORRECTIONS_FETCH_SUCCESS',
          payload: { corrections, timestamp: Date.now() },
        });
      } catch (error) {
        dispatch({
          type: 'CORRECTIONS_FETCH_ERROR',
          payload:
            error instanceof Error
              ? error.message
              : 'Failed to fetch corrections',
        });
      }
    },
    [gradeUseCase, state.corrections.lastFetched]
  );

  // Fetch corrections paginated
  const fetchCorrectionsPaginated = useCallback(
    async (
      studentId: string,
      page: number,
      limit: number,
      filters?: CorrectionFilters
    ): Promise<PaginatedResponse<GradeCorrection>> => {
      return await gradeUseCase.getGradeCorrectionsPaginated(
        studentId,
        page,
        limit,
        filters
      );
    },
    [gradeUseCase]
  );

  // Fetch statistics
  const fetchStatistics = useCallback(
    async (studentId: string, forceRefresh = false): Promise<void> => {
      // Check cache if not forcing refresh
      if (!forceRefresh && isDataFresh(state.statistics.lastFetched)) {
        return;
      }

      dispatch({ type: 'STATISTICS_FETCH_START' });

      try {
        const statistics = await gradeUseCase.getGradeStatistics(studentId);
        dispatch({
          type: 'STATISTICS_FETCH_SUCCESS',
          payload: { statistics, timestamp: Date.now() },
        });
      } catch (error) {
        dispatch({
          type: 'STATISTICS_FETCH_ERROR',
          payload:
            error instanceof Error
              ? error.message
              : 'Failed to fetch statistics',
        });
      }
    },
    [gradeUseCase, state.statistics.lastFetched]
  );

  // Fetch correction summary
  const fetchCorrectionSummary = useCallback(
    async (studentId: string, forceRefresh = false): Promise<void> => {
      // Check cache if not forcing refresh
      if (!forceRefresh && isDataFresh(state.correctionSummary.lastFetched)) {
        return;
      }

      dispatch({ type: 'CORRECTION_SUMMARY_FETCH_START' });

      try {
        const summary = await gradeUseCase.getCorrectionSummary(studentId);
        dispatch({
          type: 'CORRECTION_SUMMARY_FETCH_SUCCESS',
          payload: { summary, timestamp: Date.now() },
        });
      } catch (error) {
        dispatch({
          type: 'CORRECTION_SUMMARY_FETCH_ERROR',
          payload:
            error instanceof Error
              ? error.message
              : 'Failed to fetch correction summary',
        });
      }
    },
    [gradeUseCase, state.correctionSummary.lastFetched]
  );

  // Submit correction
  const submitCorrection = useCallback(
    async (correction: GradeCorrectionRequest): Promise<GradeCorrection> => {
      const result = await gradeUseCase.submitGradeCorrection(correction);
      dispatch({ type: 'CORRECTION_SUBMIT_SUCCESS', payload: result });
      return result;
    },
    [gradeUseCase]
  );

  // Calculate GPA
  const calculateGPA = useCallback(
    async (studentId: string, semester?: string): Promise<number> => {
      return await gradeUseCase.calculateGPA(studentId, semester);
    },
    [gradeUseCase]
  );

  // Check correction eligibility
  const checkCorrectionEligibility = useCallback(
    async (gradeId: string, studentId: string): Promise<boolean> => {
      return await gradeUseCase.canSubmitCorrection(gradeId, studentId);
    },
    [gradeUseCase]
  );

  // Get correction attempts
  const getCorrectionAttempts = useCallback(
    async (gradeId: string, studentId: string): Promise<number> => {
      return await gradeUseCase.getCorrectionAttempts(gradeId, studentId);
    },
    [gradeUseCase]
  );

  // Action creators
  const setSelectedGrade = useCallback((grade: Grade | null) => {
    dispatch({ type: 'SET_SELECTED_GRADE', payload: grade });
  }, []);

  const setSelectedCorrection = useCallback(
    (correction: GradeCorrection | null) => {
      dispatch({ type: 'SET_SELECTED_CORRECTION', payload: correction });
    },
    []
  );

  const setGradeFilters = useCallback((filters: GradeFilters | null) => {
    dispatch({ type: 'SET_GRADE_FILTERS', payload: filters });
  }, []);

  const setCorrectionFilters = useCallback(
    (filters: CorrectionFilters | null) => {
      dispatch({ type: 'SET_CORRECTION_FILTERS', payload: filters });
    },
    []
  );

  const clearGrades = useCallback(() => {
    dispatch({ type: 'CLEAR_GRADES' });
  }, []);

  const clearCorrections = useCallback(() => {
    dispatch({ type: 'CLEAR_CORRECTIONS' });
  }, []);

  const clearStatistics = useCallback(() => {
    dispatch({ type: 'CLEAR_STATISTICS' });
  }, []);

  const clearCorrectionSummary = useCallback(() => {
    dispatch({ type: 'CLEAR_CORRECTION_SUMMARY' });
  }, []);

  const clearErrors = useCallback(() => {
    dispatch({ type: 'CLEAR_ERRORS' });
  }, []);

  const clearAll = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' });
  }, []);

  const contextValue: GradeContextValue = {
    state,
    fetchGrades,
    fetchGradesPaginated,
    fetchCorrections,
    fetchCorrectionsPaginated,
    fetchStatistics,
    fetchCorrectionSummary,
    submitCorrection,
    calculateGPA,
    checkCorrectionEligibility,
    getCorrectionAttempts,
    setSelectedGrade,
    setSelectedCorrection,
    setGradeFilters,
    setCorrectionFilters,
    clearGrades,
    clearCorrections,
    clearStatistics,
    clearCorrectionSummary,
    clearErrors,
    clearAll,
  };

  return (
    <GradeContext.Provider value={contextValue}>
      {children}
    </GradeContext.Provider>
  );
}

// Hook to use grade context
export function useGradeContext(): GradeContextValue {
  const context = useContext(GradeContext);
  if (context === undefined) {
    throw new Error('useGradeContext must be used within a GradeProvider');
  }
  return context;
}
