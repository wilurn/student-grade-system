import React from 'react';
import { useAuth } from '../../../adapters/controllers/useAuth';
import { useGrade } from '../../../adapters/controllers/useGrade';
import { GradesList } from '../components/grades/GradesList';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import './pages.css';

export const DashboardPage: React.FC = () => {
  const auth = useAuth();
  const gradeController = useGrade();

  if (auth.state.isLoading) {
    return (
      <div className="dashboard-loading">
        <LoadingSpinner size="large" aria-label="Loading dashboard..." />
      </div>
    );
  }

  if (!auth.state.user) {
    return (
      <div className="dashboard-error">
        <ErrorMessage
          message="Unable to load user information. Please try logging in again."
          type="error"
        />
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Welcome, {auth.state.user.firstName}!</h1>
        <p>Here's an overview of your academic performance.</p>
      </div>

      <div className="dashboard-content">
        <GradesList
          studentId={auth.state.user.id}
          gradeController={gradeController}
        />
      </div>
    </div>
  );
};
