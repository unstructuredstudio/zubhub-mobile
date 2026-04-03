/**
 * Authentication hook — wraps Firebase auth actions
 * and syncs state with the Zustand store.
 */

import { useState } from 'react';
import { Alert } from 'react-native';
import { signIn, signOut as apiSignOut, signUp } from '../services/api';
import { useStore } from '../store/useStore';

export function useAuth() {
  const { setUser, signOut: storeSignOut } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  async function handleSignIn(email: string, password: string): Promise<boolean> {
    setLoading(true);
    setError(null);
    try {
      const profile = await signIn(email.trim().toLowerCase(), password);
      setUser(profile);
      return true;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Sign in failed. Please try again.';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(
    email: string,
    password: string,
    fullName: string,
    organization?: string
  ): Promise<boolean> {
    setLoading(true);
    setError(null);
    try {
      await signUp(
        email.trim().toLowerCase(),
        password,
        fullName.trim(),
        organization?.trim()
      );
      // After sign-up, sign in automatically
      const profile = await signIn(email.trim().toLowerCase(), password);
      setUser(profile);
      return true;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Sign up failed. Please try again.';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut(): Promise<void> {
    try {
      await apiSignOut();
    } catch {
      // Even if the API call fails, clear local state
    } finally {
      storeSignOut();
    }
  }

  return {
    loading,
    error,
    clearError,
    handleSignIn,
    handleSignUp,
    handleSignOut,
  };
}
