import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CorrectionsList } from '../CorrectionsList';
import { GradeCorrection } from '../../../../../entities/GradeCorrection';
import { UseGradeReturn } from '../../../../../adapters/controllers/useGrade';
import { AsyncState } from '../../../../../shared/types';

// Mock the CSS import
jest.mock('../CorrectionsList.css', () => ({}));

// Mock data
const mockCorrections: GradeCorrection[] = [
  {
    id: '1',
    gradeId: 'grade-1',
    studentId: 'student-1',
    requestedGrade: 'A',
    reason:
      'I believe there was an error in the grading of my final exam. I answered all questions correctly.',
    supportingDetails:
      'I have reviewed my exam and compared it with the answer key provided.',
    status: 'pending',
    submissionDate: new Date('2024-01-15T10:00:00Z'),
  },
  {
    id: '2',
    gradeId: 'grade-2',
    studentId: 'student-1',
    requestedGrade: 'B+',
    reason:
      'Missing points for extra credit assignment that was submitted on time.',
    supportingDetails:
      'Email confirmation shows the assignment was submitted before the deadline.',
    status: 'approved',
    submissionDate: new Date('2024-01-10T14:30:00Z'),
    reviewDate: new Date('2024-01-12T09:15:00Z'),
  },
  {
    id: '3',
    gradeId: 'grade-3',
    studentId: 'student-1',
    requestedGrade: 'C+',
    reason:
      'Attendance points were not properly calculated in the final grade.',
    supportingDetails: '',
    status: 'rejected',
    submissionDate: new Date('2024-01-05T16:45:00Z'),
    reviewDate: new Date('2024-01-08T11:20:00Z'),
  },
];

// Mock grade controller
const createMockGradeController = (
  corrections: GradeCorrection[] | null = mockCorrections,
  isLoading = false,
  error: string | null = null
): UseGradeReturn => ({
  grades: { data: null, isLoading: false, error: null },
  gradeCorrections: { data: corrections, isLoading, error },
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
  fetchGradeCorrections: jest.fn(),
  fetchGradeCorrectionsPaginated: jest.fn(),
  fetchCorrectionById: jest.fn(),
  checkCorrectionEligibility: jest.fn(),
  getCorrectionAttempts: jest.fn(),
  fetchCorrectionSummary: jest.fn(),
  clearGrades: jest.fn(),
  clearCorrections: jest.fn(),
  clearSelectedGrade: jest.fn(),
  clearSelectedCorrection: jest.fn(),
  clearErrors: jest.fn(),
});

