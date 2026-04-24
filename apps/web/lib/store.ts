import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'superadmin' | 'manager' | 'mentor' | 'student' | 'salesperson';
  avatar?: string;
  wallet?: number;
  totalEarnings?: number;
  totalWithdrawn?: number;
  packageTier?: string;
  isAffiliate?: boolean;
  affiliateCode?: string;
  commissionRate?: number;
  packagePurchasedAt?: string;
  packageExpiresAt?: string;
  xpPoints?: number;
  level?: number;
  badges?: string[];
  streak?: number;
  bio?: string;
  socialLinks?: { linkedin?: string; twitter?: string; website?: string };
  managerName?: string;
  managerPhone?: string;
  sponsorCode?: string;
  kyc?: {
    pan?: string; panName?: string; panVerified?: boolean;
    aadhar?: string; aadharName?: string; aadharVerified?: boolean;
    bankAccount?: string; bankIfsc?: string; bankName?: string; bankHolderName?: string;
    status: 'pending' | 'submitted' | 'verified' | 'rejected';
    rejectionReason?: string;
    submittedAt?: string; verifiedAt?: string;
  };
  loginCount?: number;
  createdAt?: string;
  enrollmentCount?: number;
}

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  _hasHydrated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  updateUser: (user: Partial<User>) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      _hasHydrated: false,
      setAuth: (user, accessToken, refreshToken) => {
        Cookies.set('accessToken', accessToken, { expires: 7 });
        Cookies.set('refreshToken', refreshToken, { expires: 30 });
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        set({ user, accessToken, refreshToken });
      },
      updateUser: (updates) => set((s) => ({ user: s.user ? { ...s.user, ...updates } : s.user })),
      logout: () => {
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        localStorage.clear();
        set({ user: null, accessToken: null, refreshToken: null });
      },
      isAuthenticated: () => !!get().user && !!get().accessToken,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'trulearnix-auth',
      skipHydration: true,
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken, refreshToken: s.refreshToken }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// Hydrate from localStorage as soon as this module is loaded in the browser.
// skipHydration:true prevents SSR mismatch but requires an explicit rehydrate call —
// without this, the store stays empty after every page refresh, causing immediate logout.
if (typeof window !== 'undefined') {
  useAuthStore.persist.rehydrate();
}
