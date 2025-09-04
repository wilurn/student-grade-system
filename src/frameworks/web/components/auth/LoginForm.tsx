import React, { useState, FormEvent } from 'react';
import { StudentValidator } from '../../../../entities/Student';
import { UseAuthReturn } from '../../../../adapters/controllers/useAuth';

interface LoginFormProps {
  auth: UseAuthReturn;
  onSuccess?: () => void;
}

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginFormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({ auth, onSuccess }) => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: LoginFormErrors = {};

    // Validate email
    const emailValidation = StudentValidator.validateEmail(formData.email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.errors[0];
    }

    // Validate password
    if (!formData.password || formData.password.trim().length === 0) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange =
    (field: keyof LoginFormData) =>
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
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const result = await auth.actions.login(
        formData.email,
        formData.password
      );

      if (result.success) {
        // Reset form on success
        setFormData({ email: '', password: '' });
        onSuccess?.();
      } else {
        setErrors({
          general: result.error || 'Login failed. Please try again.',
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
    <div className="login-form-container">
      <form onSubmit={handleSubmit} className="login-form" noValidate>
        <h2>Login to Your Account</h2>

        {errors.general && (
          <div className="error-message general-error" role="alert">
            {errors.general}
          </div>
        )}

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
            placeholder="Enter your password"
            disabled={isFormDisabled}
            autoComplete="current-password"
            aria-describedby={errors.password ? 'password-error' : undefined}
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
        </div>

        <button
          type="submit"
          className="submit-button"
          disabled={isFormDisabled}
          aria-describedby="submit-status"
        >
          {isSubmitting ? 'Signing In...' : 'Sign In'}
        </button>

        {isSubmitting && (
          <div
            id="submit-status"
            className="loading-message"
            aria-live="polite"
          >
            Please wait while we sign you in...
          </div>
        )}
      </form>
    </div>
  );
};
