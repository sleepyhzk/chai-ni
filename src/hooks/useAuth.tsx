/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, cloudEnabled } from '@/lib/supabase';

/** Phát ra sau khi người dùng chủ động đăng xuất, để xóa dữ liệu học lưu trên máy này. */
export const SIGNED_OUT_EVENT = 'hantu:signed-out';

export interface AuthResult {
  error?: string;
  /** Đã gửi thư xác nhận / thư đặt lại mật khẩu. */
  mailSent?: boolean;
}

interface AuthContextValue {
  enabled: boolean;
  user: User | null;
  loading: boolean;
  recovering: boolean;
  modalOpen: boolean;
  openAuth: () => void;
  closeAuth: () => void;
  signInWithGoogle: () => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  sendReset: (email: string) => Promise<AuthResult>;
  setNewPassword: (password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function viMessage(err: { message?: string; code?: string }): string {
  const code = err.code ?? '';
  const msg = (err.message ?? '').toLowerCase();
  if (code === 'invalid_credentials' || msg.includes('invalid login credentials')) {
    return 'Email hoặc mật khẩu không đúng.';
  }
  if (code === 'email_not_confirmed' || msg.includes('email not confirmed')) {
    return 'Email chưa được xác nhận. Hãy mở thư xác nhận trong hộp thư (kể cả mục Spam).';
  }
  if (code === 'user_already_exists' || msg.includes('already registered')) {
    return 'Email này đã được đăng ký. Hãy đăng nhập.';
  }
  if (code === 'weak_password' || msg.includes('password should be')) {
    return 'Mật khẩu quá yếu. Hãy dùng ít nhất 8 ký tự.';
  }
  if (code === 'same_password') return 'Mật khẩu mới phải khác mật khẩu cũ.';
  if (code === 'over_email_send_rate_limit' || msg.includes('rate limit')) {
    return 'Đã gửi quá nhiều thư trong thời gian ngắn. Hãy thử lại sau ít phút.';
  }
  if (msg.includes('failed to fetch') || msg.includes('network')) {
    return 'Không kết nối được máy chủ. Hãy kiểm tra mạng.';
  }
  return 'Có lỗi xảy ra, vui lòng thử lại.';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(cloudEnabled);
  const [recovering, setRecovering] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setUser(data.session?.user ?? null);
        setLoading(false);
      })
      .catch(() => active && setLoading(false));

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'PASSWORD_RECOVERY') setRecovering(true);
      if (event === 'SIGNED_IN') setModalOpen(false);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<AuthResult> => {
    if (!supabase) return { error: 'Chưa cấu hình Supabase.' };
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    return error ? { error: viMessage(error) } : {};
  }, []);

  const signUp = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) return { error: 'Chưa cấu hình Supabase.' };
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) return { error: viMessage(error) };
    // Khi bật xác nhận email, email đã đăng ký sẽ trả về user không có identities (Supabase che để chống dò email).
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      return { error: 'Email này đã được đăng ký. Hãy đăng nhập.' };
    }
    return { mailSent: !data.session };
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) return { error: 'Chưa cấu hình Supabase.' };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { error: viMessage(error) } : {};
  }, []);

  const sendReset = useCallback(async (email: string): Promise<AuthResult> => {
    if (!supabase) return { error: 'Chưa cấu hình Supabase.' };
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    return error ? { error: viMessage(error) } : { mailSent: true };
  }, []);

  const setNewPassword = useCallback(async (password: string): Promise<AuthResult> => {
    if (!supabase) return { error: 'Chưa cấu hình Supabase.' };
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error: viMessage(error) };
    setRecovering(false);
    return {};
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (!error) window.dispatchEvent(new Event(SIGNED_OUT_EVENT));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      enabled: cloudEnabled,
      user,
      loading,
      recovering,
      modalOpen,
      openAuth: () => setModalOpen(true),
      closeAuth: () => setModalOpen(false),
      signInWithGoogle,
      signUp,
      signIn,
      sendReset,
      setNewPassword,
      signOut,
    }),
    [user, loading, recovering, modalOpen, signInWithGoogle, signUp, signIn, sendReset, setNewPassword, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải được dùng bên trong <AuthProvider>');
  return ctx;
}
