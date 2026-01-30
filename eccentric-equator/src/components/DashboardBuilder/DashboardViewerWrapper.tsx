import React, { useState, useEffect } from 'react';
import DashboardViewer from './DashboardViewer';
import { getDashboardById, type SavedDashboard } from './dashboardStorage';
import './viewer-styles.css';

interface DashboardViewerWrapperProps {
  dashboardId: string;
}

const DashboardViewerWrapper: React.FC<DashboardViewerWrapperProps> = ({ dashboardId }) => {
  const [dashboard, setDashboard] = useState<SavedDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loaded = getDashboardById(dashboardId);
    if (loaded) {
      setDashboard(loaded);
    } else {
      setError(true);
    }
    setLoading(false);
  }, [dashboardId]);

  if (loading) {
    return (
      <div className="viewer-loading">
        <div className="loading-spinner" />
        <div className="loading-text">Loading dashboard...</div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="viewer-error">
        <div className="error-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h1 className="error-title">Dashboard Not Found</h1>
        <p className="error-message">The dashboard you're looking for doesn't exist or has been deleted.</p>
        <a href="/dashboards" className="error-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to All Dashboards
        </a>
      </div>
    );
  }

  return <DashboardViewer dashboard={dashboard} />;
};

export default DashboardViewerWrapper;