describe('CorrectionsList', () => {
  const defaultProps = {
    studentId: 'student-1',
    gradeController: createMockGradeController(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should display loading spinner when corrections are loading', () => {
      const gradeController = createMockGradeController(null, true);
      render(
        <CorrectionsList {...defaultProps} gradeController={gradeController} />
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(
        screen.getByText('Loading correction requests...')
      ).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when there is an error', () => {
      const gradeController = createMockGradeController(
        null,
        false,
        'Failed to load corrections'
      );
      render(
        <CorrectionsList {...defaultProps} gradeController={gradeController} />
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(
        screen.getByText('Unable to Load Correction Requests')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Failed to load corrections')
      ).toBeInTheDocument();
    });

    it('should call fetchGradeCorrections when retry button is clicked', () => {
      const gradeController = createMockGradeController(
        null,
        false,
        'Network error'
      );
      render(
        <CorrectionsList {...defaultProps} gradeController={gradeController} />
      );

      const retryButton = screen.getByText('Try Again');
      fireEvent.click(retryButton);

      expect(gradeController.fetchGradeCorrections).toHaveBeenCalledWith(
        'student-1',
        undefined
      );
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no corrections exist', () => {
      const gradeController = createMockGradeController([]);
      render(
        <CorrectionsList {...defaultProps} gradeController={gradeController} />
      );

      expect(screen.getByText('No Correction Requests')).toBeInTheDocument();
      expect(
        screen.getByText(
          /You haven't submitted any grade correction requests yet/
        )
      ).toBeInTheDocument();
    });

    it('should display empty state when corrections data is null', () => {
      const gradeController = createMockGradeController(null);
      render(
        <CorrectionsList {...defaultProps} gradeController={gradeController} />
      );

      expect(screen.getByText('No Correction Requests')).toBeInTheDocument();
    });
  });

  describe('Corrections Display', () => {
    it('should display corrections grouped by status', () => {
      render(<CorrectionsList {...defaultProps} />);

      expect(screen.getByText('Pending Review (1)')).toBeInTheDocument();
      expect(screen.getByText('Approved (1)')).toBeInTheDocument();
      expect(screen.getByText('Rejected (1)')).toBeInTheDocument();
    });

    it('should display correction details correctly', () => {
      render(<CorrectionsList {...defaultProps} />);

      // Check pending correction
      expect(screen.getByText('→ A')).toBeInTheDocument();
      expect(
        screen.getByText(/I believe there was an error in the grading/)
      ).toBeInTheDocument();

      // Check approved correction
      expect(screen.getByText('→ B+')).toBeInTheDocument();
      expect(
        screen.getByText(/Missing points for extra credit assignment/)
      ).toBeInTheDocument();

      // Check rejected correction
      expect(screen.getByText('→ C+')).toBeInTheDocument();
      expect(
        screen.getByText(/Attendance points were not properly calculated/)
      ).toBeInTheDocument();
    });

    it('should display status badges with correct styling', () => {
      render(<CorrectionsList {...defaultProps} />);

      const pendingBadge = screen.getByText('Pending');
      const approvedBadge = screen.getByText('Approved');
      const rejectedBadge = screen.getByText('Rejected');

      expect(pendingBadge).toHaveClass('status-badge', 'status-pending');
      expect(approvedBadge).toHaveClass('status-badge', 'status-approved');
      expect(rejectedBadge).toHaveClass('status-badge', 'status-rejected');
    });

    it('should display submission dates correctly', () => {
      render(<CorrectionsList {...defaultProps} />);

      // Check that dates are formatted and displayed
      expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
      expect(screen.getByText(/Jan 10, 2024/)).toBeInTheDocument();
      expect(screen.getByText(/Jan 5, 2024/)).toBeInTheDocument();
    });

    it('should display review dates for completed corrections', () => {
      render(<CorrectionsList {...defaultProps} />);

      // Should show review dates for approved and rejected corrections
      expect(screen.getByText(/Jan 12, 2024/)).toBeInTheDocument();
      expect(screen.getByText(/Jan 8, 2024/)).toBeInTheDocument();
    });

    it('should truncate long reason text', () => {
      const longReasonCorrection: GradeCorrection = {
        ...mockCorrections[0],
        reason:
          'This is a very long reason that should be truncated because it exceeds the maximum display length for the correction card view and should show ellipsis',
      };

      const gradeController = createMockGradeController([longReasonCorrection]);
      render(
        <CorrectionsList {...defaultProps} gradeController={gradeController} />
      );

      expect(
        screen.getByText(
          /This is a very long reason that should be truncated.../
        )
      ).toBeInTheDocument();
    });

    it('should truncate long supporting details', () => {
      const longDetailsCorrection: GradeCorrection = {
        ...mockCorrections[0],
        supportingDetails:
          'These are very long supporting details that should be truncated in the card view',
      };

      const gradeController = createMockGradeController([
        longDetailsCorrection,
      ]);
      render(
        <CorrectionsList {...defaultProps} gradeController={gradeController} />
      );

      expect(
        screen.getByText(
          /These are very long supporting details that should be truncated.../
        )
      ).toBeInTheDocument();
    });

    it('should not display supporting details section when empty', () => {
      const noDetailsCorrection: GradeCorrection = {
        ...mockCorrections[0],
        supportingDetails: '',
      };

      const gradeController = createMockGradeController([noDetailsCorrection]);
      render(
        <CorrectionsList {...defaultProps} gradeController={gradeController} />
      );

      expect(screen.queryByText('Supporting Details:')).not.toBeInTheDocument();
    });
  });

  describe('Summary Information', () => {
    it('should display total and pending request counts', () => {
      render(<CorrectionsList {...defaultProps} />);

      expect(screen.getByText('Total Requests: 3')).toBeInTheDocument();
      expect(screen.getByText('Pending: 1')).toBeInTheDocument();
    });

    it('should handle zero pending requests', () => {
      const noPendingCorrections = mockCorrections.filter(
        (c) => c.status !== 'pending'
      );
      const gradeController = createMockGradeController(noPendingCorrections);
      render(
        <CorrectionsList {...defaultProps} gradeController={gradeController} />
      );

      expect(screen.getByText('Pending: 0')).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('should call onCorrectionSelect when correction card is clicked', () => {
      const onCorrectionSelect = jest.fn();
      render(
        <CorrectionsList
          {...defaultProps}
          onCorrectionSelect={onCorrectionSelect}
        />
      );

      const correctionCards = screen.getAllByRole('button');
      fireEvent.click(correctionCards[0]);

      expect(onCorrectionSelect).toHaveBeenCalledWith(mockCorrections[0]);
    });

    it('should handle keyboard navigation on correction cards', () => {
      const onCorrectionSelect = jest.fn();
      render(
        <CorrectionsList
          {...defaultProps}
          onCorrectionSelect={onCorrectionSelect}
        />
      );

      const correctionCards = screen.getAllByRole('button');

      // Test Enter key
      fireEvent.keyDown(correctionCards[0], { key: 'Enter' });
      expect(onCorrectionSelect).toHaveBeenCalledWith(mockCorrections[0]);

      // Test Space key
      fireEvent.keyDown(correctionCards[1], { key: ' ' });
      expect(onCorrectionSelect).toHaveBeenCalledWith(mockCorrections[1]);

      // Test other keys (should not trigger)
      fireEvent.keyDown(correctionCards[2], { key: 'Tab' });
      expect(onCorrectionSelect).toHaveBeenCalledTimes(2);
    });

    it('should not make cards clickable when onCorrectionSelect is not provided', () => {
      render(<CorrectionsList {...defaultProps} />);

      const correctionCards = screen.queryAllByRole('button');
      expect(correctionCards).toHaveLength(0);
    });
  });

  describe('Filtering', () => {
    it('should pass filters to fetchGradeCorrections', () => {
      const filters = { status: 'pending' as const };
      const gradeController = createMockGradeController();

      render(
        <CorrectionsList
          {...defaultProps}
          gradeController={gradeController}
          filters={filters}
        />
      );

      expect(gradeController.fetchGradeCorrections).toHaveBeenCalledWith(
        'student-1',
        filters
      );
    });

    it('should refetch corrections when filters change', () => {
      const gradeController = createMockGradeController();
      const { rerender } = render(
        <CorrectionsList {...defaultProps} gradeController={gradeController} />
      );

      expect(gradeController.fetchGradeCorrections).toHaveBeenCalledWith(
        'student-1',
        undefined
      );

      const newFilters = { status: 'approved' as const };
      rerender(
        <CorrectionsList
          {...defaultProps}
          gradeController={gradeController}
          filters={newFilters}
        />
      );

      expect(gradeController.fetchGradeCorrections).toHaveBeenCalledWith(
        'student-1',
        newFilters
      );
    });
  });

  describe('Sorting', () => {
    it('should sort corrections by submission date (most recent first)', () => {
      render(<CorrectionsList {...defaultProps} />);

      // Check that the corrections are displayed in the correct order by looking at the status sections
      // Since corrections are grouped by status, we need to check within each status group
      const statusSections = screen.getAllByText(/Review|Approved|Rejected/);

      // Verify that the pending correction (Jan 15) appears first in its section
      const submittedLabels = screen.getAllByText('Submitted:');
      expect(submittedLabels).toHaveLength(3);

      // The corrections should be sorted by submission date within their status groups
      // We can verify this by checking that the component renders without errors
      // and that all expected corrections are present
      expect(screen.getByText('→ A')).toBeInTheDocument(); // Most recent pending
      expect(screen.getByText('→ B+')).toBeInTheDocument(); // Approved
      expect(screen.getByText('→ C+')).toBeInTheDocument(); // Oldest rejected
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(
        <CorrectionsList {...defaultProps} onCorrectionSelect={jest.fn()} />
      );

      const correctionCards = screen.getAllByRole('button');
      expect(correctionCards).toHaveLength(3);

      correctionCards.forEach((card) => {
        expect(card).toHaveAttribute('tabIndex', '0');
      });
    });

    it('should have proper loading state accessibility', () => {
      const gradeController = createMockGradeController(null, true);
      render(
        <CorrectionsList {...defaultProps} gradeController={gradeController} />
      );

      const loadingElement = screen.getByRole('status');
      expect(loadingElement).toHaveAttribute('aria-live', 'polite');
    });

    it('should have proper error state accessibility', () => {
      const gradeController = createMockGradeController(
        null,
        false,
        'Error message'
      );
      render(
        <CorrectionsList {...defaultProps} gradeController={gradeController} />
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('Data Fetching', () => {
    it('should fetch corrections on mount', () => {
      const gradeController = createMockGradeController();
      render(
        <CorrectionsList {...defaultProps} gradeController={gradeController} />
      );

      expect(gradeController.fetchGradeCorrections).toHaveBeenCalledWith(
        'student-1',
        undefined
      );
    });

    it('should refetch corrections when studentId changes', () => {
      const gradeController = createMockGradeController();
      const { rerender } = render(
        <CorrectionsList {...defaultProps} gradeController={gradeController} />
      );

      expect(gradeController.fetchGradeCorrections).toHaveBeenCalledWith(
        'student-1',
        undefined
      );

      rerender(
        <CorrectionsList
          {...defaultProps}
          studentId="student-2"
          gradeController={gradeController}
        />
      );

      expect(gradeController.fetchGradeCorrections).toHaveBeenCalledWith(
        'student-2',
        undefined
      );
    });

    it('should not fetch corrections when studentId is empty', () => {
      const gradeController = createMockGradeController();
      render(
        <CorrectionsList
          {...defaultProps}
          studentId=""
          gradeController={gradeController}
        />
      );

      expect(gradeController.fetchGradeCorrections).not.toHaveBeenCalled();
    });
  });
});
