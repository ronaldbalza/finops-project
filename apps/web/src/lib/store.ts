import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Types
interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'ANALYST' | 'VIEWER';
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  sessionId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string, refreshToken?: string, sessionId?: string) => void;
  logout: () => void;
  setToken: (token: string) => void;
  setLoading: (loading: boolean) => void;
}

interface AppState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

interface CostState {
  currentPeriod: {
    start: Date;
    end: Date;
  };
  selectedAccounts: string[];
  selectedServices: string[];
  groupBy: 'service' | 'account' | 'region' | 'tag';
  setPeriod: (start: Date, end: Date) => void;
  setSelectedAccounts: (accounts: string[]) => void;
  setSelectedServices: (services: string[]) => void;
  setGroupBy: (groupBy: 'service' | 'account' | 'region' | 'tag') => void;
  resetFilters: () => void;
}

// Auth Store
export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        token: null,
        refreshToken: null,
        sessionId: null,
        isAuthenticated: false,
        isLoading: true,
        login: (user, token, refreshToken, sessionId) =>
          set({
            user,
            token,
            refreshToken: refreshToken || null,
            sessionId: sessionId || null,
            isAuthenticated: true,
            isLoading: false
          }),
        logout: () =>
          set({
            user: null,
            token: null,
            refreshToken: null,
            sessionId: null,
            isAuthenticated: false,
            isLoading: false
          }),
        setToken: (token) => set({ token }),
        setLoading: (loading) => set({ isLoading: loading }),
      }),
      {
        name: 'auth-storage',
      }
    )
  )
);

// App Store
export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        sidebarOpen: true,
        theme: 'system',
        toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
        setSidebarOpen: (open) => set({ sidebarOpen: open }),
        setTheme: (theme) => set({ theme }),
      }),
      {
        name: 'app-storage',
      }
    )
  )
);

// Cost Store
export const useCostStore = create<CostState>()(
  devtools(
    (set) => ({
      currentPeriod: {
        start: new Date(new Date().setDate(new Date().getDate() - 30)),
        end: new Date(),
      },
      selectedAccounts: [],
      selectedServices: [],
      groupBy: 'service',
      setPeriod: (start, end) => set({ currentPeriod: { start, end } }),
      setSelectedAccounts: (accounts) => set({ selectedAccounts: accounts }),
      setSelectedServices: (services) => set({ selectedServices: services }),
      setGroupBy: (groupBy) => set({ groupBy }),
      resetFilters: () =>
        set({
          selectedAccounts: [],
          selectedServices: [],
          groupBy: 'service',
        }),
    })
  )
);