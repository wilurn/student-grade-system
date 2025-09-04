import React, { useState, FormEvent } from 'react';
import { RegisterData, StudentValidator } from '../../../../entities/Student';
import { UseAuthReturn } from '../../../../adapters/controllers/useAuth';

interface RegisterFormProps {
  auth: UseAuthReturn;
  onSuccess?: () => void;
}

interface RegisterFormErrors {
  studentId?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  firstName?: string;
  lastName?: string;
  general?: string;
}

interface RegisterFormData extends RegisterData {
  confirmPassword: string;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  auth,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<RegisterFormData>({
    studentId: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });

  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: RegisterFormErrors = {};

    // Validate student ID
    const studentIdValidation = StudentValidator.validateStudentId(
      formData.studentId
    );
    if (!studentIdValidation.isValid) {
      newErrors.studentId = studentIdValidation.errors[0];
    }

    // Validate email
    const emailValidation = StudentValidator.validateEmail(formData.email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.errors[0];
    }

    // Validate password
    const passwordValidation = StudentValidator.validatePassword(
      formData.password
    );
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.errors[0];
    }

    // Validate confirm password
    if (
      !formData.confirmPassword ||
      formData.confirmPassword.trim().length === 0
    ) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Validate first name
    const firstNameValidation = StudentValidator.validateName(
      formData.firstName,
      'First name'
    );
    if (!firstNameValidation.isValid) {
      newErrors.firstName = firstNameValidation.errors[0];
    }

    // Validate last name
    const lastNameValidation = StudentValidator.validateName(
      formData.lastName,
      'Last name'
    );
    if (!lastNameValidation.isValid) {
      newErrors.lastName = lastNameValidation.errors[0];
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange =
    (field: keyof RegisterFormData) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
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

      // Special handling for confirm password - clear error if passwords now match
      if (
        field === 'password' &&
        formData.confirmPassword &&
        errors.confirmPassword
      ) {
        if (value === formData.confirmPassword) {
          setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
        }
      }

      if (
        field === 'confirmPassword' &&
        formData.password &&
        errors.confirmPassword
      ) {
        if (value === formData.password) {
          setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
        }
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
      const registerData: RegisterData = {
        studentId: formData.studentId,
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
      };

      const result = await auth.actions.register(registerData);

      if (result.success) {
        // Reset form on success
        setFormData({
          studentId: '',
          email: '',
          password: '',
          confirmPassword: '',
          firstName: '',
          lastName: '',
        });
        onSuccess?.();
      } else {
        setErrors({
          general: result.error || 'Registration failed. Please try again.',
        });
      }
    } catch (error) {
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormDisabled = isSubmitting || auth.state.isLoading;

  return (
    <div className="register-form-container">
      <form onSubmit={handleSubmit} className="register-form" noValidate>
        <h2>Create Your Account</h2>

        {errors.general && (
          <div className="error-message general-error" role="alert">
            {errors.general}
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="firstName" className="form-label">
              First Name *
            </label>
            <input
              id="firstName"
              type="text"
              value={formData.firstName}
              onChange={handleInputChange('firstName')}
              className={`form-input ${errors.firstName ? 'error' : ''}`}
              placeholder="Enter your first name"
              disabled={isFormDisabled}
              autoComplete="given-name"
              aria-describedby={
                errors.firstName ? 'firstName-error' : undefined
              }
              aria-invalid={!!errors.firstName}
            />
            {errors.firstName && (
              <div
                id="firstName-error"
                className="error-message field-error"
                role="alert"
              >
                {errors.firstName}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="lastName" className="form-label">
              Last Name *
            </label>
            <input
              id="lastName"
              type="text"
              value={formData.lastName}
              onChange={handleInputChange('lastName')}
              className={`form-input ${errors.lastName ? 'error' : ''}`}
              placeholder="Enter your last name"
              disabled={isFormDisabled}
              autoComplete="family-name"
              aria-describedby={errors.lastName ? 'lastName-error' : undefined}
              aria-invalid={!!errors.lastName}
            />
            {errors.lastName && (
              <div
                id="lastName-error"
                className="error-message field-error"
                role="alert"
              >
                {errors.lastName}
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="studentId" className="form-label">
            Student ID *
          </label>
          <input
            id="studentId"
            type="text"
            value={formData.studentId}
            onChange={handleInputChange('studentId')}
            className={`form-input ${errors.studentId ? 'error' : ''}`}
            placeholder="Enter your student ID"
            disabled={isFormDisabled}
            autoComplete="username"
            aria-describedby={errors.studentId ? 'studentId-error' : undefined}
            aria-invalid={!!errors.studentId}
          />
          {errors.studentId && (
            <div
              id="studentId-error"
              className="error-message field-error"
              role="alert"
            >
              {errors.studentId}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="email" className="form-label">
            Email Address *
          </label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange('email')}
            className={`form-input ${errors.email ? 'error' : ''}`}
            placeholder="Enter your email address"
            disabled={isFormDisabled}
            autoComplete="email"
            aria-describedby={errors.email ? 'email-error' : undefined}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <div
              id="email-error"
              className="error-message field-error"
              role="alert"
            >
              {errors.email}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="password" className="form-label">
            Password *
          </label>
          <input
            id="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange('password')}
            className={`form-input ${errors.password ? 'error' : ''}`}
            placeholder="Create a strong password"
            disabled={isFormDisabled}
            autoComplete="new-password"
            aria-describedby={
              errors.password ? 'password-error' : 'password-help'
            }
            aria-invalid={!!errors.password}
          />
          {errors.password && (
            <div
              id="password-error"
              className="error-message field-error"
              role="alert"
            >
              {errors.password}
            </div>
          )}
          {!errors.password && (
            <div id="password-help" className="help-text">
              Password must be at least 8 characters with uppercase, lowercase,
              and number
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword" className="form-label">
            Confirm Password *
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleInputChange('confirmPassword')}
            className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
            placeholder="Confirm your password"
            disabled={isFormDisabled}
            autoComplete="new-password"
            aria-describedby={
              errors.confirmPassword ? 'confirmPassword-error' : undefined
            }
            aria-invalid={!!errors.confirmPassword}
          />
          {errors.confirmPassword && (
            <div
              id="confirmPassword-error"
              className="error-message field-error"
              role="alert"
            >
              {errors.confirmPassword}
            </div>
          )}
        </div>

        <button
          type="submit"
          className="submit-button"
          disabled={isFormDisabled}
          aria-describedby="submit-status"
        >
          {isSubmitting ? 'Creating Account...' : 'Create Account'}
        </button>

        {isSubmitting && (
          <div
            id="submit-status"
            className="loading-message"
            aria-live="polite"
          >
            Please wait while we create your account...
          </div>
        )}
      </form>
    </div>
  );
};
