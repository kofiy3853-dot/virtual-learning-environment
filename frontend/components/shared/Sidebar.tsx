'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, BookOpen, MessageSquare, Bell, User as UserIcon, 
  LogOut, GraduationCap, Users, BarChart3, Activity, Radar, 
  Settings, HelpCircle, ChevronRight, Search, X, LucideIcon
} from 'lucide-react';
import useNotificationSentinel from '@/hooks/useNotificationSentinel';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface NavSection {
  group: string;
  items: NavItem[];
}

const studentLinks = [
  { group: 'Overview', items: [
    { href: '/dashboard/student',    label: 'Dashboard',      icon: LayoutDashboard },
    { href: '/radar',                label: 'Academic Radar', icon: Radar },
  ]},
  { group: 'Academic', items: [
    { href: '/courses',              label: 'My Courses',     icon: BookOpen },
    { href: '/messages',             label: 'Messages',       icon: MessageSquare },
    { href: '/notifications',        label: 'Notifications',  icon: Bell },
  ]},
  { group: 'Account', items: [
    { href: '/profile',              label: 'Profile Settings', icon: UserIcon },
  ]}
];

const teacherLinks = [
  { group: 'Management', items: [
    { href: '/dashboard/teacher',    label: 'Command Center',  icon: LayoutDashboard },
    { href: '/courses',              label: 'Course Catalog',  icon: BookOpen },
  ]},
  { group: 'Communication', items: [
    { href: '/messages',             label: 'Messages',       icon: MessageSquare },
    { href: '/notifications',        label: 'Notifications',  icon: Bell },
  ]},
  { group: 'System', items: [
    { href: '/profile',              label: 'Account',        icon: UserIcon },
  ]}
];

const adminLinks = [
  { group: 'Administration', items: [
    { href: '/dashboard/admin',      label: 'Control Panel',   icon: LayoutDashboard },
    { href: '/admin/users',          label: 'User Management', icon: Users },
    { href: '/admin/courses',        label: 'Course Registry', icon: BookOpen },
  ]},
  { group: 'Intelligence', items: [
    { href: '/admin/analytics',      label: 'System Insights', icon: BarChart3 },
    { href: '/admin/logs',           label: 'Audit Logs',      icon: Activity },
  ]},
  { group: 'Settings', items: [
    { href: '/profile',              label: 'Profile',         icon: UserIcon },
  ]}
];

const linksByRole: Record<string, NavSection[]> = { student: studentLinks, teacher: teacherLinks, admin: adminLinks };

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotificationSentinel();
  const pathname = usePathname();
  const sections = (user?.role && linksByRole[user.role as keyof typeof linksByRole]) || studentLinks;

  return (
    <aside className="w-[280px] h-screen bg-white border-r border-slate-100 flex flex-col z-30 sticky top-0 shrink-0 overflow-hidden">
      {/* Logo Section */}
      <div className="h-20 flex items-center px-6 mb-4 justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:scale-105 transition-transform duration-300">
            <GraduationCap size={22} className="text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-lg tracking-tighter text-slate-900 leading-tight">UniLearn</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Intelligence OS</span>
          </div>
        </Link>
        {onClose && (
          <button 
            onClick={onClose} 
            aria-label="Close Sidebar"
            title="Close Sidebar"
            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors border border-slate-100"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Search / Quick Action */}
      <div className="px-4 mb-6">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-primary-500 transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="Search workspace..." 
            className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500/20 transition-all placeholder:text-slate-400"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-white border border-slate-200 rounded-md text-[9px] font-bold text-slate-400 shadow-sm">
            ⌘K
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 scrollbar-premium">
        {sections.map((section: NavSection, idx: number) => (
          <div key={idx} className="mb-8 last:mb-0">
            <h3 className="px-4 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-3">
              {section.group}
            </h3>
            <div className="space-y-1">
              {section.items.map((item: NavItem) => {
                const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== `/dashboard/${user?.role}`);
                const hasBadge = item.label === 'Notifications' && unreadCount > 0;

                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    className={`sidebar-item group ${isActive ? 'active' : ''}`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        isActive ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20' : 'bg-slate-50 text-slate-400 group-hover:bg-white group-hover:text-primary-500 group-hover:shadow-sm'
                      }`}>
                        <item.icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                      </div>
                      <span className="text-[13px] font-semibold tracking-tight">{item.label}</span>
                    </div>
                    
                    {hasBadge && (
                      <div className="w-5 h-5 rounded-md bg-primary-500 text-white text-[10px] font-black flex items-center justify-center shadow-sm">
                        {unreadCount}
                      </div>
                    )}
                    
                    {isActive && (
                      <motion.div 
                        layoutId="active-pill"
                        className="absolute right-0 w-1 h-6 bg-primary-500 rounded-l-full"
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer / User Profile */}
      <div className="p-4 mt-auto">
        <Link 
          href="/profile"
          aria-label="View Profile"
          title="View Profile"
          className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3 mb-4 group hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300"
        >
          <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-primary-500 font-bold text-sm overflow-hidden">
             {user?.avatar && !user.avatar.includes('no-photo.jpg') ? (
                <img src={user.avatar} alt={user?.name || 'Profile'} className="w-full h-full object-cover" />
             ) : (
                user?.name?.charAt(0) || '?'
             )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[13px] font-bold text-slate-900 truncate tracking-tight">{user?.name || 'Academic User'}</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{user?.role || 'Guest'}</p>
          </div>
          <ChevronRight size={14} className="text-slate-300 group-hover:text-primary-500 transition-colors" />
        </Link>

        <div className="grid grid-cols-2 gap-2">
           <button 
             onClick={logout}
             className="flex items-center justify-center gap-2 h-10 rounded-xl bg-white border border-slate-100 text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition-all font-bold text-[11px] uppercase tracking-wider"
           >
              <LogOut size={14} /> Log out
           </button>
           <Link 
             href="/help"
             className="flex items-center justify-center gap-2 h-10 rounded-xl bg-white border border-slate-100 text-slate-600 hover:text-primary-500 hover:bg-primary-50 hover:border-primary-100 transition-all font-bold text-[11px] uppercase tracking-wider"
           >
              <HelpCircle size={14} /> Help
           </Link>
        </div>
      </div>
    </aside>
  );
}
