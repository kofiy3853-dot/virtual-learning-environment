'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, BookOpen, Users, Settings, 
  LogOut, Bell, MessageSquare, Menu, X, 
  Search, GraduationCap, ChevronRight, Activity, TrendingUp,
  LucideIcon
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: Array<'student' | 'teacher' | 'admin'>;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['student', 'teacher', 'admin'] },
  { label: 'Courses', href: '/courses', icon: BookOpen, roles: ['student', 'teacher', 'admin'] },
  { label: 'Users', href: '/admin/users', icon: Users, roles: ['admin'] },
  { label: 'Analytics', href: '/admin/analytics', icon: TrendingUp, roles: ['admin'] },
  { label: 'Messages', href: '/messages', icon: MessageSquare, roles: ['student', 'teacher', 'admin'] },
  { label: 'Activity Logs', href: '/admin/logs', icon: Activity, roles: ['admin'] },
  { label: 'Settings', href: '/profile', icon: Settings, roles: ['student', 'teacher', 'admin'] },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line
    setMounted(true);
  }, []);

  if (!mounted) return null;
  if (pathname?.startsWith('/auth')) return <>{children}</>;

  const filteredNav = navItems.filter(item => 
    (user?.role && item.roles.includes(user.role)) || (item.href === '/dashboard' && user)
  );

  const NavContent = () => (
    <div className="h-full flex flex-col bg-white border-r border-surface-200">
      {/* Brand Logo */}
      <div className="p-6 mb-2">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
            <GraduationCap className="text-white" size={20} />
          </div>
          <span className="font-bold text-xl tracking-tight text-surface-900">UniLearn</span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto scrollbar-thin">
        {filteredNav.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight size={14} className="opacity-50" />}
            </Link>
          );
        })}
      </nav>

      {/* User Card */}
      <div className="p-4 border-t border-surface-200 bg-surface-50/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold border border-primary-200 overflow-hidden shadow-sm">
            {user?.avatar && !user.avatar.includes('no-photo.jpg') ? (
              <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : user?.name?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-surface-900 truncate">{user?.name}</p>
            <span className="badge-primary mt-1">{user?.role}</span>
          </div>
        </div>
        <button 
          onClick={logout}
          className="sidebar-link hover:text-red-600 hover:bg-red-50 text-red-500"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-[240px] sticky top-0 h-screen z-40">
        <NavContent />
      </aside>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 animate-slide-in-left">
            <NavContent />
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full"
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Navbar (Mobile Only) */}
        <header className="lg:hidden h-16 bg-white border-b border-surface-200 flex items-center justify-between px-4 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <GraduationCap className="text-white" size={18} />
            </div>
            <span className="font-bold text-surface-900">UniLearn</span>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(true)} 
            className="p-2 text-surface-500"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
        </header>

        {/* Global Notifications / Tools Bar (Desktop) */}
        <div className="hidden lg:flex h-16 bg-white border-b border-surface-200 items-center justify-between px-8 sticky top-0 z-30">
          <div className="relative group">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 group-focus-within:text-primary-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search platform..." 
              className="input pl-10 h-10 w-80"
            />
          </div>
          <div className="flex items-center gap-3">
            <Link 
              href="/notifications"
              className="p-2 text-surface-500 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all relative"
              aria-label="View notifications"
            >
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </Link>
            <div className="w-px h-6 bg-surface-200 mx-2" />
            <span className="text-xs font-mono text-surface-400 uppercase tracking-widest">v1.4.2 Production</span>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full animate-slide-up">
          {children}
        </main>
      </div>
    </div>
  );
}
