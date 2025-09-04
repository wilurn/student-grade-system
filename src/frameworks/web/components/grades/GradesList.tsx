import React, { useEffect } from 'react';
import { Grade } from '../../../../entities/Grade';
import { UseGradeReturn } from '../../../../adapters/controllers/useGrade';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface GradesListProps {
  studentId: string;
  gradeController: UseGradeReturn;
  onGradeSelect?: (grade: Grade) => void;
}

export const GradesList: React.FC<GradesListProps> = ({
  studentId,
  gradeController,
  onGradeSelect,
}) => {
  const { grades, fetchGrades } = gradeController;

  useEffect(() => {
    if (studentId) {
      fetchGrades(studentId);
    }
  }, [studentId, fetchGrades]);

  const handleGradeClick = (grade: Grade) => {
    onGradeSelect?.(grade);
  };

  // Loading state
  if (grades.isLoading) {
    return (
      <div className="grades-list-container">
        <div className="loading-container">
          <LoadingSpinner size="large" aria-label="Loading grades..." />
        </div>
      </div>
    );
  }

  // Error state
  if (grades.error) {
    return (
      <div className="grades-list-container">
        <div className="error-message" role="alert">
          <h3>Unable to Load Grades</h3>
          <p>{grades.error}</p>
          <button
            onClick={() => fetchGrades(studentId)}
            className="retry-button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!grades.data || grades.data.length === 0) {
    return (
      <div className="grades-list-container">
        <div className="empty-state">
          <h3>No Grades Available</h3>
          <p>
            You don't have any grades recorded yet. Check back later or contact
            your instructor if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  // Group grades by semester for better organization
  const gradesBySemester = grades.data.reduce(
    (acc, grade) => {
      if (!acc[grade.semester]) {
        acc[grade.semester] = [];
      }
      acc[grade.semester].push(grade);
      return acc;
    },
    {} as Record<string, Grade[]>
  );

  // Sort semesters chronologically (most recent first)
  const sortedSemesters = Object.keys(gradesBySemester).sort((a, b) => {
    // Parse semester strings like "Fall 2023", "Spring 2024"
    const parsesemester = (semester: string) => {
      const [season, year] = semester.split(' ');
      const seasonOrder = { Spring: 1, Summer: 2, Fall: 3 };
      return (
        parseInt(year) * 10 +
        (seasonOrder[season as keyof typeof seasonOrder] || 0)
      );
    };

    return parsesemester(b) - parsesemester(a); // Descending order (most recent first)
  });

  return (
    <div className="grades-list-container">
      <div className="grades-header">
        <h2>Academic Grades</h2>
        <div className="grades-summary">
          <span className="total-courses">
            Total Courses: {grades.data.length}
          </span>
          <span className="total-credits">
            Total Credits:{' '}
            {grades.data.reduce((sum, grade) => sum + grade.creditHours, 0)}
          </span>
        </div>
      </div>

      <div className="grades-content">
        {sortedSemesters.map((semester) => (
          <div key={semester} className="semester-section">
            <h3 className="semester-title">{semester}</h3>
            <div className="grades-grid">
              {gradesBySemester[semester].map((grade) => (
                <div
                  key={grade.id}
                  className={`grade-card ${onGradeSelect ? 'clickable' : ''}`}
                  onClick={() => handleGradeClick(grade)}
                  role={onGradeSelect ? 'button' : undefined}
                  tabIndex={onGradeSelect ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (onGradeSelect && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      handleGradeClick(grade);
                    }
                  }}
                >
                  <div className="grade-header">
                    <h4 className="course-code">{grade.courseCode}</h4>
                    <span
                      className={`grade-value grade-${grade.grade.replace(/[+-]/, '')}`}
                    >
                      {grade.grade}
                    </span>
                  </div>
                  <div className="course-info">
                    <p className="course-name">{grade.courseName}</p>
                    <div className="course-details">
                      <span className="credit-hours">
                        {grade.creditHours}{' '}
                        {grade.creditHours === 1 ? 'credit' : 'credits'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
