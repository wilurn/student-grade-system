import React, { useState } from 'react';
import { useAuth } from '../../../adapters/controllers/useAuth';
import { useGrade } from '../../../adapters/controllers/useGrade';
import { GradesList } from '../components/grades/GradesList';
import { GradeCorrectionForm } from '../components/grades/GradeCorrectionForm';
import { Grade } from '../../../entities/Grade';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import './pages.css';

export const GradesPage: React.FC = () => {
  const auth = useAuth();
  const gradeController = useGrade();
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);

  const handleGradeSelect = (grade: Grade) => {
    setSelectedGrade(grade);
    setShowCorrectionForm(true);
  };

  const handleCorrectionFormClose = () => {
    setShowCorrectionForm(false);
    setSelectedGrade(null);
  };

  const handleCorrectionSubmitSuccess = () => {
    setShowCorrectionForm(false);
    setSelectedGrade(null);
    // Optionally refresh grades list
    if (auth.state.user) {
      gradeController.fetchGrades(auth.state.user.id);
    }
  };

  if (auth.state.isLoading) {
    return (
      <div className="grades-loading">
        <LoadingSpinner size="large" aria-label="Loading grades..." />
      </div>
    );
  }

  if (!auth.state.user) {
    return (
      <div className="grades-error">
        <ErrorMessage
          message="Unable to load user information. Please try logging in again."
          type="error"
        />
      </div>
    );
  }

  return (
    <div className="grades-page">
      <div className="grades-header">
        <h1>My Grades</h1>
        <p>View your academic grades and request corrections if needed.</p>
      </div>

      <div className="grades-content">
        <GradesList
          studentId={auth.state.user.id}
          gradeController={gradeController}
          onGradeSelect={handleGradeSelect}
        />
      </div>

      {showCorrectionForm && selectedGrade && (
        <div className="correction-form-modal">
          <div className="modal-backdrop" onClick={handleCorrectionFormClose} />
          <div className="modal-content">
            <GradeCorrectionForm
              grade={selectedGrade}
              gradeController={gradeController}
              onSuccess={handleCorrectionSubmitSuccess}
              onCancel={handleCorrectionFormClose}
            />
          </div>
        </div>
      )}
    </div>
  );
};
