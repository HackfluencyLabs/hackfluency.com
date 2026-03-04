import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import Login from './Login';
import type { Session } from '@supabase/supabase-js';
import { AuthProvider } from './AuthContext';
import type { SavedDashboard } from '../DashboardBuilder/dashboardStorage';

interface AuthWrapperProps {
  children: React.ReactNode;
  allowPublic?: boolean;
}

function AuthWrapper({ children, allowPublic = false }: AuthWrapperProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [authorizedDashboards, setAuthorizedDashboards] = useState<Set<string>>(new Set());
  const [dashboards, setDashboards] = useState<SavedDashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(false);
  // Track the last user ID we fetched dashboards for — avoids re-fetching on token refresh
  const lastFetchedUserId = useRef<string | null>(null);

  const getDashboardById = useCallback((id: string): SavedDashboard | null => {
    return dashboards.find(d => d.id === id) || null;
  }, [dashboards]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // TOKEN_REFRESHED fires every time the tab regains focus — ignore it
      // to avoid re-running the full auth/dashboard fetch unnecessarily.
      // Only react to actual sign-in/sign-out/user-update events.
      if (event === 'TOKEN_REFRESHED') return;

      setSession(session);
      if (!session) {
        setLoading(false);
        lastFetchedUserId.current = null;
      }

      if (session && window.location.hash && window.location.hash.includes('access_token')) {
        window.history.replaceState(
          null,
          '',
          window.location.pathname + window.location.search
        );
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setAuthorizedDashboards(new Set());
      setDashboards([]);
      return;
    }

    // Skip re-fetch if it's the same user (e.g. token refresh returning a new Session object)
    if (session.user.id === lastFetchedUserId.current) return;

    const fetchDashboards = async () => {

      setAuthChecking(true);
      try {
        const { data: accessData, error: accessError } = await supabase
          .from('dashboard_access')
          .select('dashboard_id');

        if (accessError) {
          console.error('Error fetching authorizations:', accessError);
          setAuthorizedDashboards(new Set());
          setDashboards([]);
          return;
        }

        const authorizedIds = accessData.map(row => row.dashboard_id);
        setAuthorizedDashboards(new Set(authorizedIds));

        if (authorizedIds.length === 0) {
          setDashboards([]);
          return;
        }

        const { data: dashboardData, error: dashboardError } = await supabase
          .from('dashboards')
          .select('id, title, status, version, payload')
          .in('id', authorizedIds);

        if (dashboardError) {
          console.error('Error fetching dashboard data:', dashboardError);
          setDashboards([]);
        } else if (dashboardData) {
          const parsedDashboards: SavedDashboard[] = dashboardData.map(row => {
            const payload = row.payload as Record<string, unknown>;
            const statusMap: Record<number, SavedDashboard['status']> = { 0: 'draft', 1: 'published', 2: 'archived' };
            return {
              id: row.id,
              name: row.title || (payload.name as string) || (payload.title as string) || 'Untitled Dashboard',
              description: (payload.description as string) || '',
              nodes: (payload.nodes as SavedDashboard['nodes']) || [],
              edges: (payload.edges as SavedDashboard['edges']) || [],
              createdAt: (payload.createdAt as string) || (payload.created_at as string) || new Date().toISOString(),
              updatedAt: (payload.updatedAt as string) || (payload.updated_at as string) || new Date().toISOString(),
              publishedAt: (payload.publishedAt as string) || (payload.published_at as string),
              archivedAt: (payload.archivedAt as string) || (payload.archived_at as string),
              version: row.version || (payload.version as number) || 1,
              status: statusMap[row.status as number] || (payload.status as SavedDashboard['status']) || 'draft',
            };
          });
          setDashboards(parsedDashboards);
        }
      } catch (err) {
        console.error('Authorization fetch failed:', err);
        setAuthorizedDashboards(new Set());
        setDashboards([]);
      } finally {
        setAuthChecking(false);
        setLoading(false);
      }
    };

    if (session) {
      lastFetchedUserId.current = session.user.id;
      fetchDashboards();
    }
  }, [session]);

  const isAuthorized = (dashboardId: string) => {
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
        background: 'var(--hf-bg, #0a0a0a)',
        fontFamily: 'Inter, sans-serif',
        padding: '20px',
      }}>
        <style>{`
          @keyframes auth-spin { to { transform: rotate(360deg); } }
          @keyframes auth-shimmer {
            0% { background-position: -400px 0; }
            100% { background-position: 400px 0; }
          }
          .auth-skeleton {
            background: linear-gradient(90deg, var(--hf-bg-secondary, #111) 25%, var(--hf-bg-elevated, #1a1a1a) 50%, var(--hf-bg-secondary, #111) 75%);
            background-size: 800px 100%;
            animation: auth-shimmer 1.6s infinite;
            border-radius: 8px;
          }
          @media (prefers-reduced-motion: reduce) {
            .auth-skeleton { animation: none; background: var(--hf-bg-secondary, #111); }
            .auth-spinner { animation: none !important; }
          }
        `}</style>

        {/* Brand logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
          <img
            src="/HFNeon.png"
            alt="Hackfluency"
            style={{ width: '36px', height: '36px', objectFit: 'contain' }}
          />
          <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--hf-text, #fff)', letterSpacing: '-0.3px' }}>
            <span style={{ color: 'var(--hf-accent, #00D26A)' }}>Hack</span>fluency
          </span>
        </div>

        {/* Spinner + text */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
          <div
            className="auth-spinner"
            style={{
              width: '18px',
              height: '18px',
              border: '2px solid var(--hf-border-secondary, #2a2a2a)',
              borderTopColor: 'var(--hf-accent, #00D26A)',
              borderRadius: '50%',
              animation: 'auth-spin 0.8s linear infinite',
            }}
          />
          <span style={{ fontSize: '13px', color: 'var(--hf-text-disabled, #4a4a4a)', letterSpacing: '0.5px' }}>
            Verifying access…
          </span>
        </div>

        {/* Shimmer skeleton cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '16px',
          width: '100%',
          maxWidth: '900px',
        }}>
          {[1, 2, 3].map(i => (
            <div
              key={i}
              style={{
                background: 'var(--hf-bg-tertiary, #0f0f0f)',
                border: '1px solid var(--hf-bg-elevated, #1a1a1a)',
                borderRadius: '12px',
                padding: '20px',
                opacity: 1 - i * 0.15,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div className="auth-skeleton" style={{ width: '60px', height: '20px' }} />
                <div className="auth-skeleton" style={{ width: '28px', height: '20px' }} />
              </div>
              <div className="auth-skeleton" style={{ width: '75%', height: '18px', marginBottom: '10px' }} />
              <div className="auth-skeleton" style={{ width: '55%', height: '14px', marginBottom: '20px' }} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <div className="auth-skeleton" style={{ width: '70px', height: '14px' }} />
                <div className="auth-skeleton" style={{ width: '80px', height: '14px' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!session && !allowPublic) {
    return <Login />;
  }

  return (
    <AuthProvider value={{ session, authorizedDashboards, isAuthorized, loading, dashboards, getDashboardById }}>
      {children}
    </AuthProvider>
  );
}

export default AuthWrapper;
