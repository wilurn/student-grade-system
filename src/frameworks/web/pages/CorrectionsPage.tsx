import React, { useState } from 'react';
import { useAuth } from '../../../adapters/controllers/useAuth';
import { useGrade } from '../../../adapters/controllers/useGrade';
import { CorrectionsList } from '../components/corrections/CorrectionsList';
import { CorrectionItem } from '../components/corrections/CorrectionItem';
import { GradeCorrection } from '../../../entities/GradeCorrection';
import { CorrectionFilters } from '../../../shared/types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import './pages.css';

export const CorrectionsPage: React.FC = () => {
  const auth = useAuth();
  const gradeController = useGrade();
  const [selectedCorrection, setSelectedCorrection] =
    useState<GradeCorrection | null>(null);
  const [filters, setFilters] = useState<CorrectionFilters>({});

  const handleCorrectionSelect = (correction: GradeCorrection) => {
    setSelectedCorrection(correction);
  };

  const handleCorrectionClose = () => {
    setSelectedCorrection(null);
  };

  const handleFilterChange = (newFilters: CorrectionFilters) => {
    setFilters(newFilters);
  };

  if (auth.state.isLoading) {
    return (
      <div className="corrections-loading">
        <LoadingSpinner size="large" aria-label="Loading corrections..." />
      </div>
    );
  }

  if (!auth.state.user) {
    return (
      <div className="corrections-error">
        <ErrorMessage
          message="Unable to load user information. Please try logging in again."
          type="error"
        />
      </div>
    );
  }

  return (
    <div className="corrections-page">
      <div className="corrections-header">
        <h1>Grade Correction Requests</h1>
        <p>Track the status of your grade correction requests.</p>
      </div>

      <div className="corrections-filters">
        <div className="filter-group">
          <label htmlFor="status-filter">Filter by Status:</label>
          <select
            id="status-filter"
            value={filters.status || ''}
            onChange={(e) =>
              handleFilterChange({
                ...filters,
                status: e.target.value || undefined,
              })
            }
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="corrections-content">
        <CorrectionsList
          studentId={auth.state.user.id}
          gradeController={gradeController}
          filters={filters}
          onCorrectionSelect={handleCorrectionSelect}
        />
      </div>

      {selectedCorrection && (
        <div className="correction-detail-modal">
          <div className="modal-backdrop" onClick={handleCorrectionClose} />
          <div className="modal-content">
            <div className="modal-header">
              <h2>Correction Request Details</h2>
              <button
                className="close-button"
                onClick={handleCorrectionClose}
                aria-label="Close details"
              >
                ×
              </button>
            </div>
            <CorrectionItem correction={selectedCorrection} />
          </div>
        </div>
      )}
    </div>
  );
};
