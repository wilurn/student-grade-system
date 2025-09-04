import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GradesList } from '../GradesList';
import { Grade } from '../../../../../entities/Grade';
import { UseGradeReturn } from '../../../../../adapters/controllers/useGrade';
import { AsyncState } from '../../../../../shared/types';

// Mock grade data
const mockGrades: Grade[] = [
  {
    id: '1',
    courseCode: 'CS101',
    courseName: 'Introduction to Computer Science',
    grade: 'A',
    creditHours: 3,
    semester: 'Fall 2023',
    studentId: 'student1',
  },
  {
    id: '2',
    courseCode: 'MATH201',
    courseName: 'Calculus II',
    grade: 'B+',
    creditHours: 4,
    semester: 'Fall 2023',
    studentId: 'student1',
  },
  {
    id: '3',
    courseCode: 'ENG101',
    courseName: 'English Composition',
    grade: 'A-',
    creditHours: 3,
    semester: 'Spring 2023',
    studentId: 'student1',
  },
];

// Mock grade controller
const createMockGradeController = (
  gradesState: AsyncState<Grade[]>
): UseGradeReturn => ({
  grades: gradesState,
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
});

describe('GradesList Component', () => {
  const defaultProps = {
    studentId: 'student1',
    gradeController: createMockGradeController({
      data: mockGrades,
      isLoading: false,
      error: null,
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should display loading spinner when grades are loading', () => {
      const loadingController = createMockGradeController({
        data: null,
        isLoading: true,
        error: null,
      });

      render(
        <GradesList {...defaultProps} gradeController={loadingController} />
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Loading grades...')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when there is an error', () => {
      const errorController = createMockGradeController({
        data: null,
        isLoading: false,
        error: 'Failed to load grades',
      });

      render(
        <GradesList {...defaultProps} gradeController={errorController} />
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Unable to Load Grades')).toBeInTheDocument();
      expect(screen.getByText('Failed to load grades')).toBeInTheDocument();
    });

    it('should call fetchGrades when retry button is clicked', () => {
      const errorController = createMockGradeController({
        data: null,
        isLoading: false,
        error: 'Failed to load grades',
      });

      render(
        <GradesList {...defaultProps} gradeController={errorController} />
      );

      const retryButton = screen.getByText('Try Again');
      fireEvent.click(retryButton);

      expect(errorController.fetchGrades).toHaveBeenCalledWith('student1');
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no grades are available', () => {
      const emptyController = createMockGradeController({
        data: [],
        isLoading: false,
        error: null,
      });

      render(
        <GradesList {...defaultProps} gradeController={emptyController} />
      );

      expect(screen.getByText('No Grades Available')).toBeInTheDocument();
      expect(
        screen.getByText(/You don't have any grades recorded yet/)
      ).toBeInTheDocument();
    });

    it('should display empty state when grades data is null', () => {
      const nullController = createMockGradeController({
        data: null,
        isLoading: false,
        error: null,
      });

      render(<GradesList {...defaultProps} gradeController={nullController} />);

      expect(screen.getByText('No Grades Available')).toBeInTheDocument();
    });
  });

  describe('Grades Display', () => {
    it('should display grades grouped by semester', () => {
      render(<GradesList {...defaultProps} />);

      expect(screen.getByText('Academic Grades')).toBeInTheDocument();
      expect(screen.getByText('Fall 2023')).toBeInTheDocument();
      expect(screen.getByText('Spring 2023')).toBeInTheDocument();
    });

    it('should display course information correctly', () => {
      render(<GradesList {...defaultProps} />);

      // Check first course
      expect(screen.getByText('CS101')).toBeInTheDocument();
      expect(
        screen.getByText('Introduction to Computer Science')
      ).toBeInTheDocument();
      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getAllByText('3 credits')).toHaveLength(2); // CS101 and ENG101 both have 3 credits

      // Check second course
      expect(screen.getByText('MATH201')).toBeInTheDocument();
      expect(screen.getByText('Calculus II')).toBeInTheDocument();
      expect(screen.getByText('B+')).toBeInTheDocument();
      expect(screen.getByText('4 credits')).toBeInTheDocument();
    });

    it('should display correct totals in summary', () => {
      render(<GradesList {...defaultProps} />);

      expect(screen.getByText('Total Courses: 3')).toBeInTheDocument();
      expect(screen.getByText('Total Credits: 10')).toBeInTheDocument();
    });

    it('should handle singular credit correctly', () => {
      const singleCreditGrade: Grade[] = [
        {
          id: '1',
          courseCode: 'TEST101',
          courseName: 'Test Course',
          grade: 'A',
          creditHours: 1,
          semester: 'Fall 2023',
          studentId: 'student1',
        },
      ];

      const singleCreditController = createMockGradeController({
        data: singleCreditGrade,
        isLoading: false,
        error: null,
      });

      render(
        <GradesList
          {...defaultProps}
          gradeController={singleCreditController}
        />
      );

      expect(screen.getByText('1 credit')).toBeInTheDocument();
    });
  });

  describe('Grade Selection', () => {
    it('should call onGradeSelect when a grade is clicked', () => {
      const onGradeSelect = jest.fn();

      render(<GradesList {...defaultProps} onGradeSelect={onGradeSelect} />);

      const gradeCard = screen.getByText('CS101').closest('.grade-card');
      expect(gradeCard).toHaveAttribute('role', 'button');
      expect(gradeCard).toHaveAttribute('tabIndex', '0');

      fireEvent.click(gradeCard!);

      expect(onGradeSelect).toHaveBeenCalledWith(mockGrades[0]);
    });

    it('should handle keyboard navigation for grade selection', () => {
      const onGradeSelect = jest.fn();

      render(<GradesList {...defaultProps} onGradeSelect={onGradeSelect} />);

      const gradeCard = screen.getByText('CS101').closest('.grade-card');

      // Test Enter key
      fireEvent.keyDown(gradeCard!, { key: 'Enter' });
      expect(onGradeSelect).toHaveBeenCalledWith(mockGrades[0]);

      // Test Space key
      fireEvent.keyDown(gradeCard!, { key: ' ' });
      expect(onGradeSelect).toHaveBeenCalledTimes(2);

      // Test other keys (should not trigger)
      fireEvent.keyDown(gradeCard!, { key: 'Tab' });
      expect(onGradeSelect).toHaveBeenCalledTimes(2);
    });

    it('should not make grade cards clickable when onGradeSelect is not provided', () => {
      render(<GradesList {...defaultProps} />);

      const gradeCard = screen.getByText('CS101').closest('.grade-card');
      expect(gradeCard).not.toHaveAttribute('role', 'button');
      expect(gradeCard).not.toHaveAttribute('tabIndex');
      expect(gradeCard).not.toHaveClass('clickable');
    });
  });

  describe('Data Fetching', () => {
    it('should fetch grades on mount', () => {
      render(<GradesList {...defaultProps} />);

      expect(defaultProps.gradeController.fetchGrades).toHaveBeenCalledWith(
        'student1'
      );
    });

    it('should fetch grades when studentId changes', () => {
      const { rerender } = render(<GradesList {...defaultProps} />);

      expect(defaultProps.gradeController.fetchGrades).toHaveBeenCalledWith(
        'student1'
      );

      rerender(<GradesList {...defaultProps} studentId="student2" />);

      expect(defaultProps.gradeController.fetchGrades).toHaveBeenCalledWith(
        'student2'
      );
    });

    it('should not fetch grades when studentId is empty', () => {
      render(<GradesList {...defaultProps} studentId="" />);

      expect(defaultProps.gradeController.fetchGrades).not.toHaveBeenCalled();
    });
  });

  describe('Semester Sorting', () => {
    it('should display semesters in reverse chronological order', () => {
      render(<GradesList {...defaultProps} />);

      const semesterTitles = screen.getAllByRole('heading', { level: 3 });
      const semesterTexts = semesterTitles.map((title) => title.textContent);

      // Fall 2023 should come before Spring 2023 (most recent first)
      expect(semesterTexts).toEqual(['Fall 2023', 'Spring 2023']);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<GradesList {...defaultProps} />);

      // Check main heading
      expect(
        screen.getByRole('heading', { name: 'Academic Grades' })
      ).toBeInTheDocument();

      // Check semester headings
      expect(
        screen.getByRole('heading', { name: 'Fall 2023' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: 'Spring 2023' })
      ).toBeInTheDocument();
    });

    it('should have proper accessibility attributes for clickable grades', () => {
      const onGradeSelect = jest.fn();

      render(<GradesList {...defaultProps} onGradeSelect={onGradeSelect} />);

      const gradeCards = screen.getAllByRole('button');
      expect(gradeCards).toHaveLength(3);

      gradeCards.forEach((card) => {
        expect(card).toHaveAttribute('tabIndex', '0');
      });
    });
  });
});
