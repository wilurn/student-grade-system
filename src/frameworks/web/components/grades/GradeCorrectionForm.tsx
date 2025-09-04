import React, { useState, FormEvent } from 'react';
import { Grade, VALID_GRADES } from '../../../../entities/Grade';
import {
  GradeCorrectionRequest,
  GradeCorrectionValidator,
} from '../../../../entities/GradeCorrection';
import { UseGradeReturn } from '../../../../adapters/controllers/useGrade';
import './GradeCorrectionForm.css';

interface GradeCorrectionFormProps {
  grade: Grade;
  gradeController: UseGradeReturn;
  onSuccess?: (correction: any) => void;
  onCancel?: () => void;
}

interface GradeCorrectionFormData {
  requestedGrade: string;
  reason: string;
  supportingDetails: string;
}

interface GradeCorrectionFormErrors {
  requestedGrade?: string;
  reason?: string;
  supportingDetails?: string;
  general?: string;
}

export const GradeCorrectionForm: React.FC<GradeCorrectionFormProps> = ({
  grade,
  gradeController,
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState<GradeCorrectionFormData>({
    requestedGrade: '',
    reason: '',
    supportingDetails: '',
  });

  const [errors, setErrors] = useState<GradeCorrectionFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Filter out grades that are the same as current grade
  const availableGrades = VALID_GRADES.filter((g) => g !== grade.grade);

  const validateForm = (): boolean => {
    const newErrors: GradeCorrectionFormErrors = {};

    // Validate requested grade
    const gradeValidation = GradeCorrectionValidator.validateRequestedGrade(
      formData.requestedGrade,
      grade.grade
    );
    if (!gradeValidation.isValid) {
      newErrors.requestedGrade = gradeValidation.errors[0];
    }

    // Validate reason
    const reasonValidation = GradeCorrectionValidator.validateReason(
      formData.reason
    );
    if (!reasonValidation.isValid) {
      newErrors.reason = reasonValidation.errors[0];
    }

    // Validate supporting details
    const detailsValidation =
      GradeCorrectionValidator.validateSupportingDetails(
        formData.supportingDetails
      );
    if (!detailsValidation.isValid) {
      newErrors.supportingDetails = detailsValidation.errors[0];
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange =
    (field: keyof GradeCorrectionFormData) =>
    (
      event: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      const value = event.target.value;
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Clear field-specific error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }

      // Clear general error when user makes changes
      if (errors.general) {
        setErrors((prev) => ({ ...prev, general: undefined }));
      }

      // Clear success message when user makes changes
      if (showSuccessMessage) {
        setShowSuccessMessage(false);
      }
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const correctionRequest: GradeCorrectionRequest = {
        gradeId: grade.id,
        studentId: grade.studentId,
        requestedGrade: formData.requestedGrade,
        reason: formData.reason.trim(),
        supportingDetails: formData.supportingDetails.trim(),
      };

      const result =
        await gradeController.submitGradeCorrection(correctionRequest);

      // Reset form on success
      setFormData({
        requestedGrade: '',
        reason: '',
        supportingDetails: '',
      });

      setShowSuccessMessage(true);
      onSuccess?.(result);
    } catch (error) {
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : 'Failed to submit correction request. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Reset form
    setFormData({
      requestedGrade: '',
      reason: '',
      supportingDetails: '',
    });
    setErrors({});
    setShowSuccessMessage(false);
    onCancel?.();
  };

  const isFormDisabled = isSubmitting;

  return (
    <div className="grade-correction-form-container">
      <form
        onSubmit={handleSubmit}
        className="grade-correction-form"
        noValidate
      >
        <h3>Request Grade Correction</h3>

        <div className="course-info">
          <p>
            <strong>Course:</strong> {grade.courseCode} - {grade.courseName}
          </p>
          <p>
            <strong>Current Grade:</strong> {grade.grade}
          </p>
          <p>
            <strong>Credit Hours:</strong> {grade.creditHours}
          </p>
          <p>
            <strong>Semester:</strong> {grade.semester}
          </p>
        </div>

        {showSuccessMessage && (
          <div className="success-message" role="alert">
            Your grade correction request has been submitted successfully. You
            will be notified when it is reviewed.
          </div>
        )}

        {errors.general && (
          <div className="error-message general-error" role="alert">
            {errors.general}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="requestedGrade" className="form-label">
            Requested Grade *
          </label>
          <select
            id="requestedGrade"
            value={formData.requestedGrade}
            onChange={handleInputChange('requestedGrade')}
            className={`form-select ${errors.requestedGrade ? 'error' : ''}`}
            disabled={isFormDisabled}
            aria-describedby={
              errors.requestedGrade
                ? 'requestedGrade-error'
                : 'requestedGrade-help'
            }
            aria-invalid={!!errors.requestedGrade}
          >
            <option value="">
              Select the grade you believe you should have received
            </option>
            {availableGrades.map((gradeOption) => (
              <option key={gradeOption} value={gradeOption}>
                {gradeOption}
              </option>
            ))}
          </select>
          {errors.requestedGrade && (
            <div
              id="requestedGrade-error"
              className="error-message field-error"
              role="alert"
            >
              {errors.requestedGrade}
            </div>
          )}
          {!errors.requestedGrade && (
            <div id="requestedGrade-help" className="help-text">
              Select the grade you believe you should have received for this
              course
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="reason" className="form-label">
            Reason for Correction Request *
          </label>
          <textarea
            id="reason"
            value={formData.reason}
            onChange={handleInputChange('reason')}
            className={`form-textarea ${errors.reason ? 'error' : ''}`}
            placeholder="Please explain why you believe your grade should be corrected (minimum 10 characters)"
            disabled={isFormDisabled}
            rows={4}
            aria-describedby={errors.reason ? 'reason-error' : 'reason-help'}
            aria-invalid={!!errors.reason}
          />
          {errors.reason && (
            <div
              id="reason-error"
              className="error-message field-error"
              role="alert"
            >
              {errors.reason}
            </div>
          )}
          {!errors.reason && (
            <div id="reason-help" className="help-text">
              Provide a clear explanation for your correction request (10-500
              characters)
            </div>
          )}
          <div className="character-count">
            {formData.reason.length}/500 characters
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="supportingDetails" className="form-label">
            Supporting Details
          </label>
          <textarea
            id="supportingDetails"
            value={formData.supportingDetails}
            onChange={handleInputChange('supportingDetails')}
            className={`form-textarea ${errors.supportingDetails ? 'error' : ''}`}
            placeholder="Provide any additional details or evidence that supports your request (optional)"
            disabled={isFormDisabled}
            rows={3}
            aria-describedby={
              errors.supportingDetails
                ? 'supportingDetails-error'
                : 'supportingDetails-help'
            }
            aria-invalid={!!errors.supportingDetails}
          />
          {errors.supportingDetails && (
            <div
              id="supportingDetails-error"
              className="error-message field-error"
              role="alert"
            >
              {errors.supportingDetails}
            </div>
          )}
          {!errors.supportingDetails && (
            <div id="supportingDetails-help" className="help-text">
              Optional: Include any additional information that supports your
              request (up to 1000 characters)
            </div>
          )}
          <div className="character-count">
            {formData.supportingDetails.length}/1000 characters
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="cancel-button"
            onClick={handleCancel}
            disabled={isFormDisabled}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="submit-button"
            disabled={isFormDisabled}
            aria-describedby="submit-status"
          >
            {isSubmitting
              ? 'Submitting Request...'
              : 'Submit Correction Request'}
          </button>
        </div>

        {isSubmitting && (
          <div
            id="submit-status"
            className="loading-message"
            aria-live="polite"
          >
            Please wait while we submit your correction request...
          </div>
        )}
      </form>
    </div>
  );
};
