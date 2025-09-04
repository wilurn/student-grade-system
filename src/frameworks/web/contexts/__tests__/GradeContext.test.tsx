import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { GradeProvider, useGradeContext } from '../GradeContext';
import { GradeUseCase } from '../../../../usecases/GradeUseCase';
import { Grade } from '../../../../entities/Grade';
import {
  GradeCorrection,
  GradeCorrectionRequest,
} from '../../../../entities/GradeCorrection';

// Mock dependencies
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

// Test component that uses the grade context
const TestComponent: React.FC = () => {
  const {
    state,
    fetchGrades,
    fetchCorrections,
    submitCorrection,
    setSelectedGrade,
    clearGrades,
    clearErrors,
  } = useGradeContext();

  return (
    <div>
      <div data-testid="grades-loading">
        {state.grades.isLoading.toString()}
      </div>
      <div data-testid="grades-error">{state.grades.error || 'No error'}</div>
      <div data-testid="grades-count">{state.grades.data.length}</div>
      <div data-testid="corrections-loading">
        {state.corrections.isLoading.toString()}
      </div>
      <div data-testid="corrections-error">
        {state.corrections.error || 'No error'}
      </div>
      <div data-testid="corrections-count">{state.corrections.data.length}</div>
      <div data-testid="selected-grade">
        {state.selectedGrade ? state.selectedGrade.courseCode : 'None'}
      </div>

      <button onClick={() => fetchGrades('student-1')}>Fetch Grades</button>
      <button onClick={() => fetchCorrections('student-1')}>
        Fetch Corrections
      </button>
      <button
        onClick={() =>
          submitCorrection({
            gradeId: 'grade-1',
            studentId: 'student-1',
            requestedGrade: 'A',
            reason: 'Test reason',
            supportingDetails: 'Test details',
          })
        }
      >
        Submit Correction
      </button>
      <button
        onClick={() =>
          setSelectedGrade({
            id: 'grade-1',
            courseCode: 'CS101',
            courseName: 'Computer Science',
            grade: 'B',
            creditHours: 3,
            semester: 'Fall 2023',
            studentId: 'student-1',
          })
        }
      >
        Set Selected Grade
      </button>
      <button onClick={clearGrades}>Clear Grades</button>
      <button onClick={clearErrors}>Clear Errors</button>
    </div>
  );
};

const renderWithProvider = (children: React.ReactNode) => {
  return render(
    <GradeProvider gradeUseCase={mockGradeUseCase}>{children}</GradeProvider>
  );
};

