import {
  GradeCorrectionValidator,
  GradeCorrectionBusinessRules,
  GradeCorrectionRequest,
  GradeCorrection,
} from '../GradeCorrection';

describe('GradeCorrectionValidator', () => {
  describe('validateReason', () => {
    it('should validate valid reason', () => {
      const result = GradeCorrectionValidator.validateReason(
        'I believe there was an error in grading my exam'
      );
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty reason', () => {
      const result = GradeCorrectionValidator.validateReason('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Reason is required');
    });

    it('should reject reason that is too short', () => {
      const result = GradeCorrectionValidator.validateReason('Too short');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Reason must be at least 10 characters long'
      );
    });
  });

  describe('validateRequestedGrade', () => {
    it('should validate valid requested grade', () => {
      const result = GradeCorrectionValidator.validateRequestedGrade('A', 'B');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject same grade as current', () => {
      const result = GradeCorrectionValidator.validateRequestedGrade('A', 'A');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Requested grade cannot be the same as current grade'
      );
    });

    it('should reject invalid grade', () => {
      const result = GradeCorrectionValidator.validateRequestedGrade('Z', 'A');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateCorrectionRequest', () => {
    const validRequest: GradeCorrectionRequest = {
      gradeId: 'grade123',
      studentId: 'student123',
      requestedGrade: 'A',
      reason: 'I believe there was an error in grading my exam',
      supportingDetails: 'Additional details about the error',
    };

    it('should validate complete correction request', () => {
      const result = GradeCorrectionValidator.validateCorrectionRequest(
        validRequest,
        'B'
      );
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject incomplete correction request', () => {
      const invalidRequest = { ...validRequest, reason: '' };
      const result = GradeCorrectionValidator.validateCorrectionRequest(
        invalidRequest,
        'B'
      );
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});

describe('GradeCorrectionBusinessRules', () => {
  describe('createCorrectionRequest', () => {
    it('should create correction request with valid data', () => {
      const request: GradeCorrectionRequest = {
        gradeId: 'grade123',
        studentId: 'student123',
        requestedGrade: 'A',
        reason: 'I believe there was an error in grading my exam',
        supportingDetails: 'Additional details',
      };

      const correction = GradeCorrectionBusinessRules.createCorrectionRequest(
        request,
        'B'
      );
      expect(correction.status).toBe('pending');
      expect(correction.requestedGrade).toBe('A');
      expect(correction.submissionDate).toBeInstanceOf(Date);
    });

    it('should throw error with invalid data', () => {
      const invalidRequest: GradeCorrectionRequest = {
        gradeId: '',
        studentId: '',
        requestedGrade: 'Z',
        reason: 'Short',
        supportingDetails: '',
      };

      expect(() =>
        GradeCorrectionBusinessRules.createCorrectionRequest(
          invalidRequest,
          'B'
        )
      ).toThrow();
    });
  });

  describe('canSubmitCorrection', () => {
    it('should allow submission when no pending corrections exist', () => {
      const existingCorrections: GradeCorrection[] = [];
      const canSubmit = GradeCorrectionBusinessRules.canSubmitCorrection(
        existingCorrections,
        'grade123'
      );
      expect(canSubmit).toBe(true);
    });

    it('should not allow submission when pending correction exists', () => {
      const existingCorrections: GradeCorrection[] = [
        {
          id: '1',
          gradeId: 'grade123',
          studentId: 'student123',
          requestedGrade: 'A',
          reason: 'Test reason',
          supportingDetails: '',
          status: 'pending',
          submissionDate: new Date(),
          reviewDate: undefined,
        },
      ];

      const canSubmit = GradeCorrectionBusinessRules.canSubmitCorrection(
        existingCorrections,
        'grade123'
      );
      expect(canSubmit).toBe(false);
    });
  });

  describe('getCorrectionAttempts', () => {
    it('should count correction attempts correctly', () => {
      const corrections: GradeCorrection[] = [
        {
          id: '1',
          gradeId: 'grade123',
          studentId: 'student123',
          requestedGrade: 'A',
          reason: 'Test reason',
          supportingDetails: '',
          status: 'rejected',
          submissionDate: new Date(),
          reviewDate: new Date(),
        },
        {
          id: '2',
          gradeId: 'grade123',
          studentId: 'student123',
          requestedGrade: 'A+',
          reason: 'Another reason',
          supportingDetails: '',
          status: 'pending',
          submissionDate: new Date(),
          reviewDate: undefined,
        },
      ];

      const attempts = GradeCorrectionBusinessRules.getCorrectionAttempts(
        corrections,
        'grade123'
      );
      expect(attempts).toBe(2);
    });
  });

  describe('updateCorrectionStatus', () => {
    it('should update status correctly', () => {
      const correction: GradeCorrection = {
        id: '1',
        gradeId: 'grade123',
        studentId: 'student123',
        requestedGrade: 'A',
        reason: 'Test reason',
        supportingDetails: '',
        status: 'pending',
        submissionDate: new Date(),
        reviewDate: undefined,
      };

      const updated = GradeCorrectionBusinessRules.updateCorrectionStatus(
        correction,
        'approved'
      );
      expect(updated.status).toBe('approved');
      expect(updated.reviewDate).toBeInstanceOf(Date);
    });
  });
});
