import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { GradeItem } from '../GradeItem';
import { Grade } from '../../../../../entities/Grade';
import { GradeCorrection } from '../../../../../entities/GradeCorrection';
import { UseGradeReturn } from '../../../../../adapters/controllers/useGrade';
import { AsyncState } from '../../../../../shared/types';

// Mock grade data
const mockGrade: Grade = {
  id: 'grade1',
  courseCode: 'CS101',
  courseName: 'Introduction to Computer Science',
  grade: 'B+',
  creditHours: 3,
  semester: 'Fall 2023',
  studentId: 'student1',
};

const mockGradeWithF: Grade = {
  id: 'grade2',
  courseCode: 'MATH201',
  courseName: 'Calculus II',
  grade: 'F',
  creditHours: 4,
  semester: 'Fall 2023',
  studentId: 'student1',
};

const mockGradeWithIncomplete: Grade = {
  id: 'grade3',
  courseCode: 'ENG101',
  courseName: 'English Composition',
  grade: 'I',
  creditHours: 3,
  semester: 'Fall 2023',
  studentId: 'student1',
};

const mockPendingCorrection: GradeCorrection = {
  id: 'correction1',
  gradeId: 'grade1',
  studentId: 'student1',
  requestedGrade: 'A',
  reason: 'Test reason for correction',
  supportingDetails: 'Test supporting details',
  status: 'pending',
  submissionDate: new Date('2023-10-01'),
  reviewDate: undefined,
};

const mockApprovedCorrection: GradeCorrection = {
  id: 'correction2',
  gradeId: 'grade1',
  studentId: 'student1',
  requestedGrade: 'A',
  reason: 'Test reason for correction',
  supportingDetails: 'Test supporting details',
  status: 'approved',
  submissionDate: new Date('2023-10-01'),
  reviewDate: new Date('2023-10-05'),
};

const mockRejectedCorrection: GradeCorrection = {
  id: 'correction3',
  gradeId: 'grade1',
  studentId: 'student1',
  requestedGrade: 'A',
  reason: 'Test reason for correction',
  supportingDetails: 'Test supporting details',
  status: 'rejected',
  submissionDate: new Date('2023-10-01'),
  reviewDate: new Date('2023-10-05'),
};

// Mock grade controller
const createMockGradeController = (
  corrections: GradeCorrection[] = [],
  canRequest: boolean = true,
  attempts: number = 0
): UseGradeReturn => {
  const mockController = {
    grades: { data: null, isLoading: false, error: null },
    gradeCorrections: { data: corrections, isLoading: false, error: null },
    gradeStatistics: { data: null, isLoading: false, error: null },
    correctionSummary: { data: null, isLoading: false, error: null },
    selectedGrade: { data: null, isLoading: false, error: null },
    selectedCorrection: { data: null, isLoading: false, error: null },
    fetchGrades: jest.fn(),
    fetchGradesPaginated: jest.fn(),
    fetchGradeById: jest.fn(),
    calculateGPA: jest.fn(),
    fetchGradeStatistics: jest.fn(),
    submitGradeCorrection: jest.fn(),
    fetchGradeCorrections: jest.fn().mockImplementation(async () => {
      // Update the gradeCorrections data when called
      mockController.gradeCorrections.data = corrections;
      return Promise.resolve();
    }),
    fetchGradeCorrectionsPaginated: jest.fn(),
    fetchCorrectionById: jest.fn(),
    checkCorrectionEligibility: jest.fn().mockResolvedValue(canRequest),
    getCorrectionAttempts: jest.fn().mockResolvedValue(attempts),
    fetchCorrectionSummary: jest.fn(),
    clearGrades: jest.fn(),
    clearCorrections: jest.fn(),
    clearSelectedGrade: jest.fn(),
    clearSelectedCorrection: jest.fn(),
    clearErrors: jest.fn(),
  };

  return mockController;
};

