import {
  StudentValidator,
  StudentBusinessRules,
  RegisterData,
} from '../Student';

describe('StudentValidator', () => {
  describe('validateEmail', () => {
    it('should validate correct email format', () => {
      const result = StudentValidator.validateEmail('test@example.com');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty email', () => {
      const result = StudentValidator.validateEmail('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email is required');
    });

    it('should reject invalid email format', () => {
      const result = StudentValidator.validateEmail('invalid-email');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email format is invalid');
    });
  });

  describe('validateStudentId', () => {
    it('should validate correct student ID', () => {
      const result = StudentValidator.validateStudentId('STU123456');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty student ID', () => {
      const result = StudentValidator.validateStudentId('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Student ID is required');
    });

    it('should reject student ID that is too short', () => {
      const result = StudentValidator.validateStudentId('12345');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Student ID must be 6-20 alphanumeric characters'
      );
    });
  });

  describe('validatePassword', () => {
    it('should validate strong password', () => {
      const result = StudentValidator.validatePassword('Password123');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject weak password', () => {
      const result = StudentValidator.validatePassword('weak');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateRegistrationData', () => {
    const validData: RegisterData = {
      studentId: 'STU123456',
      email: 'test@example.com',
      password: 'Password123',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should validate complete registration data', () => {
      const result = StudentValidator.validateRegistrationData(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject incomplete registration data', () => {
      const invalidData = { ...validData, email: '' };
      const result = StudentValidator.validateRegistrationData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});

describe('StudentBusinessRules', () => {
  describe('createStudent', () => {
    it('should create student with valid data', () => {
      const data: RegisterData = {
        studentId: 'STU123456',
        email: 'Test@Example.com',
        password: 'Password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const student = StudentBusinessRules.createStudent(data);
      expect(student.email).toBe('test@example.com'); // Should be lowercase
      expect(student.firstName).toBe('John');
      expect(student.lastName).toBe('Doe');
    });

    it('should throw error with invalid data', () => {
      const invalidData: RegisterData = {
        studentId: '',
        email: 'invalid-email',
        password: 'weak',
        firstName: '',
        lastName: '',
      };

      expect(() => StudentBusinessRules.createStudent(invalidData)).toThrow();
    });
  });

  describe('getFullName', () => {
    it('should return full name', () => {
      const student = {
        id: '1',
        studentId: 'STU123456',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      const fullName = StudentBusinessRules.getFullName(student);
      expect(fullName).toBe('John Doe');
    });
  });
});
