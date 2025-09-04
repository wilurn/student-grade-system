import React from 'react';
import {
  GradeCorrection,
  GradeCorrectionBusinessRules,
} from '../../../../entities/GradeCorrection';
import { Grade } from '../../../../entities/Grade';
import './CorrectionItem.css';

interface CorrectionItemProps {
  correction: GradeCorrection;
  grade?: Grade;
  onCorrectionClick?: (correction: GradeCorrection) => void;
  showFullDetails?: boolean;
}

export const CorrectionItem: React.FC<CorrectionItemProps> = ({
  correction,
  grade,
  onCorrectionClick,
  showFullDetails = false,
}) => {
  const handleClick = () => {
    if (onCorrectionClick) {
      onCorrectionClick(correction);
    }
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

  const getDaysSinceSubmission = (): number => {
    return GradeCorrectionBusinessRules.getDaysSinceSubmission(correction);
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'approved':
        return '✅';
      case 'rejected':
        return '❌';
      default:
        return '❓';
    }
  };

  const isClickable = !!onCorrectionClick;

  return (
    <div
      className={`correction-item ${isClickable ? 'clickable' : ''}`}
      onClick={isClickable ? handleClick : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={(e) => {
        if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className="correction-item-header">
        <div className="correction-info">
          <div className="course-details">
            {grade ? (
              <>
                <h4 className="course-code">{grade.courseCode}</h4>
                <p className="course-name">{grade.courseName}</p>
                <div className="semester-info">
                  <span className="semester">{grade.semester}</span>
                  <span className="credit-hours">
                    {grade.creditHours} credits
                  </span>
                </div>
              </>
            ) : (
              <h4 className="correction-title">Grade Correction Request</h4>
            )}
          </div>
          <div className="status-section">
            <span className={getStatusBadgeClass(correction.status)}>
              <span className="status-icon">
                {getStatusIcon(correction.status)}
              </span>
              {correction.status.charAt(0).toUpperCase() +
                correction.status.slice(1)}
            </span>
          </div>
        </div>

        <div className="grade-change">
          {grade && (
            <div className="grade-transition">
              <span className="current-grade">{grade.grade}</span>
              <span className="arrow">→</span>
              <span className="requested-grade">
                {correction.requestedGrade}
              </span>
            </div>
          )}
          {!grade && (
            <div className="requested-grade-only">
              <span className="label">Requested:</span>
              <span className="grade">{correction.requestedGrade}</span>
            </div>
          )}
        </div>
      </div>

      <div className="correction-item-body">
        <div className="correction-reason">
          <h5 className="reason-label">Reason for Correction:</h5>
          <p className="reason-text">
            {showFullDetails || correction.reason.length <= 150
              ? correction.reason
              : `${correction.reason.substring(0, 150)}...`}
          </p>
        </div>

        {correction.supportingDetails && (
          <div className="supporting-details">
            <h5 className="details-label">Supporting Details:</h5>
            <p className="details-text">
              {showFullDetails || correction.supportingDetails.length <= 100
                ? correction.supportingDetails
                : `${correction.supportingDetails.substring(0, 100)}...`}
            </p>
          </div>
        )}
      </div>

      <div className="correction-item-footer">
        <div className="correction-dates">
          <div className="date-item">
            <span className="date-label">Submitted:</span>
            <span className="date-value">
              {formatDate(correction.submissionDate)}
            </span>
            <span className="days-ago">
              ({getDaysSinceSubmission()} days ago)
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

        {correction.status === 'pending' && (
          <div className="pending-indicator">
            <span className="pending-text">Awaiting review</span>
          </div>
        )}
      </div>
    </div>
  );
};
