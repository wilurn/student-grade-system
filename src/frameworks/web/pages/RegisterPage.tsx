import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RegisterForm } from '../components/auth/RegisterForm';
import { useAuth } from '../../../adapters/controllers/useAuth';
import './pages.css';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const auth = useAuth();

  const handleRegisterSuccess = () => {
    navigate('/login');
  };

  return (
    <div className="register-page">
      <div className="auth-container">
        <RegisterForm auth={auth} onSuccess={handleRegisterSuccess} />
        <div className="auth-links">
          <p>
            Already have an account?{' '}
            <button
              type="button"
              className="link-button"
              onClick={() => navigate('/login')}
            >
              Login here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
