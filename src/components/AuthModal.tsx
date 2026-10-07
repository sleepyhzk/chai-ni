import { useEffect, useState } from 'react';
import { X, Cloud, Mail, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import type { AuthResult } from '@/hooks/useAuth';

type Mode = 'signin' | 'signup' | 'forgot' | 'recover';

const inputCls =
  'w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

export function AuthModal() {
  const auth = useAuth();
  const open = auth.modalOpen || auth.recovering;
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    if (auth.recovering) setMode('recover');
  }, [auth.recovering]);

  useEffect(() => {
    if (!open) {
      setPassword('');
      setError('');
      setInfo('');
      setMode('signin');
    }
  }, [open]);

  if (!open || !auth.enabled) return null;

  const close = () => {
    if (!auth.recovering) auth.closeAuth();
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError('');
    setInfo('');
  };

  const run = async (fn: () => Promise<AuthResult>, onOk?: (r: AuthResult) => void) => {
    setBusy(true);
    setError('');
    setInfo('');
    const r = await fn();
    setBusy(false);
    if (r.error) setError(r.error);
    else onOk?.(r);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const mail = email.trim();
    if (mode === 'signin') {
      void run(() => auth.signIn(mail, password));
    } else if (mode === 'signup') {
      if (password.length < 8) return setError('Mật khẩu cần ít nhất 8 ký tự.');
      void run(
        () => auth.signUp(mail, password),
        (r) => {
          if (r.mailSent) setInfo(`Đã gửi thư xác nhận tới ${mail}. Mở thư và bấm vào liên kết để hoàn tất đăng ký.`);
        }
      );
    } else if (mode === 'forgot') {
      void run(
        () => auth.sendReset(mail),
        () => setInfo(`Đã gửi liên kết đặt lại mật khẩu tới ${mail}.`)
      );
    } else {
      if (password.length < 8) return setError('Mật khẩu cần ít nhất 8 ký tự.');
      void run(() => auth.setNewPassword(password), () => auth.closeAuth());
    }
  };

  const title =
    mode === 'signin' ? 'Đăng nhập' : mode === 'signup' ? 'Tạo tài khoản' : mode === 'forgot' ? 'Quên mật khẩu' : 'Đặt mật khẩu mới';
  const submitLabel =
    mode === 'signin' ? 'Đăng nhập' : mode === 'signup' ? 'Đăng ký' : mode === 'forgot' ? 'Gửi liên kết' : 'Lưu mật khẩu';
  const showEmail = mode !== 'recover';
  const showPassword = mode !== 'forgot';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={close}>
      <div
        className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={title}
      >
        <div className="mb-1 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-gray-100">
            <Cloud className="h-5 w-5 text-primary-600" />
            {title}
          </h2>
          {!auth.recovering && (
            <button
              onClick={close}
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              aria-label="Đóng"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          {mode === 'recover'
            ? 'Nhập mật khẩu mới cho tài khoản của bạn.'
            : 'Đăng nhập để tiến độ học và dấu sao được lưu lại, dùng được trên mọi thiết bị.'}
        </p>

        {(mode === 'signin' || mode === 'signup') && (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => void run(auth.signInWithGoogle)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <GoogleIcon />
              Tiếp tục với Google
            </button>
            <div className="my-4 flex items-center gap-3 text-xs text-gray-400">
              <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
              hoặc dùng email
              <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
            </div>
          </>
        )}

        <form onSubmit={submit} className="space-y-3">
          {showEmail && (
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
              />
            </div>
          )}
          {showPassword && (
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                minLength={mode === 'signin' ? undefined : 8}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                placeholder={mode === 'signin' ? 'Mật khẩu' : 'Mật khẩu (ít nhất 8 ký tự)'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputCls}
              />
            </div>
          )}

          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400">{error}</p>
          )}
          {info && (
            <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
              {info}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitLabel}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm">
          {mode === 'signin' && (
            <>
              <button onClick={() => switchMode('forgot')} className="text-gray-500 hover:underline dark:text-gray-400">
                Quên mật khẩu?
              </button>
              <button onClick={() => switchMode('signup')} className="font-medium text-primary-600 hover:underline">
                Tạo tài khoản
              </button>
            </>
          )}
          {(mode === 'signup' || mode === 'forgot') && (
            <button onClick={() => switchMode('signin')} className="font-medium text-primary-600 hover:underline">
              ← Quay lại đăng nhập
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
