import * as SecureStore from "expo-secure-store";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { loginProviderMobile, registerProviderPushToken, removeProviderPushToken, getProviderMobileMe, type MobileProviderSummary } from "@/lib/provider-api";
import { mobileConfig } from "@/lib/config";
import { registerForPushNotificationsAsync } from "@/lib/push-notifications";
import { mockProviderSummary } from "@/data/mock-provider";

const TOKEN_KEY = "areasorted_provider_mobile_token";

type AuthContextValue = {
  isInitializing: boolean;
  isSignedIn: boolean;
  isDemoMode: boolean;
  authError: string | null;
  token: string | null;
  provider: MobileProviderSummary | null;
  signIn: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isInitializing, setIsInitializing] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [provider, setProvider] = useState<MobileProviderSummary | null>(null);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!token) return;
    const response = await getProviderMobileMe(token);
    setProvider(response.provider);
  }, [token]);

  useEffect(() => {
    async function bootstrap() {
      try {
        if (mobileConfig.demoMode) {
          setToken("demo-token");
          setProvider(mockProviderSummary);
          setIsInitializing(false);
          return;
        }

        const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        if (!storedToken) {
          setIsInitializing(false);
          return;
        }

        const response = await getProviderMobileMe(storedToken);
        setToken(storedToken);
        setProvider(response.provider);
      } catch {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        setToken(null);
        setProvider(null);
      } finally {
        setIsInitializing(false);
      }
    }

    bootstrap().catch(() => {
      setIsInitializing(false);
    });
  }, []);

  useEffect(() => {
    async function syncPushToken() {
      if (!token || mobileConfig.demoMode) return;

      try {
        const nextPushToken = await registerForPushNotificationsAsync();
        if (!nextPushToken) return;
        setPushToken(nextPushToken);
        await registerProviderPushToken(token, {
          expoPushToken: nextPushToken,
        });
      } catch {
        // Non-critical on simulator or during early setup.
      }
    }

    syncPushToken().catch(() => undefined);
  }, [token]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setAuthError(null);
      if (mobileConfig.demoMode) {
        setToken("demo-token");
        setProvider(mockProviderSummary);
        return { ok: true as const };
      }

      const response = await loginProviderMobile(email, password);
      await SecureStore.setItemAsync(TOKEN_KEY, response.token);
      setToken(response.token);
      setProvider(response.provider);
      return { ok: true as const };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to sign in.";
      setAuthError(message);
      return { ok: false as const, error: message };
    }
  }, []);

  const signOut = useCallback(async () => {
    if (mobileConfig.demoMode) {
      setToken(null);
      setProvider(null);
      setPushToken(null);
      setAuthError(null);
      return;
    }

    if (token && pushToken) {
      try {
        await removeProviderPushToken(token, pushToken);
      } catch {
        // Non-critical
      }
    }

    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setToken(null);
    setProvider(null);
    setPushToken(null);
    setAuthError(null);
  }, [pushToken, token]);

  const value = useMemo<AuthContextValue>(() => ({
    isInitializing,
    isSignedIn: Boolean(token),
    isDemoMode: mobileConfig.demoMode,
    authError,
    token,
    provider,
    signIn,
    signOut,
    refreshProfile,
  }), [authError, isInitializing, provider, refreshProfile, signIn, signOut, token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
