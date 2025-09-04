export interface GradeCorrection {
  id: string;
  gradeId: string;
  studentId: string;
  requestedGrade: string;
  reason: string;
  supportingDetails: string;
  status: 'pending' | 'approved' | 'rejected';
  submissionDate: Date;
  reviewDate?: Date;
}

export interface GradeCorrectionRequest {
  gradeId: string;
  studentId: string;
  requestedGrade: string;
  reason: string;
  supportingDetails: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export type CorrectionStatus = 'pending' | 'approved' | 'rejected';

// Domain validation rules for GradeCorrection entity
export class GradeCorrectionValidator {
  static validateReason(reason: string): ValidationResult {
    const errors: string[] = [];

    if (!reason || reason.trim().length === 0) {
      errors.push('Reason is required');
    } else {
      if (reason.trim().length < 10) {
        errors.push('Reason must be at least 10 characters long');
      }
      if (reason.trim().length > 500) {
        errors.push('Reason must be no more than 500 characters long');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validateSupportingDetails(
    supportingDetails: string
  ): ValidationResult {
    const errors: string[] = [];

    // Supporting details are optional, but if provided, should meet certain criteria
    if (supportingDetails && supportingDetails.trim().length > 0) {
      if (supportingDetails.trim().length < 5) {
        errors.push(
          'Supporting details must be at least 5 characters long if provided'
        );
      }
      if (supportingDetails.trim().length > 1000) {
        errors.push(
          'Supporting details must be no more than 1000 characters long'
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validateRequestedGrade(
    requestedGrade: string,
    currentGrade: string
  ): ValidationResult {
    const errors: string[] = [];

    if (!requestedGrade || requestedGrade.trim().length === 0) {
      errors.push('Requested grade is required');
    } else {
      // Import VALID_GRADES from Grade entity
      const validGrades = [
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
      ];

      if (!validGrades.includes(requestedGrade)) {
        errors.push(
          `Requested grade must be one of: ${validGrades.join(', ')}`
        );
      }

      if (requestedGrade === currentGrade) {
        errors.push('Requested grade cannot be the same as current grade');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validateCorrectionRequest(
    request: GradeCorrectionRequest,
    currentGrade?: string
  ): ValidationResult {
    const allErrors: string[] = [];

    if (!request.gradeId || request.gradeId.trim().length === 0) {
      allErrors.push('Grade ID is required');
    }

    if (!request.studentId || request.studentId.trim().length === 0) {
      allErrors.push('Student ID is required');
    }

    const reasonValidation = this.validateReason(request.reason);
    const detailsValidation = this.validateSupportingDetails(
      request.supportingDetails
    );
    const gradeValidation = this.validateRequestedGrade(
      request.requestedGrade,
      currentGrade || ''
    );

    allErrors.push(...reasonValidation.errors);
    allErrors.push(...detailsValidation.errors);
    allErrors.push(...gradeValidation.errors);

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
    };
  }

  static validateStatus(status: string): ValidationResult {
    const errors: string[] = [];
    const validStatuses: CorrectionStatus[] = [
      'pending',
      'approved',
      'rejected',
    ];

    if (!validStatuses.includes(status as CorrectionStatus)) {
      errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Business logic for GradeCorrection entity
export class GradeCorrectionBusinessRules {
  static createCorrectionRequest(
    request: GradeCorrectionRequest,
    currentGrade?: string
  ): GradeCorrection {
    const validation = GradeCorrectionValidator.validateCorrectionRequest(
      request,
      currentGrade
    );
    if (!validation.isValid) {
      throw new Error(
        `Invalid correction request: ${validation.errors.join(', ')}`
      );
    }

    return {
      id: '', // Will be set by the persistence layer
      gradeId: request.gradeId.trim(),
      studentId: request.studentId.trim(),
      requestedGrade: request.requestedGrade.trim(),
      reason: request.reason.trim(),
      supportingDetails: request.supportingDetails.trim(),
      status: 'pending',
      submissionDate: new Date(),
      reviewDate: undefined,
    };
  }

  static canSubmitCorrection(
    existingCorrections: GradeCorrection[],
    gradeId: string
  ): boolean {
    // Check if there's already a pending correction for this grade
    const pendingCorrection = existingCorrections.find(
      (correction) =>
        correction.gradeId === gradeId && correction.status === 'pending'
    );
    return !pendingCorrection;
  }

  static canResubmitCorrection(
    existingCorrections: GradeCorrection[],
    gradeId: string
  ): boolean {
    // Students can resubmit if their previous request was rejected
    const lastCorrection = existingCorrections
      .filter((correction) => correction.gradeId === gradeId)
      .sort(
        (a, b) => b.submissionDate.getTime() - a.submissionDate.getTime()
      )[0];

    return !lastCorrection || lastCorrection.status === 'rejected';
  }

  static getMaxCorrectionsPerGrade(): number {
    return 3; // Business rule: maximum 3 correction attempts per grade
  }

  static getCorrectionAttempts(
    corrections: GradeCorrection[],
    gradeId: string
  ): number {
    return corrections.filter((correction) => correction.gradeId === gradeId)
      .length;
  }

  static canSubmitNewCorrection(
    corrections: GradeCorrection[],
    gradeId: string
  ): boolean {
    const attempts = this.getCorrectionAttempts(corrections, gradeId);
    const maxAttempts = this.getMaxCorrectionsPerGrade();

    return (
      attempts < maxAttempts && this.canSubmitCorrection(corrections, gradeId)
    );
  }

  static updateCorrectionStatus(
    correction: GradeCorrection,
    newStatus: CorrectionStatus
  ): GradeCorrection {
    const validation = GradeCorrectionValidator.validateStatus(newStatus);
    if (!validation.isValid) {
      throw new Error(`Invalid status: ${validation.errors.join(', ')}`);
    }

    return {
      ...correction,
      status: newStatus,
      reviewDate: newStatus !== 'pending' ? new Date() : correction.reviewDate,
    };
  }

  static isPending(correction: GradeCorrection): boolean {
    return correction.status === 'pending';
  }

  static isApproved(correction: GradeCorrection): boolean {
    return correction.status === 'approved';
  }

  static isRejected(correction: GradeCorrection): boolean {
    return correction.status === 'rejected';
  }

  static getDaysSinceSubmission(correction: GradeCorrection): number {
    const now = new Date();
    const diffTime = Math.abs(
      now.getTime() - correction.submissionDate.getTime()
    );
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  static formatCorrectionSummary(correction: GradeCorrection): string {
    const statusText =
      correction.status.charAt(0).toUpperCase() + correction.status.slice(1);
    return `Correction Request: ${correction.requestedGrade} - ${statusText}`;
  }

  static getStatusDisplayColor(status: CorrectionStatus): string {
    switch (status) {
      case 'pending':
        return 'orange';
      case 'approved':
        return 'green';
      case 'rejected':
        return 'red';
      default:
        return 'gray';
    }
  }
}
