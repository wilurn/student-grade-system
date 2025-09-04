import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CorrectionItem } from '../CorrectionItem';
import { GradeCorrection } from '../../../../../entities/GradeCorrection';
import { Grade } from '../../../../../entities/Grade';

// Mock data
const mockGrade: Grade = {
  id: 'grade-1',
  courseCode: 'CS101',
  courseName: 'Introduction to Computer Science',
  grade: 'B+',
  creditHours: 3,
  semester: 'Fall 2023',
  studentId: 'student-1',
};

const mockPendingCorrection: GradeCorrection = {
  id: 'correction-1',
  gradeId: 'grade-1',
  studentId: 'student-1',
  requestedGrade: 'A',
  reason:
    'I believe there was an error in the grading of my final exam. I answered all questions correctly but received partial credit.',
  supportingDetails:
    'I have reviewed my exam with the TA and they confirmed my answers were correct.',
  status: 'pending',
  submissionDate: new Date('2023-12-01T10:00:00Z'),
  reviewDate: undefined,
};

const mockApprovedCorrection: GradeCorrection = {
  id: 'correction-2',
  gradeId: 'grade-1',
  studentId: 'student-1',
  requestedGrade: 'A',
  reason: 'Grading error on final exam.',
  supportingDetails: 'Confirmed with instructor.',
  status: 'approved',
  submissionDate: new Date('2023-12-01T10:00:00Z'),
  reviewDate: new Date('2023-12-05T14:30:00Z'),
};

const mockRejectedCorrection: GradeCorrection = {
  id: 'correction-3',
  gradeId: 'grade-1',
  studentId: 'student-1',
  requestedGrade: 'A',
  reason: 'I think my grade should be higher.',
  supportingDetails: 'No specific evidence provided.',
  status: 'rejected',
  submissionDate: new Date('2023-12-01T10:00:00Z'),
  reviewDate: new Date('2023-12-03T09:15:00Z'),
};

