import React, { createContext, useContext } from 'react';
import type { Session } from '@supabase/supabase-js';

export interface AuthContextType {
  session: Session | null;
  authorizedDashboards: Set<string>;
  isAuthorized: (dashboardId: string) => boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = AuthContext.Provider;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider (provided by AuthWrapper)');
  }
  return context;
};
