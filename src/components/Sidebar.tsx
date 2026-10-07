import { useState } from 'react';
import { Home, Layers, PenTool, BookOpen, GraduationCap, Sun, Moon, Languages, Keyboard, MessageCircle, Volume2, LogIn, LogOut, Cloud } from 'lucide-react';
import { VoiceSettings } from './VoiceSettings';
import { useAuth } from '@/hooks/useAuth';

export type ViewKey = 'home' | 'flashcards' | 'writing' | 'dictionary' | 'lessons' | 'typing' | 'conversation';

interface NavItem {
  key: ViewKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { key: 'home', label: 'Trang chủ', icon: Home },
  { key: 'flashcards', label: 'Từ vựng', icon: Layers },
  { key: 'lessons', label: 'Bài học', icon: GraduationCap },
  { key: 'conversation', label: 'Giao tiếp', icon: MessageCircle },
  { key: 'typing', label: 'Luyện gõ', icon: Keyboard },
  { key: 'writing', label: 'Luyện viết', icon: PenTool },
  { key: 'dictionary', label: 'Tra cứu', icon: BookOpen },
];

interface SidebarProps {
  current: ViewKey;
  onNavigate: (view: ViewKey) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function Sidebar({ current, onNavigate, theme, onToggleTheme }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const auth = useAuth();

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white/90 px-4 py-3 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/90 lg:hidden">
        <div className="flex items-center gap-2">
          <Languages className="h-6 w-6 text-primary-600" />
          <span className="font-bold text-gray-900 dark:text-gray-100">Hán Tự</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          aria-label="Menu"
        >
          <div className="space-y-1.5">
            <span className="block h-0.5 w-5 bg-current" />
            <span className="block h-0.5 w-5 bg-current" />
            <span className="block h-0.5 w-5 bg-current" />
          </div>
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-gray-200 bg-white transition-transform dark:border-gray-800 dark:bg-gray-950 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600">
            <Languages className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Hán Tự</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Tự học tiếng Trung</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 scrollbar-thin">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = current === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  onNavigate(item.key);
                  setMobileOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all ${
                  active
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? 'text-primary-600 dark:text-primary-400' : ''}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Voice settings + theme toggle */}
        <div className="space-y-2 border-t border-gray-200 p-4 dark:border-gray-800">
          {auth.enabled && !auth.loading && (
            auth.user ? (
              <div className="rounded-xl bg-emerald-50 px-4 py-3 dark:bg-emerald-950/40">
                <p className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  <Cloud className="h-4 w-4" />
                  Tiến độ đang được lưu
                </p>
                <p className="mt-1 truncate text-sm text-gray-800 dark:text-gray-200" title={auth.user.email ?? ''}>
                  {auth.user.email}
                </p>
                <button
                  onClick={() => void auth.signOut()}
                  className="mt-2 flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:underline dark:text-gray-400"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Đăng xuất
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  auth.openAuth();
                  setMobileOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
              >
                <LogIn className="h-5 w-5" />
                Đăng nhập để lưu tiến độ
              </button>
            )
          )}
          <button
            onClick={() => setVoiceOpen(true)}
            className="flex w-full items-center gap-2 rounded-xl bg-gray-100 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <Volume2 className="h-5 w-5" />
            Giọng đọc
          </button>
          <button
            onClick={onToggleTheme}
            className="flex w-full items-center justify-between rounded-xl bg-gray-100 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <span className="flex items-center gap-2">
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              {theme === 'light' ? 'Chế độ tối' : 'Chế độ sáng'}
            </span>
            <span
              className={`relative h-5 w-9 rounded-full transition-colors ${
                theme === 'dark' ? 'bg-primary-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
                  theme === 'dark' ? 'left-4' : 'left-0.5'
                }`}
              />
            </span>
          </button>
        </div>
      </aside>

      <VoiceSettings open={voiceOpen} onClose={() => setVoiceOpen(false)} />

      {/* Mobile spacer */}
      <div className="h-14 lg:hidden" />
    </>
  );
}
