import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GradeCorrectionForm } from '../GradeCorrectionForm';
import { Grade } from '../../../../../entities/Grade';
import { UseGradeReturn } from '../../../../../adapters/controllers/useGrade';
import { GradeCorrection } from '../../../../../entities/GradeCorrection';

// Mock grade data
const mockGrade: Grade = {
  id: 'grade-1',
  courseCode: 'CS101',
  courseName: 'Introduction to Computer Science',
  grade: 'B',
  creditHours: 3,
  semester: 'Fall 2023',
  studentId: 'student-1',
};

// Mock grade controller
const createMockGradeController = (
  overrides: Partial<UseGradeReturn> = {}
): UseGradeReturn => ({
  grades: { data: null, isLoading: false, error: null },
  gradeCorrections: { data: null, isLoading: false, error: null },
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
  ...overrides,
});

describe('GradeCorrectionForm', () => {
  let mockGradeController: UseGradeReturn;
  let mockOnSuccess: jest.Mock;
  let mockOnCancel: jest.Mock;

  beforeEach(() => {
    mockGradeController = createMockGradeController();
    mockOnSuccess = jest.fn();
    mockOnCancel = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (
    props: Partial<React.ComponentProps<typeof GradeCorrectionForm>> = {}
  ) => {
    return render(
      <GradeCorrectionForm
        grade={mockGrade}
        gradeController={mockGradeController}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
        {...props}
      />
    );
  };

  describe('Rendering', () => {
    it('should render the form with course information', () => {
      renderComponent();

      expect(screen.getByText('Request Grade Correction')).toBeInTheDocument();
      expect(
        screen.getByText('CS101 - Introduction to Computer Science')
      ).toBeInTheDocument();
      expect(screen.getByText('B')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('Fall 2023')).toBeInTheDocument();
    });

    it('should render all form fields', () => {
      renderComponent();

      expect(screen.getByLabelText(/requested grade/i)).toBeInTheDocument();
      expect(
        screen.getByLabelText(/reason for correction request/i)
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/supporting details/i)).toBeInTheDocument();
    });

    it('should render submit and cancel buttons', () => {
      renderComponent();

      expect(
        screen.getByRole('button', { name: /submit correction request/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /cancel/i })
      ).toBeInTheDocument();
    });

    it('should show available grades excluding current grade', () => {
      renderComponent();

      const gradeSelect = screen.getByLabelText(/requested grade/i);
      fireEvent.click(gradeSelect);

      // Should not include current grade 'B'
      expect(
        screen.queryByRole('option', { name: 'B' })
      ).not.toBeInTheDocument();

      // Should include other grades
      expect(screen.getByRole('option', { name: 'A+' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'A' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'C' })).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show validation errors for empty required fields', async () => {
      const user = userEvent.setup();
      renderComponent();

      const submitButton = screen.getByRole('button', {
        name: /submit correction request/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/requested grade.*required/i)
        ).toBeInTheDocument();
        expect(screen.getByText(/reason.*required/i)).toBeInTheDocument();
      });
    });

    it('should show validation error for short reason', async () => {
      const user = userEvent.setup();
      renderComponent();

      const reasonField = screen.getByLabelText(
        /reason for correction request/i
      );
      await user.type(reasonField, 'Short');

      const submitButton = screen.getByRole('button', {
        name: /submit correction request/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/reason must be at least 10 characters/i)
        ).toBeInTheDocument();
      });
    });

    it('should show validation error for reason that is too long', async () => {
      const user = userEvent.setup();
      renderComponent();

      const reasonField = screen.getByLabelText(
        /reason for correction request/i
      );
      const longReason = 'a'.repeat(501);

      // Manually set the value to bypass maxLength restriction for testing
      fireEvent.change(reasonField, { target: { value: longReason } });

      const submitButton = screen.getByRole('button', {
        name: /submit correction request/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/reason must be no more than 500 characters/i)
        ).toBeInTheDocument();
      });
    });

    it('should show validation error for supporting details that are too long', async () => {
      const user = userEvent.setup();
      renderComponent();

      const gradeSelect = screen.getByLabelText(/requested grade/i);
      await user.selectOptions(gradeSelect, 'A');

      const reasonField = screen.getByLabelText(
        /reason for correction request/i
      );
      await user.type(reasonField, 'Valid reason for correction request');

      const detailsField = screen.getByLabelText(/supporting details/i);
      const longDetails = 'a'.repeat(1001);

      // Manually set the value to bypass maxLength restriction for testing
      fireEvent.change(detailsField, { target: { value: longDetails } });

      const submitButton = screen.getByRole('button', {
        name: /submit correction request/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(
            /supporting details must be no more than 1000 characters/i
          )
        ).toBeInTheDocument();
      });
    });

    it('should clear field errors when user starts typing', async () => {
      const user = userEvent.setup();
      renderComponent();

      // Trigger validation errors
      const submitButton = screen.getByRole('button', {
        name: /submit correction request/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/reason.*required/i)).toBeInTheDocument();
      });

      // Start typing in reason field
      const reasonField = screen.getByLabelText(
        /reason for correction request/i
      );
      await user.type(reasonField, 'Valid reason');

      // Error should be cleared
      expect(screen.queryByText(/reason.*required/i)).not.toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      const user = userEvent.setup();
      const mockCorrection: GradeCorrection = {
        id: 'correction-1',
        gradeId: 'grade-1',
        studentId: 'student-1',
        requestedGrade: 'A',
        reason: 'Valid reason for correction',
        supportingDetails: 'Additional details',
        status: 'pending',
        submissionDate: new Date(),
      };

      mockGradeController.submitGradeCorrection = jest
        .fn()
        .mockResolvedValue(mockCorrection);
      renderComponent();

      // Fill out form
      const gradeSelect = screen.getByLabelText(/requested grade/i);
      await user.selectOptions(gradeSelect, 'A');

      const reasonField = screen.getByLabelText(
        /reason for correction request/i
      );
      await user.type(reasonField, 'Valid reason for correction');

      const detailsField = screen.getByLabelText(/supporting details/i);
      await user.type(detailsField, 'Additional details');

      // Submit form
      const submitButton = screen.getByRole('button', {
        name: /submit correction request/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockGradeController.submitGradeCorrection).toHaveBeenCalledWith({
          gradeId: 'grade-1',
          studentId: 'student-1',
          requestedGrade: 'A',
          reason: 'Valid reason for correction',
          supportingDetails: 'Additional details',
        });
      });

      expect(mockOnSuccess).toHaveBeenCalledWith(mockCorrection);
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      let resolveSubmission: (value: any) => void;
      const submissionPromise = new Promise((resolve) => {
        resolveSubmission = resolve;
      });

      mockGradeController.submitGradeCorrection = jest
        .fn()
        .mockReturnValue(submissionPromise);
      renderComponent();

      // Fill out form
      const gradeSelect = screen.getByLabelText(/requested grade/i);
      await user.selectOptions(gradeSelect, 'A');

      const reasonField = screen.getByLabelText(
        /reason for correction request/i
      );
      await user.type(reasonField, 'Valid reason for correction');

      // Submit form
      const submitButton = screen.getByRole('button', {
        name: /submit correction request/i,
      });
      await user.click(submitButton);

      // Check loading state
      expect(screen.getByText(/submitting request/i)).toBeInTheDocument();
      expect(
        screen.getByText(/please wait while we submit/i)
      ).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      // Resolve submission
      resolveSubmission!({});
    });

    it('should handle submission errors', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Failed to submit correction';
      mockGradeController.submitGradeCorrection = jest
        .fn()
        .mockRejectedValue(new Error(errorMessage));
      renderComponent();

      // Fill out form
      const gradeSelect = screen.getByLabelText(/requested grade/i);
      await user.selectOptions(gradeSelect, 'A');

      const reasonField = screen.getByLabelText(
        /reason for correction request/i
      );
      await user.type(reasonField, 'Valid reason for correction');

      // Submit form
      const submitButton = screen.getByRole('button', {
        name: /submit correction request/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should show success message after successful submission', async () => {
      const user = userEvent.setup();
      const mockCorrection: GradeCorrection = {
        id: 'correction-1',
        gradeId: 'grade-1',
        studentId: 'student-1',
        requestedGrade: 'A',
        reason: 'Valid reason for correction',
        supportingDetails: '',
        status: 'pending',
        submissionDate: new Date(),
      };

      mockGradeController.submitGradeCorrection = jest
        .fn()
        .mockResolvedValue(mockCorrection);
      renderComponent();

      // Fill out form
      const gradeSelect = screen.getByLabelText(/requested grade/i);
      await user.selectOptions(gradeSelect, 'A');

      const reasonField = screen.getByLabelText(
        /reason for correction request/i
      );
      await user.type(reasonField, 'Valid reason for correction');

      // Submit form
      const submitButton = screen.getByRole('button', {
        name: /submit correction request/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(
            /correction request has been submitted successfully/i
          )
        ).toBeInTheDocument();
      });
    });

    it('should reset form after successful submission', async () => {
      const user = userEvent.setup();
      const mockCorrection: GradeCorrection = {
        id: 'correction-1',
        gradeId: 'grade-1',
        studentId: 'student-1',
        requestedGrade: 'A',
        reason: 'Valid reason for correction',
        supportingDetails: 'Additional details',
        status: 'pending',
        submissionDate: new Date(),
      };

      mockGradeController.submitGradeCorrection = jest
        .fn()
        .mockResolvedValue(mockCorrection);
      renderComponent();

      // Fill out form
      const gradeSelect = screen.getByLabelText(
        /requested grade/i
      ) as HTMLSelectElement;
      const reasonField = screen.getByLabelText(
        /reason for correction request/i
      ) as HTMLTextAreaElement;
      const detailsField = screen.getByLabelText(
        /supporting details/i
      ) as HTMLTextAreaElement;

      await user.selectOptions(gradeSelect, 'A');
      await user.type(reasonField, 'Valid reason for correction');
      await user.type(detailsField, 'Additional details');

      // Submit form
      const submitButton = screen.getByRole('button', {
        name: /submit correction request/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(gradeSelect.value).toBe('');
        expect(reasonField.value).toBe('');
        expect(detailsField.value).toBe('');
      });
    });
  });

  describe('Cancel Functionality', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should reset form when cancel button is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      // Fill out form
      const gradeSelect = screen.getByLabelText(
        /requested grade/i
      ) as HTMLSelectElement;
      const reasonField = screen.getByLabelText(
        /reason for correction request/i
      ) as HTMLTextAreaElement;

      await user.selectOptions(gradeSelect, 'A');
      await user.type(reasonField, 'Some reason');

      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(gradeSelect.value).toBe('');
      expect(reasonField.value).toBe('');
    });
  });

  describe('Character Counting', () => {
    it('should show character count for reason field', async () => {
      const user = userEvent.setup();
      renderComponent();

      const reasonField = screen.getByLabelText(
        /reason for correction request/i
      );
      await user.type(reasonField, 'Test reason');

      expect(screen.getByText('11/500 characters')).toBeInTheDocument();
    });

    it('should show character count for supporting details field', async () => {
      const user = userEvent.setup();
      renderComponent();

      const detailsField = screen.getByLabelText(/supporting details/i);
      await user.type(detailsField, 'Test details');

      expect(screen.getByText('12/1000 characters')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and descriptions', () => {
      renderComponent();

      const gradeSelect = screen.getByLabelText(/requested grade/i);
      const reasonField = screen.getByLabelText(
        /reason for correction request/i
      );
      const detailsField = screen.getByLabelText(/supporting details/i);

      expect(gradeSelect).toHaveAttribute('aria-describedby');
      expect(reasonField).toHaveAttribute('aria-describedby');
      expect(detailsField).toHaveAttribute('aria-describedby');
    });

    it('should mark fields as invalid when there are errors', async () => {
      const user = userEvent.setup();
      renderComponent();

      const submitButton = screen.getByRole('button', {
        name: /submit correction request/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        const gradeSelect = screen.getByLabelText(/requested grade/i);
        const reasonField = screen.getByLabelText(
          /reason for correction request/i
        );

        expect(gradeSelect).toHaveAttribute('aria-invalid', 'true');
        expect(reasonField).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('should have proper role attributes for alerts', async () => {
      const user = userEvent.setup();
      renderComponent();

      const submitButton = screen.getByRole('button', {
        name: /submit correction request/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessages = screen.getAllByRole('alert');
        expect(errorMessages.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle grade with no available alternatives', () => {
      const gradeWithNoAlternatives = { ...mockGrade, grade: 'F' };
      renderComponent({ grade: gradeWithNoAlternatives });

      const gradeSelect = screen.getByLabelText(/requested grade/i);
      fireEvent.click(gradeSelect);

      // Should not include current grade 'F'
      expect(
        screen.queryByRole('option', { name: 'F' })
      ).not.toBeInTheDocument();

      // Should include other grades
      expect(screen.getByRole('option', { name: 'A+' })).toBeInTheDocument();
    });

    it('should handle missing onSuccess callback', async () => {
      const user = userEvent.setup();
      const mockCorrection: GradeCorrection = {
        id: 'correction-1',
        gradeId: 'grade-1',
        studentId: 'student-1',
        requestedGrade: 'A',
        reason: 'Valid reason for correction',
        supportingDetails: '',
        status: 'pending',
        submissionDate: new Date(),
      };

      mockGradeController.submitGradeCorrection = jest
        .fn()
        .mockResolvedValue(mockCorrection);
      renderComponent({ onSuccess: undefined });

      // Fill out and submit form
      const gradeSelect = screen.getByLabelText(/requested grade/i);
      await user.selectOptions(gradeSelect, 'A');

      const reasonField = screen.getByLabelText(
        /reason for correction request/i
      );
      await user.type(reasonField, 'Valid reason for correction');

      const submitButton = screen.getByRole('button', {
        name: /submit correction request/i,
      });
      await user.click(submitButton);

      // Should not throw error
      await waitFor(() => {
        expect(
          screen.getByText(
            /correction request has been submitted successfully/i
          )
        ).toBeInTheDocument();
      });
    });

    it('should handle missing onCancel callback', async () => {
      const user = userEvent.setup();
      renderComponent({ onCancel: undefined });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Should not throw error
      expect(cancelButton).toBeInTheDocument();
    });
  });
});
