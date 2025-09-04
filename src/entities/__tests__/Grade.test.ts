import {
  GradeValidator,
  GradeBusinessRules,
  GradeCalculations,
  VALID_GRADES,
  GRADE_POINTS,
  Grade,
} from '../Grade';

describe('GradeValidator', () => {
  describe('validateCourseCode', () => {
    it('should validate correct course code', () => {
      const result = GradeValidator.validateCourseCode('CS101');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid course code format', () => {
      const result = GradeValidator.validateCourseCode('invalid');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Course code must be in format like CS101 or MATH201'
      );
    });
  });

  describe('validateGrade', () => {
    it('should validate valid grade', () => {
      const result = GradeValidator.validateGrade('A');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid grade', () => {
      const result = GradeValidator.validateGrade('Z');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        `Grade must be one of: ${VALID_GRADES.join(', ')}`
      );
    });
  });

  describe('validateCreditHours', () => {
    it('should validate valid credit hours', () => {
      const result = GradeValidator.validateCreditHours(3);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid credit hours', () => {
      const result = GradeValidator.validateCreditHours(0);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Credit hours must be an integer between 1 and 6'
      );
    });
  });
});

describe('GradeBusinessRules', () => {
  describe('getGradePoints', () => {
    it('should return correct grade points for A', () => {
      const points = GradeBusinessRules.getGradePoints('A');
      expect(points).toBe(4.0);
    });

    it('should return 0 for invalid grade', () => {
      const points = GradeBusinessRules.getGradePoints('Z');
      expect(points).toBe(0);
    });
  });

  describe('isPassingGrade', () => {
    it('should return true for passing grades', () => {
      expect(GradeBusinessRules.isPassingGrade('A')).toBe(true);
      expect(GradeBusinessRules.isPassingGrade('D')).toBe(true);
    });

    it('should return false for failing grades', () => {
      expect(GradeBusinessRules.isPassingGrade('F')).toBe(false);
      expect(GradeBusinessRules.isPassingGrade('I')).toBe(false);
    });
  });

  describe('calculateQualityPoints', () => {
    it('should calculate quality points correctly', () => {
      const grade: Grade = {
        id: '1',
        courseCode: 'CS101',
        courseName: 'Intro to CS',
        grade: 'A',
        creditHours: 3,
        semester: 'Fall 2023',
        studentId: 'STU123456',
      };

      const qualityPoints = GradeBusinessRules.calculateQualityPoints(grade);
      expect(qualityPoints).toBe(12.0); // 4.0 * 3 credits
    });
  });
});

describe('GradeCalculations', () => {
  const sampleGrades: Grade[] = [
    {
      id: '1',
      courseCode: 'CS101',
      courseName: 'Intro to CS',
      grade: 'A',
      creditHours: 3,
      semester: 'Fall 2023',
      studentId: 'STU123456',
    },
    {
      id: '2',
      courseCode: 'MATH201',
      courseName: 'Calculus I',
      grade: 'B',
      creditHours: 4,
      semester: 'Fall 2023',
      studentId: 'STU123456',
    },
  ];

  describe('calculateGPA', () => {
    it('should calculate GPA correctly', () => {
      const gpa = GradeCalculations.calculateGPA(sampleGrades);
      // (4.0*3 + 3.0*4) / (3+4) = 24/7 ≈ 3.43
      expect(gpa).toBeCloseTo(3.43, 2);
    });

    it('should return 0 for empty grades', () => {
      const gpa = GradeCalculations.calculateGPA([]);
      expect(gpa).toBe(0);
    });
  });

  describe('calculateTotalCredits', () => {
    it('should calculate total credits correctly', () => {
      const totalCredits =
        GradeCalculations.calculateTotalCredits(sampleGrades);
      expect(totalCredits).toBe(7);
    });
  });

  describe('calculateEarnedCredits', () => {
    it('should calculate earned credits correctly', () => {
      const earnedCredits =
        GradeCalculations.calculateEarnedCredits(sampleGrades);
      expect(earnedCredits).toBe(7); // Both A and B are passing
    });
  });
});