describe('GradeContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with empty state', () => {
      renderWithProvider(<TestComponent />);

      expect(screen.getByTestId('grades-loading')).toHaveTextContent('false');
      expect(screen.getByTestId('grades-error')).toHaveTextContent('No error');
      expect(screen.getByTestId('grades-count')).toHaveTextContent('0');
      expect(screen.getByTestId('corrections-loading')).toHaveTextContent(
        'false'
      );
      expect(screen.getByTestId('corrections-error')).toHaveTextContent(
        'No error'
      );
      expect(screen.getByTestId('corrections-count')).toHaveTextContent('0');
      expect(screen.getByTestId('selected-grade')).toHaveTextContent('None');
    });
  });

  describe('fetchGrades', () => {
    it('should fetch grades successfully', async () => {
      const mockGrades: Grade[] = [
        {
          id: 'grade-1',
          courseCode: 'CS101',
          courseName: 'Computer Science',
          grade: 'A',
          creditHours: 3,
          semester: 'Fall 2023',
          studentId: 'student-1',
        },
        {
          id: 'grade-2',
          courseCode: 'MATH101',
          courseName: 'Mathematics',
          grade: 'B',
          creditHours: 4,
          semester: 'Fall 2023',
          studentId: 'student-1',
        },
      ];

      mockGradeUseCase.getStudentGrades.mockResolvedValue(mockGrades);

      renderWithProvider(<TestComponent />);

      act(() => {
        screen.getByText('Fetch Grades').click();
      });

      // Should show loading state
      expect(screen.getByTestId('grades-loading')).toHaveTextContent('true');

      await waitFor(() => {
        expect(screen.getByTestId('grades-loading')).toHaveTextContent('false');
        expect(screen.getByTestId('grades-count')).toHaveTextContent('2');
        expect(screen.getByTestId('grades-error')).toHaveTextContent(
          'No error'
        );
      });

      expect(mockGradeUseCase.getStudentGrades).toHaveBeenCalledWith(
        'student-1',
        undefined
      );
    });

    it('should handle fetch grades error', async () => {
      mockGradeUseCase.getStudentGrades.mockRejectedValue(
        new Error('Failed to fetch grades')
      );

      renderWithProvider(<TestComponent />);

      act(() => {
        screen.getByText('Fetch Grades').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('grades-loading')).toHaveTextContent('false');
        expect(screen.getByTestId('grades-error')).toHaveTextContent(
          'Failed to fetch grades'
        );
        expect(screen.getByTestId('grades-count')).toHaveTextContent('0');
      });
    });

    it('should use cache when data is fresh', async () => {
      const mockGrades: Grade[] = [
        {
          id: 'grade-1',
          courseCode: 'CS101',
          courseName: 'Computer Science',
          grade: 'A',
          creditHours: 3,
          semester: 'Fall 2023',
          studentId: 'student-1',
        },
      ];

      mockGradeUseCase.getStudentGrades.mockResolvedValue(mockGrades);

      renderWithProvider(<TestComponent />);

      // First fetch
      act(() => {
        screen.getByText('Fetch Grades').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('grades-count')).toHaveTextContent('1');
      });

      // Second fetch should use cache (not call the use case again)
      act(() => {
        screen.getByText('Fetch Grades').click();
      });

      expect(mockGradeUseCase.getStudentGrades).toHaveBeenCalledTimes(1);
    });
  });

  describe('fetchCorrections', () => {
    it('should fetch corrections successfully', async () => {
      const mockCorrections: GradeCorrection[] = [
        {
          id: 'correction-1',
          gradeId: 'grade-1',
          studentId: 'student-1',
          requestedGrade: 'A',
          reason: 'Test reason',
          supportingDetails: 'Test details',
          status: 'pending',
          submissionDate: new Date(),
        },
      ];

      mockGradeUseCase.getGradeCorrections.mockResolvedValue(mockCorrections);

      renderWithProvider(<TestComponent />);

      act(() => {
        screen.getByText('Fetch Corrections').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('corrections-loading')).toHaveTextContent(
          'false'
        );
        expect(screen.getByTestId('corrections-count')).toHaveTextContent('1');
        expect(screen.getByTestId('corrections-error')).toHaveTextContent(
          'No error'
        );
      });

      expect(mockGradeUseCase.getGradeCorrections).toHaveBeenCalledWith(
        'student-1',
        undefined
      );
    });
  });

  describe('submitCorrection', () => {
    it('should submit correction successfully', async () => {
      const mockCorrection: GradeCorrection = {
        id: 'correction-1',
        gradeId: 'grade-1',
        studentId: 'student-1',
        requestedGrade: 'A',
        reason: 'Test reason',
        supportingDetails: 'Test details',
        status: 'pending',
        submissionDate: new Date(),
      };

      mockGradeUseCase.submitGradeCorrection.mockResolvedValue(mockCorrection);

      renderWithProvider(<TestComponent />);

      act(() => {
        screen.getByText('Submit Correction').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('corrections-count')).toHaveTextContent('1');
      });

      expect(mockGradeUseCase.submitGradeCorrection).toHaveBeenCalledWith({
        gradeId: 'grade-1',
        studentId: 'student-1',
        requestedGrade: 'A',
        reason: 'Test reason',
        supportingDetails: 'Test details',
      });
    });
  });

  describe('state management', () => {
    it('should set selected grade', () => {
      renderWithProvider(<TestComponent />);

      act(() => {
        screen.getByText('Set Selected Grade').click();
      });

      expect(screen.getByTestId('selected-grade')).toHaveTextContent('CS101');
    });

    it('should clear grades', async () => {
      const mockGrades: Grade[] = [
        {
          id: 'grade-1',
          courseCode: 'CS101',
          courseName: 'Computer Science',
          grade: 'A',
          creditHours: 3,
          semester: 'Fall 2023',
          studentId: 'student-1',
        },
      ];

      mockGradeUseCase.getStudentGrades.mockResolvedValue(mockGrades);

      renderWithProvider(<TestComponent />);

      // First fetch grades
      act(() => {
        screen.getByText('Fetch Grades').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('grades-count')).toHaveTextContent('1');
      });

      // Then clear grades
      act(() => {
        screen.getByText('Clear Grades').click();
      });

      expect(screen.getByTestId('grades-count')).toHaveTextContent('0');
      expect(screen.getByTestId('selected-grade')).toHaveTextContent('None');
    });

    it('should clear errors', async () => {
      mockGradeUseCase.getStudentGrades.mockRejectedValue(
        new Error('Test error')
      );

      renderWithProvider(<TestComponent />);

      act(() => {
        screen.getByText('Fetch Grades').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('grades-error')).toHaveTextContent(
          'Test error'
        );
      });

      act(() => {
        screen.getByText('Clear Errors').click();
      });

      expect(screen.getByTestId('grades-error')).toHaveTextContent('No error');
    });
  });

  describe('context usage outside provider', () => {
    it('should throw error when used outside provider', () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useGradeContext must be used within a GradeProvider');

      consoleSpy.mockRestore();
    });
  });
});
