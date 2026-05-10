'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, BookOpen, MessageSquare, Bell, User as UserIcon, 
  LogOut, GraduationCap, Users, BarChart3, Activity
} from 'lucide-react';

const studentLinks = [
  { href: '/dashboard/student',    label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/courses',              label: 'My Courses',     icon: BookOpen },
  { href: '/messages',             label: 'Messages',       icon: MessageSquare },
  { href: '/notifications',        label: 'Notifications',  icon: Bell },
  { href: '/profile',              label: 'Profile',        icon: UserIcon },
];

const teacherLinks = [
  { href: '/dashboard/teacher',    label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/courses',              label: 'My Courses',     icon: BookOpen },
  { href: '/messages',             label: 'Messages',       icon: MessageSquare },
  { href: '/notifications',        label: 'Notifications',  icon: Bell },
  { href: '/profile',              label: 'Profile',        icon: UserIcon },
];

const adminLinks = [
  { href: '/dashboard/admin',      label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/admin/users',          label: 'Users',          icon: Users },
  { href: '/admin/courses',        label: 'Courses',        icon: BookOpen },
  { href: '/admin/analytics',      label: 'Analytics',      icon: BarChart3 },
  { href: '/admin/logs',           label: 'Activity Logs',  icon: Activity },
  { href: '/profile',              label: 'Profile',        icon: UserIcon },
];

const linksByRole: Record<string, any> = { student: studentLinks, teacher: teacherLinks, admin: adminLinks };

import { useNotificationSentinel } from '@/hooks/useNotificationSentinel';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotificationSentinel();
  const pathname = usePathname();
  const links = (user?.role && linksByRole[user.role as keyof typeof linksByRole]) || studentLinks;

  return (
    <aside className="w-64 border-r border-slate-200 bg-white/80 backdrop-blur-xl flex flex-col z-20 relative shadow-sm shrink-0">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-600/20">
            <GraduationCap size={20} className="text-white" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-slate-900">UniLearn</span>
        </div>
      </div>

      <div className="px-4 py-8 flex-1 overflow-y-auto scrollbar-none">
        <p className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">Workspace</p>
        <nav className="flex flex-col gap-1.5">
          {links.map(({ href, label, icon: Icon }: any) => {
            const isActive = pathname === href || (pathname.startsWith(href) && href !== `/dashboard/${user?.role}`);
            const isNotification = label === 'Notifications';
            const isMessage = label === 'Messages';

            return (
              <Link key={href} href={href} 
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold transition-all group ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20 border border-blue-500' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}>
                <div className="flex items-center gap-3">
                   <Icon size={18} className={isActive ? 'text-white' : 'group-hover:text-blue-600 transition-colors'} />
                   <span className="text-sm">{label}</span>
                </div>
                {isNotification && unreadCount > 0 && (
                   <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black shadow-sm ${isActive ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'}`}>
                      {unreadCount}
                   </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 mt-auto border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white border border-slate-200 mb-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm border border-blue-200 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            {user?.name?.charAt(0) || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">{user?.name || 'User'}</p>
            <p className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-wider">{user?.role || 'Guest'}</p>
          </div>
        </div>
        
        <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 font-bold hover:bg-red-50 hover:text-red-700 transition-all w-full text-left">
          <LogOut size={18} />
          <span className="text-sm">Sign out securely</span>
        </button>
      </div>
    </aside>
  );
}
