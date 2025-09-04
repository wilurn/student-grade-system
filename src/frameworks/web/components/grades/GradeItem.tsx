import React, { useState, useEffect } from 'react';
import { Grade, GradeBusinessRules } from '../../../../entities/Grade';
import {
  GradeCorrection,
  GradeCorrectionBusinessRules,
} from '../../../../entities/GradeCorrection';
import { UseGradeReturn } from '../../../../adapters/controllers/useGrade';
import './GradeItem.css';

interface GradeItemProps {
  grade: Grade;
  gradeController: UseGradeReturn;
  onCorrectionRequest?: (grade: Grade) => void;
  showCorrectionOption?: boolean;
}

export const GradeItem: React.FC<GradeItemProps> = ({
  grade,
  gradeController,
  onCorrectionRequest,
  showCorrectionOption = true,
}) => {
  const [correctionStatus, setCorrectionStatus] = useState<{
    hasCorrection: boolean;
    correction?: GradeCorrection;
    canRequest: boolean;
    attempts: number;
  }>({
    hasCorrection: false,
    canRequest: true,
    attempts: 0,
  });

  const [isLoadingCorrection, setIsLoadingCorrection] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkCorrectionStatus = async () => {
      if (!showCorrectionOption) return;

      setIsLoadingCorrection(true);
      try {
        // Check if correction is eligible
        const canRequest = await gradeController.checkCorrectionEligibility(
          grade.id,
          grade.studentId
        );
        const attempts = await gradeController.getCorrectionAttempts(
          grade.id,
          grade.studentId
        );

        // Get existing corrections to find the latest one for this grade
        await gradeController.fetchGradeCorrections(grade.studentId);
        const corrections = gradeController.gradeCorrections.data || [];
        const gradeCorrection = corrections.find((c) => c.gradeId === grade.id);

        if (isMounted) {
          setCorrectionStatus({
            hasCorrection: !!gradeCorrection,
            correction: gradeCorrection,
            canRequest,
            attempts,
          });
        }
      } catch (error) {
        console.error('Error checking correction status:', error);
        // Set default state on error
        if (isMounted) {
          setCorrectionStatus({
            hasCorrection: false,
            canRequest: true,
            attempts: 0,
          });
        }
      } finally {
        if (isMounted) {
          setIsLoadingCorrection(false);
        }
      }
    };

    checkCorrectionStatus();

    return () => {
      isMounted = false;
    };
  }, [grade.id, grade.studentId, gradeController, showCorrectionOption]);

  const handleCorrectionRequest = () => {
    if (onCorrectionRequest && correctionStatus.canRequest) {
      onCorrectionRequest(grade);
    }
  };

  const getGradeColorClass = (gradeValue: string): string => {
    const gradePoints = GradeBusinessRules.getGradePoints(gradeValue);
    if (gradePoints >= 3.7) return 'grade-excellent'; // A range
    if (gradePoints >= 3.0) return 'grade-good'; // B range
    if (gradePoints >= 2.0) return 'grade-satisfactory'; // C range
    if (gradePoints >= 1.0) return 'grade-poor'; // D range
    return 'grade-fail'; // F or other
  };

  const getCorrectionStatusDisplay = () => {
    if (isLoadingCorrection) {
      return (
        <div className="correction-status loading">
          <span className="status-text">Checking...</span>
        </div>
      );
    }

    // Check if grade is eligible for correction first
    if (!GradeBusinessRules.isGradeEligibleForCorrection(grade.grade)) {
      return (
        <div className="correction-status not-eligible">
          <span className="status-text">Correction not available</span>
        </div>
      );
    }

    // If there's an existing correction, show its status
    if (correctionStatus.hasCorrection && correctionStatus.correction) {
      const correction = correctionStatus.correction;
      const statusClass = `correction-status ${correction.status}`;
      const statusText =
        correction.status.charAt(0).toUpperCase() + correction.status.slice(1);

      return (
        <div className={statusClass}>
          <span className="status-text">Correction {statusText}</span>
          {correction.status === 'pending' && (
            <span className="status-detail">
              Requested: {correction.requestedGrade}
            </span>
          )}
          {correction.status === 'approved' && (
            <span className="status-detail">
              New grade: {correction.requestedGrade}
            </span>
          )}
          {correction.status === 'rejected' && correctionStatus.canRequest && (
            <button
              className="correction-resubmit-button"
              onClick={handleCorrectionRequest}
              disabled={!onCorrectionRequest}
              aria-label={`Resubmit correction for ${grade.courseCode}`}
            >
              Resubmit
            </button>
          )}
        </div>
      );
    }

    // No existing correction - check if user can request one
    const maxAttempts =
      GradeCorrectionBusinessRules.getMaxCorrectionsPerGrade();
    if (correctionStatus.attempts >= maxAttempts) {
      return (
        <div className="correction-status max-attempts">
          <span className="status-text">Max attempts reached</span>
        </div>
      );
    }

    if (correctionStatus.canRequest) {
      return (
        <button
          className="correction-request-button"
          onClick={handleCorrectionRequest}
          disabled={!onCorrectionRequest}
          aria-label={`Request correction for ${grade.courseCode}`}
        >
          Request Correction
        </button>
      );
    }

    // Fallback case - cannot request for some other reason
    return (
      <div className="correction-status cannot-request">
        <span className="status-text">Correction pending</span>
      </div>
    );
  };

  const isPassingGrade = GradeBusinessRules.isPassingGrade(grade.grade);
  const qualityPoints = GradeBusinessRules.calculateQualityPoints(grade);

  return (
    <div className={`grade-item ${getGradeColorClass(grade.grade)}`}>
      <div className="grade-item-header">
        <div className="course-info">
          <h3 className="course-code">{grade.courseCode}</h3>
          <p className="course-name">{grade.courseName}</p>
        </div>
        <div className="grade-display">
          <span className={`grade-value ${getGradeColorClass(grade.grade)}`}>
            {grade.grade}
          </span>
          <span className="grade-points">
            {GradeBusinessRules.getGradePoints(grade.grade).toFixed(1)} pts
          </span>
        </div>
      </div>

      <div className="grade-item-details">
        <div className="academic-info">
          <div className="info-item">
            <span className="info-label">Credits:</span>
            <span className="info-value">{grade.creditHours}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Semester:</span>
            <span className="info-value">{grade.semester}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Quality Points:</span>
            <span className="info-value">{qualityPoints.toFixed(1)}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Status:</span>
            <span
              className={`info-value ${isPassingGrade ? 'passing' : 'not-passing'}`}
            >
              {isPassingGrade ? 'Passing' : 'Not Passing'}
            </span>
          </div>
        </div>

        {showCorrectionOption && (
          <div className="correction-section">
            {getCorrectionStatusDisplay()}
          </div>
        )}
      </div>
    </div>
  );
};
