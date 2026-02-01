import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Login from './Login';
import type { Session } from '@supabase/supabase-js';
import { AuthProvider } from './AuthContext';

interface AuthWrapperProps {
  children: React.ReactNode;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [authorizedDashboards, setAuthorizedDashboards] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(false);

  const isDev = import.meta.env.DEV;

  useEffect(() => {
    if (isDev) {
      console.log('Dev mode detected: Bypassing authentication');
      setSession({
        access_token: 'mock-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: 'dev-user',
          aud: 'authenticated',
          role: 'authenticated',
          email: 'dev@example.com',
          app_metadata: { provider: 'email' },
          user_metadata: {},
          created_at: new Date().toISOString(),
        }
      } as Session);
      setLoading(false);
      return;
    }

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) setLoading(false);
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) setLoading(false);

      // Clean URL hash if we have a session
      if (session && window.location.hash && window.location.hash.includes('access_token')) {
        window.history.replaceState(
          null, 
          '', 
          window.location.pathname + window.location.search
        );
      }
    });

    return () => subscription.unsubscribe();
  }, [isDev]);

  // Fetch authorized dashboards when session is active
  useEffect(() => {
    if (isDev) return;

    const fetchAuthorizations = async () => {
      if (!session) {
        setAuthorizedDashboards(new Set());
        return;
      }

      setAuthChecking(true);
      try {
        const { data, error } = await supabase
          .from('dashboard_access')
          .select('dashboard_id');
        
        if (error) {
          console.error('Error fetching authorizations:', error);
          setAuthorizedDashboards(new Set());
        } else {
          const authorizedIds = new Set(data.map(row => row.dashboard_id));
          setAuthorizedDashboards(authorizedIds);
        }
      } catch (err) {
        console.error('Authorization fetch failed:', err);
        setAuthorizedDashboards(new Set());
      } finally {
        setAuthChecking(false);
        setLoading(false);
      }
    };

    if (session) {
      fetchAuthorizations();
    }
  }, [session, isDev]);

  const isAuthorized = (dashboardId: string) => {
    if (isDev) return true;
    return authorizedDashboards.has(dashboardId);
  };

  if (loading || authChecking) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        background: '#0a0a0a',
        color: '#6a6a6a',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #2a2a2a',
          borderTopColor: '#00D26A',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '16px'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span>Verifying access...</span>
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  return (
    <AuthProvider value={{ session, authorizedDashboards, isAuthorized, loading }}>
      {children}
    </AuthProvider>
  );
};

export default AuthWrapper;
