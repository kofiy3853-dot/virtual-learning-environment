'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { courseApi } from '@/utils/api/courseApi';
import { Course, User } from '@/types';
import { AxiosError } from 'axios';
import styles from './admin_course_detail.module.css';

type TabType = 'overview' | 'students' | 'modules' | 'analytics' | 'settings';

interface ToastState {
  msg: string;
  type: string;
}

export default function AdminCourseDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { user, logout } = useAuth();
  const router = useRouter();

  const [course, setCourse]           = useState<Course | null>(null);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState<TabType>('overview');
  const [toast, setToast]             = useState<ToastState | null>(null);
  
  const [students, setStudents]       = useState<User[]>([]);
  const [tabLoading, setTabLoading]   = useState(false);

  const showToast = (msg: string, type: string = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchCourse = useCallback(async () => {
    if (!id) return;
    try {
      const res = await courseApi.getOne(id);
      setCourse(res.data.data);
    } catch (err) {
      showToast('Failed to load course', 'error');
      router.push('/admin/courses');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  const fetchStudents = useCallback(async () => {
    if (!id) return;
    setTabLoading(true);
    try {
      const res = await courseApi.getStudents(id);
      setStudents(res.data.data || []);
    } catch (err) {
      showToast('Failed to load students', 'error');
    } finally {
      setTabLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  useEffect(() => {
    if (activeTab === 'students') fetchStudents();
  }, [activeTab, fetchStudents]);

  const navItems = [
    { href:'/dashboard/admin', label:'Dashboard',    icon:'📊' },
    { href:'/admin/users',     label:'Users',         icon:'👥' },
    { href:'/admin/courses',   label:'Courses',       icon:'📚', active: true },
    { href:'/admin/analytics', label:'Analytics',     icon:'📈' },
    { href:'/admin/logs',      label:'Activity Logs', icon:'📋' },
    { href:'/profile',         label:'Profile',       icon:'👤' },
  ];

  if (loading) return (
    <div className={styles.wrap}>
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b' }}>
        Loading administrative data...
      </div>
    </div>
  );

  return (
    <div className={styles.wrap}>
      {toast && (
        <div className={styles.toast} style={{ backgroundColor: toast.type==='error'?'#fee2e2':'#d1fae5', color: toast.type==='error'?'#991b1b':'#065f46' }}>
          {toast.msg}
        </div>
      )}

      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.logoBox}>
          <div className={styles.logoInner}>
            <div className={styles.logoIcon}>
              <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
              </svg>
            </div>
            <span style={{ fontWeight:700, fontSize:16, color:'#0f172a' }}>UniLearn</span>
          </div>
        </div>
        <nav className={styles.nav}>
          {navItems.map(item => (
            <Link key={item.href} href={item.href} className={item.active ? styles.linkActive : styles.link}>
              <span style={{ fontSize:16 }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div style={{ padding:'10px', borderTop:'1px solid #f1f5f9' }}>
          <button onClick={logout} className={styles.link} style={{ color: '#ef4444' }}>
            <span>🚪</span><span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className={styles.main}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
          <Link href="/admin/courses" style={{ color:'#4f46e5', fontSize:14, fontWeight:600, textDecoration:'none' }}>← Back to courses</Link>
        </div>

        <div className={styles.header}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
              <span style={{ fontSize:12, fontWeight:700, backgroundColor:'#e0e7ff', color:'#4338ca', padding:'2px 8px', borderRadius:9999 }}>{course?.code}</span>
              <span style={{ fontSize:12, fontWeight:700, backgroundColor: course?.status === 'active' ? '#d1fae5' : '#f1f5f9', color: course?.status === 'active' ? '#065f46' : '#475569', padding:'2px 8px', borderRadius:9999 }}>{course?.status}</span>
            </div>
            <h1 style={{ fontSize:28, fontWeight:800, color:'#0f172a', margin:0 }}>{course?.title}</h1>
            <p style={{ fontSize:14, color:'#64748b', marginTop:4 }}>{course?.semester} · {course?.academicYear}</p>
          </div>
          <div style={{ display:'flex', gap:12 }}>
            <button className={styles.link} style={{ backgroundColor:'#f1f5f9', width:'auto' }}>Archive Course</button>
            <button className={styles.link} style={{ backgroundColor:'#fee2e2', color:'#ef4444', width:'auto' }}>Delete Course</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:8, borderBottom:'1px solid #e2e8f0', marginBottom:24 }}>
          {[
            { id: 'overview',  label: 'Overview',   icon: '📊' },
            { id: 'students',  label: 'Students',   icon: '👥' },
            { id: 'modules',   label: 'Curriculum', icon: '📦' },
            { id: 'analytics', label: 'Analytics',  icon: '📈' },
            { id: 'settings',  label: 'Settings',   icon: '⚙️' },
          ].map(t => (
            <button 
              key={t.id} 
              onClick={() => setActiveTab(t.id as TabType)}
              className={activeTab === t.id ? styles.tabActive : styles.tabBtn}
            >
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className={styles.card}>
          {activeTab === 'overview' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:32 }}>
              <div>
                <h3 style={{ fontSize:16, fontWeight:700, color:'#1e293b', marginBottom:16 }}>Course Description</h3>
                <p style={{ fontSize:14, color:'#475569', lineHeight:1.6 }}>{course?.description || 'No description provided.'}</p>
                
                <h3 style={{ fontSize:16, fontWeight:700, color:'#1e293b', marginTop:24, marginBottom:16 }}>Instructor</h3>
                <div style={{ display:'flex', alignItems:'center', gap:12, padding:16, backgroundColor:'#f8fafc', borderRadius:16, border:'1px solid #f1f5f9' }}>
                  <div style={{ width:40, height:40, borderRadius:12, backgroundColor:'#e0e7ff', color:'#4338ca', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700 }}>
                    {typeof course?.teacher === 'object' ? course.teacher?.name?.charAt(0) : '?'}
                  </div>
                  <div>
                    <p style={{ fontSize:14, fontWeight:600, color:'#0f172a', margin:0 }}>{typeof course?.teacher === 'object' ? course.teacher?.name : 'TBA'}</p>
                    <p style={{ fontSize:12, color:'#64748b', margin:0 }}>{typeof course?.teacher === 'object' ? (course.teacher as any)?.email : ''}</p>
                  </div>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                {[
                  { label:'Enrolled Students', value: students.length || 0, icon:'👥', color:'#4f46e5' },
                  { label:'Course Modules',    value: 0, icon:'📦', color:'#10b981' },
                  { label:'Assignments',      value: 0, icon:'📝', color:'#f59e0b' },
                  { label:'Quizzes',          value: 0, icon:'⏱️', color:'#ef4444' },
                ].map((s, i) => (
                  <div key={i} style={{ padding:20, backgroundColor:'#f8fafc', borderRadius:16, border:'1px solid #f1f5f9' }}>
                    <span style={{ fontSize:20, display:'block', marginBottom:8 }}>{s.icon}</span>
                    <h4 style={{ fontSize:20, fontWeight:800, color:'#0f172a', margin:0 }}>{s.value}</h4>
                    <p style={{ fontSize:12, color:'#64748b', margin:0 }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'students' && (
            <div>
              {tabLoading ? (
                <div style={{ padding:40, textAlign:'center', color:'#94a3b8' }}>Loading student list...</div>
              ) : students.length === 0 ? (
                <div style={{ textAlign:'center', padding:40, opacity:0.6 }}>No students enrolled in this course yet.</div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.th}>Student</th>
                      <th className={styles.th}>Email</th>
                      <th className={styles.th}>Status</th>
                      <th className={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(s => (
                      <tr key={s._id}>
                        <td className={styles.td}>
                          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <div style={{ width:32, height:32, borderRadius:8, backgroundColor:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700 }}>{s.name?.charAt(0)}</div>
                            <span style={{ fontWeight:600 }}>{s.name}</span>
                          </div>
                        </td>
                        <td className={styles.td}>{s.email}</td>
                        <td className={styles.td}>
                          <span style={{ fontSize:11, fontWeight:700, color:'#059669', backgroundColor:'#ecfdf5', padding:'2px 8px', borderRadius:9999 }}>ENROLLED</span>
                        </td>
                        <td className={styles.td}>
                          <button style={{ color:'#ef4444', border:'none', background:'none', cursor:'pointer', fontSize:13, fontWeight:600 }}>Unenroll</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {['modules', 'analytics', 'settings'].includes(activeTab) && (
            <div style={{ padding:60, textAlign:'center', color:'#94a3b8', opacity:0.6 }}>
              <div style={{ fontSize:48, marginBottom:16 }}>🚧</div>
              <h3 style={{ fontSize:18, fontWeight:700 }}>Coming Soon</h3>
              <p>Management interface for {activeTab} is being finalized.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
