'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, BookOpen, MessageSquare, Bell, User as UserIcon, 
  LogOut, GraduationCap, Users, BarChart3, Activity, Radar, 
  Settings, HelpCircle, ChevronRight, Search, X, LucideIcon,
  Zap, Moon, Sun, Sparkles, ChevronDown, Award
} from 'lucide-react';
import useNotificationSentinel from '@/hooks/useNotificationSentinel';
import { useTheme } from '@/context/ThemeContext';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface NavSection {
  group: string;
  items: NavItem[];
}

const studentLinks: NavSection[] = [
  { group: 'Core', items: [
    { href: '/dashboard/student', label: 'Dashboard',     icon: LayoutDashboard },
    { href: '/courses',           label: 'My Courses',    icon: BookOpen },
    { href: '/messages',          label: 'Messages',      icon: MessageSquare },
  ]},
  { group: 'Tools', items: [
    { href: '/radar',             label: 'Progress',      icon: Radar },
    { href: '/certificates',      label: 'Certificates',  icon: Award },
    { href: '/ai-tutor',          label: 'AI Tutor',      icon: Sparkles },
    { href: '/notifications',     label: 'Notifications', icon: Bell },
  ]},
  { group: 'Account', items: [
    { href: '/profile',           label: 'Settings',      icon: Settings },
  ]},
];

const teacherLinks: NavSection[] = [
  { group: 'Core', items: [
    { href: '/teacher',           label: 'Dashboard',     icon: LayoutDashboard },
    { href: '/teacher/courses',   label: 'My Courses',    icon: BookOpen },
    { href: '/teacher/submissions', label: 'Submissions', icon: MessageSquare },
  ]},
  { group: 'Tools', items: [
    { href: '/teacher/ai',        label: 'AI Suite',      icon: Sparkles },
    { href: '/teacher/analytics', label: 'Analytics',     icon: BarChart3 },
    { href: '/notifications',     label: 'Notifications', icon: Bell },
  ]},
  { group: 'Account', items: [
    { href: '/profile',           label: 'Settings',      icon: Settings },
  ]},
];

const adminLinks: NavSection[] = [
  { group: 'Control', items: [
    { href: '/dashboard/admin',   label: 'Dashboard',     icon: LayoutDashboard },
    { href: '/admin/users',       label: 'Users',         icon: Users },
    { href: '/admin/courses',     label: 'Courses',       icon: BookOpen },
  ]},
  { group: 'System', items: [
    { href: '/admin/analytics',   label: 'Analytics',     icon: BarChart3 },
    { href: '/admin/logs',        label: 'Audit Logs',    icon: Activity },
    { href: '/profile',           label: 'Settings',      icon: Settings },
  ]},
];

const linksByRole: Record<string, NavSection[]> = {
  student: studentLinks,
  teacher: teacherLinks,
  admin: adminLinks,
};

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useNotificationSentinel();
  const pathname = usePathname();
  const sections = (user?.role && linksByRole[user.role as keyof typeof linksByRole]) || studentLinks;

  return (
    <aside
      role="navigation"
      aria-label="Main navigation"
      className="w-[220px] h-screen bg-white border-r border-slate-100 flex flex-col z-30 sticky top-0 shrink-0 overflow-hidden dark:bg-[#161b22] dark:border-[#21262d]"
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-slate-100 dark:border-[#21262d] justify-between shrink-0">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center shadow-sm group-hover:opacity-90 transition-opacity">
            <GraduationCap size={15} className="text-white" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-display font-700 text-[13px] tracking-tight text-slate-900 dark:text-white leading-none">UniLearn</span>
            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest leading-none mt-0.5">Intelligence</span>
          </div>
        </Link>
        <div className="flex items-center gap-1">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('toggle-sentinel'))}
            className="relative w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-primary-600 hover:bg-slate-50 dark:hover:bg-[#21262d] transition-all"
            aria-label="Toggle Sentinel"
            title="Activity Feed"
          >
            <Zap size={14} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-primary-600 text-white text-[8px] font-bold rounded-full flex items-center justify-center border border-white">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={toggleTheme}
            className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-primary-600 hover:bg-slate-50 dark:hover:bg-[#21262d] transition-all"
            aria-label="Toggle Theme"
            title="Toggle Theme"
            suppressHydrationWarning
          >
            {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close Sidebar"
              className="lg:hidden w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2.5 shrink-0">
        <button
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
          className="w-full h-8 px-2.5 bg-slate-50 border border-slate-200 dark:bg-[#21262d] dark:border-[#30363d] rounded-md flex items-center gap-2 hover:border-slate-300 transition-colors text-left"
        >
          <Search className="text-slate-400 shrink-0" size={13} />
          <span className="text-[12px] text-slate-400 flex-1 truncate">Search...</span>
          <kbd className="text-[9px] font-bold text-slate-300 bg-white dark:bg-[#161b22] border border-slate-200 dark:border-[#30363d] rounded px-1 py-0.5">⌘K</kbd>
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-2.5 pb-2 scrollbar-premium">
        {sections.map((section: NavSection, idx: number) => (
          <div key={idx} className="mb-3 last:mb-0">
            <p className="px-2 text-[10px] font-semibold text-slate-400 uppercase tracking-[0.1em] mb-1">
              {section.group}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item: NavItem) => {
                const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== `/dashboard/${user?.role}`);
                const hasBadge = item.label === 'Notifications' && unreadCount > 0;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sidebar-item group ${isActive ? 'active' : ''}`}
                  >
                    <item.icon
                      size={15}
                      strokeWidth={isActive ? 2.5 : 1.75}
                      className={isActive ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-600'}
                    />
                    <span className="flex-1 truncate">{item.label}</span>
                    {hasBadge && (
                      <span className="w-4 h-4 rounded bg-primary-600 text-white text-[9px] font-bold flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                    {isActive && (
                      <motion.div
                        layoutId="active-pill"
                        className="absolute right-0 w-0.5 h-4 bg-primary-600 rounded-l-full"
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User Footer */}
      <div className="p-2.5 border-t border-slate-100 dark:border-[#21262d] shrink-0">
        <Link
          href="/profile"
          aria-label="View Profile"
          className="flex items-center gap-2 p-2 rounded-md hover:bg-slate-50 dark:hover:bg-[#21262d] transition-colors group"
        >
          <div className="w-7 h-7 rounded-md bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600 font-bold text-xs overflow-hidden shrink-0">
            {user?.avatar && !user.avatar.includes('no-photo.jpg') ? (
              <img src={user.avatar} alt={user?.name || 'Profile'} className="w-full h-full object-cover" />
            ) : (
              user?.name?.charAt(0).toUpperCase() || '?'
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-600 text-slate-900 dark:text-white truncate leading-tight">{user?.name || 'User'}</p>
            <p className="text-[10px] text-slate-400 capitalize truncate leading-tight">{user?.role || 'Guest'}</p>
          </div>
          <ChevronRight size={12} className="text-slate-300 group-hover:text-slate-400 transition-colors shrink-0" />
        </Link>

        <button
          onClick={logout}
          className="w-full mt-1 flex items-center justify-center gap-1.5 h-8 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-[11px] font-500"
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
