export interface Grade {
  id: string;
  courseCode: string;
  courseName: string;
  grade: string;
  creditHours: number;
  semester: string;
  studentId: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Valid grade values
export const VALID_GRADES = [
  'A+',
  'A',
  'A-',
  'B+',
  'B',
  'B-',
  'C+',
  'C',
  'C-',
  'D+',
  'D',
  'F',
  'I',
  'W',
] as const;
export type ValidGrade = (typeof VALID_GRADES)[number];

// Grade point values for GPA calculation
export const GRADE_POINTS: Record<ValidGrade, number> = {
  'A+': 4.0,
  A: 4.0,
  'A-': 3.7,
  'B+': 3.3,
  B: 3.0,
  'B-': 2.7,
  'C+': 2.3,
  C: 2.0,
  'C-': 1.7,
  'D+': 1.3,
  D: 1.0,
  F: 0.0,
  I: 0.0, // Incomplete - doesn't count toward GPA
  W: 0.0, // Withdrawal - doesn't count toward GPA
};

// Domain validation rules for Grade entity
export class GradeValidator {
  static validateCourseCode(courseCode: string): ValidationResult {
    const errors: string[] = [];

    if (!courseCode || courseCode.trim().length === 0) {
      errors.push('Course code is required');
    } else {
      // Course code should be in format like "CS101", "MATH201", etc.
      const courseCodeRegex = /^[A-Z]{2,4}\d{3,4}$/;
      if (!courseCodeRegex.test(courseCode.trim())) {
        errors.push('Course code must be in format like CS101 or MATH201');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validateCourseName(courseName: string): ValidationResult {
    const errors: string[] = [];

    if (!courseName || courseName.trim().length === 0) {
      errors.push('Course name is required');
    } else {
      if (courseName.trim().length < 3) {
        errors.push('Course name must be at least 3 characters long');
      }
      if (courseName.trim().length > 100) {
        errors.push('Course name must be no more than 100 characters long');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validateGrade(grade: string): ValidationResult {
    const errors: string[] = [];

    if (!grade || grade.trim().length === 0) {
      errors.push('Grade is required');
    } else {
      if (!VALID_GRADES.includes(grade as ValidGrade)) {
        errors.push(`Grade must be one of: ${VALID_GRADES.join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validateCreditHours(creditHours: number): ValidationResult {
    const errors: string[] = [];

    if (creditHours === undefined || creditHours === null) {
      errors.push('Credit hours is required');
    } else {
      if (
        !Number.isInteger(creditHours) ||
        creditHours < 1 ||
        creditHours > 6
      ) {
        errors.push('Credit hours must be an integer between 1 and 6');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validateSemester(semester: string): ValidationResult {
    const errors: string[] = [];

    if (!semester || semester.trim().length === 0) {
      errors.push('Semester is required');
    } else {
      // Semester should be in format like "Fall 2023", "Spring 2024", "Summer 2023"
      const semesterRegex = /^(Fall|Spring|Summer)\s\d{4}$/;
      if (!semesterRegex.test(semester.trim())) {
        errors.push(
          'Semester must be in format like "Fall 2023" or "Spring 2024"'
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validateGradeData(gradeData: Omit<Grade, 'id'>): ValidationResult {
    const allErrors: string[] = [];

    const courseCodeValidation = this.validateCourseCode(gradeData.courseCode);
    const courseNameValidation = this.validateCourseName(gradeData.courseName);
    const gradeValidation = this.validateGrade(gradeData.grade);
    const creditHoursValidation = this.validateCreditHours(
      gradeData.creditHours
    );
    const semesterValidation = this.validateSemester(gradeData.semester);

    allErrors.push(...courseCodeValidation.errors);
    allErrors.push(...courseNameValidation.errors);
    allErrors.push(...gradeValidation.errors);
    allErrors.push(...creditHoursValidation.errors);
    allErrors.push(...semesterValidation.errors);

    if (!gradeData.studentId || gradeData.studentId.trim().length === 0) {
      allErrors.push('Student ID is required');
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
    };
  }
}

// Business logic for Grade entity
export class GradeBusinessRules {
  static createGrade(gradeData: Omit<Grade, 'id'>): Grade {
    const validation = GradeValidator.validateGradeData(gradeData);
    if (!validation.isValid) {
      throw new Error(`Invalid grade data: ${validation.errors.join(', ')}`);
    }

    return {
      id: '', // Will be set by the persistence layer
      courseCode: gradeData.courseCode.trim().toUpperCase(),
      courseName: gradeData.courseName.trim(),
      grade: gradeData.grade.trim(),
      creditHours: gradeData.creditHours,
      semester: gradeData.semester.trim(),
      studentId: gradeData.studentId.trim(),
    };
  }

  static getGradePoints(grade: string): number {
    if (VALID_GRADES.includes(grade as ValidGrade)) {
      return GRADE_POINTS[grade as ValidGrade];
    }
    return 0;
  }

  static isPassingGrade(grade: string): boolean {
    const passingGrades: ValidGrade[] = [
      'A+',
      'A',
      'A-',
      'B+',
      'B',
      'B-',
      'C+',
      'C',
      'C-',
      'D+',
      'D',
    ];
    return passingGrades.includes(grade as ValidGrade);
  }

  static isGradeEligibleForCorrection(grade: string): boolean {
    // Students can request corrections for any completed grade (not I or W)
    const nonCorrectable: ValidGrade[] = ['I', 'W'];
    return (
      VALID_GRADES.includes(grade as ValidGrade) &&
      !nonCorrectable.includes(grade as ValidGrade)
    );
  }

  static calculateQualityPoints(grade: Grade): number {
    return this.getGradePoints(grade.grade) * grade.creditHours;
  }

  static formatGradeDisplay(grade: Grade): string {
    return `${grade.courseCode} - ${grade.courseName}: ${grade.grade} (${grade.creditHours} credits)`;
  }
}

// Utility functions for grade calculations
export class GradeCalculations {
  static calculateGPA(grades: Grade[]): number {
    const eligibleGrades = grades.filter(
      (grade) => !['I', 'W'].includes(grade.grade) // Exclude incomplete and withdrawal
    );

    if (eligibleGrades.length === 0) {
      return 0;
    }

    const totalQualityPoints = eligibleGrades.reduce(
      (sum, grade) => sum + GradeBusinessRules.calculateQualityPoints(grade),
      0
    );

    const totalCreditHours = eligibleGrades.reduce(
      (sum, grade) => sum + grade.creditHours,
      0
    );

    return totalCreditHours > 0 ? totalQualityPoints / totalCreditHours : 0;
  }

  static calculateTotalCredits(grades: Grade[]): number {
    return grades.reduce((sum, grade) => sum + grade.creditHours, 0);
  }

  static calculateEarnedCredits(grades: Grade[]): number {
    const passingGrades = grades.filter((grade) =>
      GradeBusinessRules.isPassingGrade(grade.grade)
    );
    return passingGrades.reduce((sum, grade) => sum + grade.creditHours, 0);
  }

  static getGradesBysemester(grades: Grade[]): Record<string, Grade[]> {
    return grades.reduce(
      (acc, grade) => {
        if (!acc[grade.semester]) {
          acc[grade.semester] = [];
        }
        acc[grade.semester].push(grade);
        return acc;
      },
      {} as Record<string, Grade[]>
    );
  }
}
