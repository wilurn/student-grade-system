import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { useAuth } from '../../../adapters/controllers/useAuth';
import './pages.css';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const auth = useAuth();

  const handleLoginSuccess = () => {
    navigate('/dashboard');
  };

  return (
    <div className="login-page">
      <div className="auth-container">
        <LoginForm auth={auth} onSuccess={handleLoginSuccess} />
        <div className="auth-links">
          <p>
            Don't have an account?{' '}
            <button
              type="button"
              className="link-button"
              onClick={() => navigate('/register')}
            >
              Register here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
