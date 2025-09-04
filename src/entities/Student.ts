export interface Student {
  id: string;
  studentId: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface RegisterData {
  studentId: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResult {
  success: boolean;
  student?: Student;
  token?: string;
  error?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Domain validation rules for Student entity
export class StudentValidator {
  static validateEmail(email: string): ValidationResult {
    const errors: string[] = [];

    if (!email || email.trim().length === 0) {
      errors.push('Email is required');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push('Email format is invalid');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validateStudentId(studentId: string): ValidationResult {
    const errors: string[] = [];

    if (!studentId || studentId.trim().length === 0) {
      errors.push('Student ID is required');
    } else {
      // Student ID should be alphanumeric and between 6-20 characters
      const studentIdRegex = /^[A-Za-z0-9]{6,20}$/;
      if (!studentIdRegex.test(studentId)) {
        errors.push('Student ID must be 6-20 alphanumeric characters');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validatePassword(password: string): ValidationResult {
    const errors: string[] = [];

    if (!password || password.length === 0) {
      errors.push('Password is required');
    } else {
      if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
      }
      if (!/(?=.*[a-z])/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
      }
      if (!/(?=.*[A-Z])/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
      }
      if (!/(?=.*\d)/.test(password)) {
        errors.push('Password must contain at least one number');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validateName(name: string, fieldName: string): ValidationResult {
    const errors: string[] = [];

    if (!name || name.trim().length === 0) {
      errors.push(`${fieldName} is required`);
    } else {
      if (name.trim().length < 2) {
        errors.push(`${fieldName} must be at least 2 characters long`);
      }
      if (name.trim().length > 50) {
        errors.push(`${fieldName} must be no more than 50 characters long`);
      }
      // Only allow letters, spaces, hyphens, and apostrophes
      const nameRegex = /^[A-Za-z\s\-']+$/;
      if (!nameRegex.test(name.trim())) {
        errors.push(
          `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validateRegistrationData(data: RegisterData): ValidationResult {
    const allErrors: string[] = [];

    const emailValidation = this.validateEmail(data.email);
    const studentIdValidation = this.validateStudentId(data.studentId);
    const passwordValidation = this.validatePassword(data.password);
    const firstNameValidation = this.validateName(data.firstName, 'First name');
    const lastNameValidation = this.validateName(data.lastName, 'Last name');

    allErrors.push(...emailValidation.errors);
    allErrors.push(...studentIdValidation.errors);
    allErrors.push(...passwordValidation.errors);
    allErrors.push(...firstNameValidation.errors);
    allErrors.push(...lastNameValidation.errors);

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
    };
  }

  static validateLoginData(email: string, password: string): ValidationResult {
    const allErrors: string[] = [];

    if (!email || email.trim().length === 0) {
      allErrors.push('Email is required');
    }

    if (!password || password.length === 0) {
      allErrors.push('Password is required');
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
    };
  }
}

// Business logic for Student entity
export class StudentBusinessRules {
  static createStudent(data: RegisterData): Student {
    const validation = StudentValidator.validateRegistrationData(data);
    if (!validation.isValid) {
      throw new Error(`Invalid student data: ${validation.errors.join(', ')}`);
    }

    return {
      id: '', // Will be set by the persistence layer
      studentId: data.studentId.trim(),
      email: data.email.trim().toLowerCase(),
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
    };
  }

  static getFullName(student: Student): string {
    return `${student.firstName} ${student.lastName}`;
  }

  static getDisplayName(student: Student): string {
    return `${student.firstName} ${student.lastName} (${student.studentId})`;
  }
}
