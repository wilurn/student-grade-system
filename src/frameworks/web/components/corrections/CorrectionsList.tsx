import React, { useEffect } from 'react';
import {
  GradeCorrection,
  GradeCorrectionBusinessRules,
} from '../../../../entities/GradeCorrection';
import { UseGradeReturn } from '../../../../adapters/controllers/useGrade';
import { CorrectionFilters } from '../../../../shared/types';
import { LoadingSpinner } from '../common/LoadingSpinner';
import './CorrectionsList.css';

interface CorrectionsListProps {
  studentId: string;
  gradeController: UseGradeReturn;
  filters?: CorrectionFilters;
  onCorrectionSelect?: (correction: GradeCorrection) => void;
}

export const CorrectionsList: React.FC<CorrectionsListProps> = ({
  studentId,
  gradeController,
  filters,
  onCorrectionSelect,
}) => {
  const { gradeCorrections, fetchGradeCorrections } = gradeController;

  useEffect(() => {
    if (studentId) {
      fetchGradeCorrections(studentId, filters);
    }
  }, [studentId, filters, fetchGradeCorrections]);

  const handleCorrectionClick = (correction: GradeCorrection) => {
    onCorrectionSelect?.(correction);
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'status-badge status-pending';
      case 'approved':
        return 'status-badge status-approved';
      case 'rejected':
        return 'status-badge status-rejected';
      default:
        return 'status-badge status-unknown';
    }
  };

  const getDaysSinceSubmission = (submissionDate: Date): number => {
    return GradeCorrectionBusinessRules.getDaysSinceSubmission({
      submissionDate,
    } as GradeCorrection);
  };

  // Loading state
  if (gradeCorrections.isLoading) {
    return (
      <div className="corrections-list-container">
        <div className="loading-container">
          <LoadingSpinner
            size="large"
            aria-label="Loading correction requests..."
          />
        </div>
      </div>
    );
  }

  // Error state
  if (gradeCorrections.error) {
    return (
      <div className="corrections-list-container">
        <div className="error-message" role="alert">
          <h3>Unable to Load Correction Requests</h3>
          <p>{gradeCorrections.error}</p>
          <button
            onClick={() => fetchGradeCorrections(studentId, filters)}
            className="retry-button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!gradeCorrections.data || gradeCorrections.data.length === 0) {
    return (
      <div className="corrections-list-container">
        <div className="empty-state">
          <h3>No Correction Requests</h3>
          <p>
            You haven't submitted any grade correction requests yet. You can
            request corrections from your grades page.
          </p>
        </div>
      </div>
    );
  }

  // Sort corrections by submission date (most recent first)
  const sortedCorrections = [...gradeCorrections.data].sort(
    (a, b) =>
      new Date(b.submissionDate).getTime() -
      new Date(a.submissionDate).getTime()
  );

  // Group corrections by status for better organization
  const correctionsByStatus = sortedCorrections.reduce(
    (acc, correction) => {
      if (!acc[correction.status]) {
        acc[correction.status] = [];
      }
      acc[correction.status].push(correction);
      return acc;
    },
    {} as Record<string, GradeCorrection[]>
  );

  const statusOrder = ['pending', 'approved', 'rejected'];
  const statusLabels = {
    pending: 'Pending Review',
    approved: 'Approved',
    rejected: 'Rejected',
  };

  return (
    <div className="corrections-list-container">
      <div className="corrections-header">
        <h2>Grade Correction Requests</h2>
        <div className="corrections-summary">
          <span className="total-requests">
            Total Requests: {gradeCorrections.data.length}
          </span>
          <span className="pending-requests">
            Pending: {correctionsByStatus.pending?.length || 0}
          </span>
        </div>
      </div>

      <div className="corrections-content">
        {statusOrder.map((status) => {
          const corrections = correctionsByStatus[status];
          if (!corrections || corrections.length === 0) return null;

          return (
            <div key={status} className="status-section">
              <h3 className="status-title">
                {statusLabels[status as keyof typeof statusLabels]} (
                {corrections.length})
              </h3>
              <div className="corrections-grid">
                {corrections.map((correction) => (
                  <div
                    key={correction.id}
                    className={`correction-card ${onCorrectionSelect ? 'clickable' : ''}`}
                    onClick={() => handleCorrectionClick(correction)}
                    role={onCorrectionSelect ? 'button' : undefined}
                    tabIndex={onCorrectionSelect ? 0 : undefined}
                    onKeyDown={(e) => {
                      if (
                        onCorrectionSelect &&
                        (e.key === 'Enter' || e.key === ' ')
                      ) {
                        e.preventDefault();
                        handleCorrectionClick(correction);
                      }
                    }}
                  >
                    <div className="correction-header">
                      <div className="correction-info">
                        <h4 className="correction-title">
                          Grade Correction Request
                        </h4>
                        <span
                          className={getStatusBadgeClass(correction.status)}
                        >
                          {correction.status.charAt(0).toUpperCase() +
                            correction.status.slice(1)}
                        </span>
                      </div>
                      <div className="correction-grade">
                        <span className="requested-grade">
                          → {correction.requestedGrade}
                        </span>
                      </div>
                    </div>

                    <div className="correction-details">
                      <div className="detail-item">
                        <span className="detail-label">Reason:</span>
                        <p className="detail-value reason-text">
                          {correction.reason.length > 100
                            ? `${correction.reason.substring(0, 100)}...`
                            : correction.reason}
                        </p>
                      </div>

                      {correction.supportingDetails && (
                        <div className="detail-item">
                          <span className="detail-label">
                            Supporting Details:
                          </span>
                          <p className="detail-value supporting-text">
                            {correction.supportingDetails.length > 80
                              ? `${correction.supportingDetails.substring(0, 80)}...`
                              : correction.supportingDetails}
                          </p>
                        </div>
                      )}

                      <div className="correction-dates">
                        <div className="date-item">
                          <span className="date-label">Submitted:</span>
                          <span className="date-value">
                            {formatDate(correction.submissionDate)}
                          </span>
                          <span className="days-ago">
                            ({getDaysSinceSubmission(correction.submissionDate)}{' '}
                            days ago)
                          </span>
                        </div>

                        {correction.reviewDate && (
                          <div className="date-item">
                            <span className="date-label">Reviewed:</span>
                            <span className="date-value">
                              {formatDate(correction.reviewDate)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