describe('GradeItem Component', () => {
  const defaultProps = {
    grade: mockGrade,
    gradeController: createMockGradeController(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Grade Display', () => {
    it('should display grade information correctly', () => {
      render(<GradeItem {...defaultProps} />);

      expect(screen.getByText('CS101')).toBeInTheDocument();
      expect(
        screen.getByText('Introduction to Computer Science')
      ).toBeInTheDocument();
      expect(screen.getByText('B+')).toBeInTheDocument();
      expect(screen.getByText('3.3 pts')).toBeInTheDocument();
    });

    it('should display academic details correctly', () => {
      render(<GradeItem {...defaultProps} />);

      expect(screen.getByText('Credits:')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('Semester:')).toBeInTheDocument();
      expect(screen.getByText('Fall 2023')).toBeInTheDocument();
      expect(screen.getByText('Quality Points:')).toBeInTheDocument();
      expect(screen.getByText('9.9')).toBeInTheDocument(); // 3.3 * 3 credits
    });

    it('should show passing status for passing grades', () => {
      render(<GradeItem {...defaultProps} />);

      expect(screen.getByText('Status:')).toBeInTheDocument();
      expect(screen.getByText('Passing')).toBeInTheDocument();
      expect(screen.getByText('Passing')).toHaveClass('passing');
    });

    it('should show not passing status for failing grades', () => {
      render(<GradeItem {...defaultProps} grade={mockGradeWithF} />);

      expect(screen.getByText('Not Passing')).toBeInTheDocument();
      expect(screen.getByText('Not Passing')).toHaveClass('not-passing');
    });
  });

  describe('Grade Color Classes', () => {
    it('should apply correct color class for excellent grades', () => {
      const excellentGrade = { ...mockGrade, grade: 'A' };
      const { container } = render(
        <GradeItem {...defaultProps} grade={excellentGrade} />
      );

      expect(container.querySelector('.grade-item')).toHaveClass(
        'grade-excellent'
      );
    });

    it('should apply correct color class for good grades', () => {
      render(<GradeItem {...defaultProps} />); // B+ grade

      const gradeItem = screen.getByText('CS101').closest('.grade-item');
      expect(gradeItem).toHaveClass('grade-good');
    });

    it('should apply correct color class for failing grades', () => {
      const { container } = render(
        <GradeItem {...defaultProps} grade={mockGradeWithF} />
      );

      expect(container.querySelector('.grade-item')).toHaveClass('grade-fail');
    });
  });

  describe('Correction Request Button', () => {
    it('should show correction request button when eligible', async () => {
      const mockController = createMockGradeController([], true, 0);

      await act(async () => {
        render(
          <GradeItem grade={mockGrade} gradeController={mockController} />
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Request Correction')).toBeInTheDocument();
      });
    });

    it('should call onCorrectionRequest when button is clicked', async () => {
      const onCorrectionRequest = jest.fn();
      const mockController = createMockGradeController([], true, 0);

      await act(async () => {
        render(
          <GradeItem
            grade={mockGrade}
            gradeController={mockController}
            onCorrectionRequest={onCorrectionRequest}
          />
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Request Correction')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByText('Request Correction'));
      });
      expect(onCorrectionRequest).toHaveBeenCalledWith(mockGrade);
    });

    it('should not show correction option when showCorrectionOption is false', () => {
      render(<GradeItem {...defaultProps} showCorrectionOption={false} />);

      expect(screen.queryByText('Request Correction')).not.toBeInTheDocument();
    });

    it('should show not eligible message for incomplete grades', async () => {
      await act(async () => {
        render(<GradeItem {...defaultProps} grade={mockGradeWithIncomplete} />);
      });

      await waitFor(() => {
        expect(
          screen.getByText('Correction not available')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Correction Status Display', () => {
    it('should show pending correction status', async () => {
      const controllerWithPending = createMockGradeController(
        [mockPendingCorrection],
        false,
        1
      );

      await act(async () => {
        render(
          <GradeItem
            {...defaultProps}
            gradeController={controllerWithPending}
          />
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Correction Pending')).toBeInTheDocument();
        expect(screen.getByText('Requested: A')).toBeInTheDocument();
      });
    });

    it('should show approved correction status', async () => {
      const controllerWithApproved = createMockGradeController(
        [mockApprovedCorrection],
        false,
        1
      );

      await act(async () => {
        render(
          <GradeItem
            {...defaultProps}
            gradeController={controllerWithApproved}
          />
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Correction Approved')).toBeInTheDocument();
        expect(screen.getByText('New grade: A')).toBeInTheDocument();
      });
    });

    it('should show rejected correction status with resubmit option', async () => {
      const controllerWithRejected = createMockGradeController(
        [mockRejectedCorrection],
        true,
        1
      );

      await act(async () => {
        render(
          <GradeItem
            {...defaultProps}
            gradeController={controllerWithRejected}
          />
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Correction Rejected')).toBeInTheDocument();
        expect(screen.getByText('Resubmit')).toBeInTheDocument();
      });
    });

    it('should show max attempts reached when limit is exceeded', async () => {
      const controllerMaxAttempts = createMockGradeController([], false, 3);

      await act(async () => {
        render(
          <GradeItem
            {...defaultProps}
            gradeController={controllerMaxAttempts}
          />
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Max attempts reached')).toBeInTheDocument();
      });
    });

    it('should show loading state while checking correction status', () => {
      render(<GradeItem {...defaultProps} />);

      expect(screen.getByText('Checking...')).toBeInTheDocument();
    });
  });

  describe('Resubmit Functionality', () => {
    it('should call onCorrectionRequest when resubmit is clicked', async () => {
      const onCorrectionRequest = jest.fn();
      const controllerWithRejected = createMockGradeController(
        [mockRejectedCorrection],
        true,
        1
      );

      await act(async () => {
        render(
          <GradeItem
            {...defaultProps}
            gradeController={controllerWithRejected}
            onCorrectionRequest={onCorrectionRequest}
          />
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Resubmit')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByText('Resubmit'));
      });
      expect(onCorrectionRequest).toHaveBeenCalledWith(mockGrade);
    });

    it('should have proper accessibility attributes for resubmit button', async () => {
      const controllerWithRejected = createMockGradeController(
        [mockRejectedCorrection],
        true,
        1
      );

      await act(async () => {
        render(
          <GradeItem
            {...defaultProps}
            gradeController={controllerWithRejected}
            onCorrectionRequest={jest.fn()}
          />
        );
      });

      await waitFor(() => {
        const resubmitButton = screen.getByText('Resubmit');
        expect(resubmitButton).toHaveAttribute(
          'aria-label',
          'Resubmit correction for CS101'
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle errors when checking correction status', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const errorController = createMockGradeController();
      errorController.checkCorrectionEligibility = jest
        .fn()
        .mockRejectedValue(new Error('API Error'));

      await act(async () => {
        render(
          <GradeItem {...defaultProps} gradeController={errorController} />
        );
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Error checking correction status:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for correction request button', async () => {
      const mockController = createMockGradeController([], true, 0);

      await act(async () => {
        render(
          <GradeItem
            grade={mockGrade}
            gradeController={mockController}
            onCorrectionRequest={jest.fn()}
          />
        );
      });

      await waitFor(() => {
        const button = screen.getByText('Request Correction');
        expect(button).toHaveAttribute(
          'aria-label',
          'Request correction for CS101'
        );
      });
    });

    it('should have proper heading structure', () => {
      render(<GradeItem {...defaultProps} />);

      expect(
        screen.getByRole('heading', { name: 'CS101' })
      ).toBeInTheDocument();
    });
  });

  describe('Data Fetching', () => {
    it('should fetch correction data on mount', async () => {
      const controller = createMockGradeController();

      await act(async () => {
        render(<GradeItem {...defaultProps} gradeController={controller} />);
      });

      await waitFor(() => {
        expect(controller.checkCorrectionEligibility).toHaveBeenCalledWith(
          'grade1',
          'student1'
        );
        expect(controller.getCorrectionAttempts).toHaveBeenCalledWith(
          'grade1',
          'student1'
        );
        expect(controller.fetchGradeCorrections).toHaveBeenCalledWith(
          'student1'
        );
      });
    });

    it('should not fetch correction data when showCorrectionOption is false', () => {
      const controller = createMockGradeController();

      render(
        <GradeItem
          {...defaultProps}
          gradeController={controller}
          showCorrectionOption={false}
        />
      );

      expect(controller.checkCorrectionEligibility).not.toHaveBeenCalled();
      expect(controller.getCorrectionAttempts).not.toHaveBeenCalled();
      expect(controller.fetchGradeCorrections).not.toHaveBeenCalled();
    });
  });
});