describe('CorrectionItem', () => {
  beforeEach(() => {
    // Mock Date.now() to ensure consistent test results
    jest
      .spyOn(Date, 'now')
      .mockImplementation(() => new Date('2023-12-10T12:00:00Z').getTime());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders correction item with grade information', () => {
      render(
        <CorrectionItem correction={mockPendingCorrection} grade={mockGrade} />
      );

      expect(screen.getByText('CS101')).toBeInTheDocument();
      expect(
        screen.getByText('Introduction to Computer Science')
      ).toBeInTheDocument();
      expect(screen.getByText('Fall 2023')).toBeInTheDocument();
      expect(screen.getByText('3 credits')).toBeInTheDocument();
    });

    it('renders correction item without grade information', () => {
      render(<CorrectionItem correction={mockPendingCorrection} />);

      expect(screen.getByText('Grade Correction Request')).toBeInTheDocument();
      expect(screen.queryByText('CS101')).not.toBeInTheDocument();
    });

    it('displays correction reason and supporting details', () => {
      render(
        <CorrectionItem correction={mockPendingCorrection} grade={mockGrade} />
      );

      expect(
        screen.getByText(/I believe there was an error in the grading/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/I have reviewed my exam with the TA/)
      ).toBeInTheDocument();
    });

    it('displays requested grade change with grade provided', () => {
      render(
        <CorrectionItem correction={mockPendingCorrection} grade={mockGrade} />
      );

      expect(screen.getByText('B+')).toBeInTheDocument();
      expect(screen.getByText('→')).toBeInTheDocument();
      expect(screen.getByText('A')).toBeInTheDocument();
    });

    it('displays requested grade without current grade', () => {
      render(<CorrectionItem correction={mockPendingCorrection} />);

      expect(screen.getByText('Requested:')).toBeInTheDocument();
      expect(screen.getByText('A')).toBeInTheDocument();
    });
  });

  describe('Status Display', () => {
    it('displays pending status with correct styling', () => {
      render(
        <CorrectionItem correction={mockPendingCorrection} grade={mockGrade} />
      );

      const statusBadge = screen.getByText('Pending');
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge.closest('.status-badge')).toHaveClass(
        'status-pending'
      );
      expect(screen.getByText('⏳')).toBeInTheDocument();
      expect(screen.getByText('Awaiting review')).toBeInTheDocument();
    });

    it('displays approved status with correct styling', () => {
      render(
        <CorrectionItem correction={mockApprovedCorrection} grade={mockGrade} />
      );

      const statusBadge = screen.getByText('Approved');
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge.closest('.status-badge')).toHaveClass(
        'status-approved'
      );
      expect(screen.getByText('✅')).toBeInTheDocument();
    });

    it('displays rejected status with correct styling', () => {
      render(
        <CorrectionItem correction={mockRejectedCorrection} grade={mockGrade} />
      );

      const statusBadge = screen.getByText('Rejected');
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge.closest('.status-badge')).toHaveClass(
        'status-rejected'
      );
      expect(screen.getByText('❌')).toBeInTheDocument();
    });
  });

  describe('Date Display', () => {
    it('displays submission date and days ago', () => {
      render(
        <CorrectionItem correction={mockPendingCorrection} grade={mockGrade} />
      );

      expect(screen.getByText('Submitted:')).toBeInTheDocument();
      expect(screen.getByText(/Dec 1, 2023/)).toBeInTheDocument();
      expect(screen.getByText(/days ago/)).toBeInTheDocument();
    });

    it('displays review date when available', () => {
      render(
        <CorrectionItem correction={mockApprovedCorrection} grade={mockGrade} />
      );

      expect(screen.getByText('Reviewed:')).toBeInTheDocument();
      expect(screen.getByText(/Dec 5, 2023/)).toBeInTheDocument();
    });

    it('does not display review date when not available', () => {
      render(
        <CorrectionItem correction={mockPendingCorrection} grade={mockGrade} />
      );

      expect(screen.queryByText('Reviewed:')).not.toBeInTheDocument();
    });
  });

  describe('Text Truncation', () => {
    const longReasonCorrection: GradeCorrection = {
      ...mockPendingCorrection,
      reason:
        'This is a very long reason that should be truncated when displayed in the component because it exceeds the normal display length and would make the component too tall for the list view.',
      supportingDetails:
        'This is also a very long supporting details text that should be truncated in the normal view because it is much longer than the typical supporting details that users would provide and would make the component display too much information at once.',
    };

    it('truncates long reason text by default', () => {
      render(
        <CorrectionItem correction={longReasonCorrection} grade={mockGrade} />
      );

      const reasonText = screen.getByText(
        /This is a very long reason that should be truncated/
      );
      expect(reasonText.textContent).toMatch(/\.\.\.$/);
    });

    it('shows full reason text when showFullDetails is true', () => {
      render(
        <CorrectionItem
          correction={longReasonCorrection}
          grade={mockGrade}
          showFullDetails={true}
        />
      );

      const reasonText = screen.getByText(
        /This is a very long reason that should be truncated/
      );
      expect(reasonText.textContent).not.toMatch(/\.\.\.$/);
      expect(reasonText.textContent).toContain(
        'would make the component too tall'
      );
    });

    it('truncates long supporting details by default', () => {
      render(
        <CorrectionItem correction={longReasonCorrection} grade={mockGrade} />
      );

      const detailsText = screen.getByText(
        /This is also a very long supporting details/
      );
      expect(detailsText.textContent).toMatch(/\.\.\.$/);
    });

    it('shows full supporting details when showFullDetails is true', () => {
      render(
        <CorrectionItem
          correction={longReasonCorrection}
          grade={mockGrade}
          showFullDetails={true}
        />
      );

      const detailsText = screen.getByText(
        /This is also a very long supporting details/
      );
      expect(detailsText.textContent).not.toMatch(/\.\.\.$/);
      expect(detailsText.textContent).toContain('truncated in the normal view');
    });
  });

  describe('Click Interaction', () => {
    it('calls onCorrectionClick when clicked and handler is provided', () => {
      const mockOnClick = jest.fn();
      render(
        <CorrectionItem
          correction={mockPendingCorrection}
          grade={mockGrade}
          onCorrectionClick={mockOnClick}
        />
      );

      const correctionItem = screen.getByRole('button');
      fireEvent.click(correctionItem);

      expect(mockOnClick).toHaveBeenCalledWith(mockPendingCorrection);
    });

    it('handles keyboard interaction (Enter key)', () => {
      const mockOnClick = jest.fn();
      render(
        <CorrectionItem
          correction={mockPendingCorrection}
          grade={mockGrade}
          onCorrectionClick={mockOnClick}
        />
      );

      const correctionItem = screen.getByRole('button');
      fireEvent.keyDown(correctionItem, { key: 'Enter' });

      expect(mockOnClick).toHaveBeenCalledWith(mockPendingCorrection);
    });

    it('handles keyboard interaction (Space key)', () => {
      const mockOnClick = jest.fn();
      render(
        <CorrectionItem
          correction={mockPendingCorrection}
          grade={mockGrade}
          onCorrectionClick={mockOnClick}
        />
      );

      const correctionItem = screen.getByRole('button');
      fireEvent.keyDown(correctionItem, { key: ' ' });

      expect(mockOnClick).toHaveBeenCalledWith(mockPendingCorrection);
    });

    it('does not have click behavior when onCorrectionClick is not provided', () => {
      render(
        <CorrectionItem correction={mockPendingCorrection} grade={mockGrade} />
      );

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('applies clickable class when onCorrectionClick is provided', () => {
      const mockOnClick = jest.fn();
      const { container } = render(
        <CorrectionItem
          correction={mockPendingCorrection}
          grade={mockGrade}
          onCorrectionClick={mockOnClick}
        />
      );

      const correctionItem = container.querySelector('.correction-item');
      expect(correctionItem).toHaveClass('clickable');
    });

    it('does not apply clickable class when onCorrectionClick is not provided', () => {
      const { container } = render(
        <CorrectionItem correction={mockPendingCorrection} grade={mockGrade} />
      );

      const correctionItem = container.querySelector('.correction-item');
      expect(correctionItem).not.toHaveClass('clickable');
    });
  });

  describe('Supporting Details', () => {
    it('displays supporting details when provided', () => {
      render(
        <CorrectionItem correction={mockPendingCorrection} grade={mockGrade} />
      );

      expect(screen.getByText('Supporting Details:')).toBeInTheDocument();
      expect(
        screen.getByText(/I have reviewed my exam with the TA/)
      ).toBeInTheDocument();
    });

    it('does not display supporting details section when not provided', () => {
      const correctionWithoutDetails: GradeCorrection = {
        ...mockPendingCorrection,
        supportingDetails: '',
      };

      render(
        <CorrectionItem
          correction={correctionWithoutDetails}
          grade={mockGrade}
        />
      );

      expect(screen.queryByText('Supporting Details:')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes when clickable', () => {
      const mockOnClick = jest.fn();
      render(
        <CorrectionItem
          correction={mockPendingCorrection}
          grade={mockGrade}
          onCorrectionClick={mockOnClick}
        />
      );

      const correctionItem = screen.getByRole('button');
      expect(correctionItem).toHaveAttribute('tabIndex', '0');
    });

    it('does not have button role when not clickable', () => {
      render(
        <CorrectionItem correction={mockPendingCorrection} grade={mockGrade} />
      );

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('has proper heading structure', () => {
      render(
        <CorrectionItem correction={mockPendingCorrection} grade={mockGrade} />
      );

      expect(
        screen.getByRole('heading', { level: 4, name: 'CS101' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', {
          level: 5,
          name: 'Reason for Correction:',
        })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { level: 5, name: 'Supporting Details:' })
      ).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles correction without supporting details', () => {
      const correctionWithoutDetails: GradeCorrection = {
        ...mockPendingCorrection,
        supportingDetails: '',
      };

      render(
        <CorrectionItem
          correction={correctionWithoutDetails}
          grade={mockGrade}
        />
      );

      expect(screen.getByText('Reason for Correction:')).toBeInTheDocument();
      expect(screen.queryByText('Supporting Details:')).not.toBeInTheDocument();
    });

    it('handles unknown status gracefully', () => {
      const correctionWithUnknownStatus: GradeCorrection = {
        ...mockPendingCorrection,
        status: 'unknown' as any,
      };

      render(
        <CorrectionItem
          correction={correctionWithUnknownStatus}
          grade={mockGrade}
        />
      );

      const statusBadge = screen.getByText('Unknown');
      expect(statusBadge.closest('.status-badge')).toHaveClass(
        'status-unknown'
      );
      expect(screen.getByText('❓')).toBeInTheDocument();
    });

    it('handles very short text without truncation', () => {
      const shortTextCorrection: GradeCorrection = {
        ...mockPendingCorrection,
        reason: 'Short reason',
        supportingDetails: 'Short details',
      };

      render(
        <CorrectionItem correction={shortTextCorrection} grade={mockGrade} />
      );

      expect(screen.getByText('Short reason')).toBeInTheDocument();
      expect(screen.getByText('Short details')).toBeInTheDocument();
    });
  });
});
