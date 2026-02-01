import React, { useState, useEffect } from 'react';
import { AuthWrapper } from '../Auth';
import { useAuth } from '../Auth/AuthContext';
import DashboardViewer from './DashboardViewer';
import { getDashboardById, type SavedDashboard } from './dashboardStorage';
import './viewer-styles.css';

interface DashboardViewerWrapperProps {
  dashboardId?: string;
}

const DashboardViewerContent: React.FC<DashboardViewerWrapperProps> = ({ dashboardId: propId }) => {
  const [dashboardId, setDashboardId] = useState<string | null>(propId || null);
  const [dashboard, setDashboard] = useState<SavedDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { isAuthorized } = useAuth();

  useEffect(() => {
    // If no propId, try to get from URL
    if (!propId) {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      if (id) {
        setDashboardId(id);
      } else {
        setLoading(false);
        setError(true);
      }
    }
  }, [propId]);

  useEffect(() => {
    if (!dashboardId) return;

    // First check local existence
    const loaded = getDashboardById(dashboardId);
    
    // Then check server-side authorization
    if (loaded && isAuthorized(dashboardId)) {
      setDashboard(loaded);
    } else {
      setError(true); // Either not found locally OR not authorized
    }
    setLoading(false);
  }, [dashboardId, isAuthorized]);

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
        <h1 className="error-title">Access Denied / Not Found</h1>
        <p className="error-message">You do not have permission to view this dashboard, or it does not exist.</p>
        <a href="/dashboards" className="error-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to All Dashboards
        </a>
      </div>
    );
  }

  return (
    <DashboardViewer dashboard={dashboard} />
  );
};

const DashboardViewerWrapper: React.FC<DashboardViewerWrapperProps> = (props) => {
  return (
    <AuthWrapper allowPublic={true}>
      <DashboardViewerContent {...props} />
    </AuthWrapper>
  );
};

export default DashboardViewerWrapper;
