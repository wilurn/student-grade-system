import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import './pages.css';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="not-found-page">
      <div className="not-found-container">
        <div className="not-found-content">
          <h1 className="not-found-title">404</h1>
          <h2 className="not-found-subtitle">Page Not Found</h2>
          <p className="not-found-message">
            The page you're looking for doesn't exist or has been moved.
          </p>

          <div className="not-found-actions">
            <Button
              variant="primary"
              onClick={handleGoHome}
              className="home-button"
            >
              Go to Dashboard
            </Button>
            <Button
              variant="secondary"
              onClick={handleGoBack}
              className="back-button"
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
