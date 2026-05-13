'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { adminApi } from '@/utils/api/adminApi';
import Sidebar from '@/components/shared/Sidebar';
import { 
  BarChart as BarChartIcon, PieChart, Users, BookOpen, 
  TrendingUp, CalendarCheck, Target, Network 
} from 'lucide-react';

interface OverviewData {
  totalUsers?: number;
  totalCourses?: number;
  totalEnrollments?: number;
}

interface GradesData {
  passRate?: number;
  failRate?: number;
  platformAverage?: number;
  distribution?: Record<string, number>;
}

interface UserGrowthData {
  _id?: { month: number; year: number };
  count?: number;
}

interface AttendanceData {
  platformAttendanceRate?: number;
  courseBreakdown?: { courseId: string; courseTitle: string; attendanceRate: number }[];
}

interface EnrollmentData {
  _id?: string;
  semester?: string;
  count?: number;
}

interface ChartDataItem {
  label: string;
  value: number;
}

function BarChart({ data, color='bg-blue-500', height=160 }: { data: ChartDataItem[], color?: string, height?: number }) {
  if (!data || data.length === 0) return <p className="text-slate-400 text-sm font-medium text-center py-8">No data available</p>;
  const max = Math.max(...data.map(d => d.value || 0), 1);
  return (
    <div className="flex items-end gap-3 pt-4 w-full" style={{ height }}>
      {data.map((d, i) => {
        const pct = Math.max(Math.round(((d.value || 0) / max) * 100), 4); // min 4% height
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
            <span className="text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">{d.value || 0}</span>
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: `${pct}%` }}
              transition={{ duration: 1, delay: i * 0.1, type: "spring", stiffness: 50 }}
              className={`w-full rounded-t-lg opacity-80 group-hover:opacity-100 transition-opacity ${color}`} 
            />
            <span className="text-[9px] font-bold text-slate-400 text-center leading-tight uppercase tracking-wider">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function DonutChart({ passRate=0, failRate=0 }: { passRate?: number, failRate?: number }) {
  const r = 60, cx = 80, cy = 80, circ = 2 * Math.PI * r;
  const passDash = (passRate / 100) * circ;
  
  return (
    <div className="flex flex-col sm:flex-row items-center gap-8 justify-center">
      <div className="relative w-[160px] h-[160px]">
        <svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90">
          <circle cx={cx} cy={cy} r={r} fill="none" className="stroke-slate-100" strokeWidth="20" />
          <motion.circle 
            cx={cx} cy={cy} r={r} fill="none" className="stroke-blue-500" strokeWidth="20" strokeLinecap="round"
            initial={{ strokeDasharray: `0 ${circ}` }}
            animate={{ strokeDasharray: `${passDash} ${circ}` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-slate-900 leading-none">{passRate}%</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Pass Rate</span>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded bg-blue-500 shadow-sm shadow-blue-500/20" />
          <div>
            <p className="text-sm font-extrabold text-slate-900 leading-none mb-1">Pass ({passRate}%)</p>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Score ≥ 50%</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded bg-slate-200" />
          <div>
            <p className="text-sm font-extrabold text-slate-900 leading-none mb-1">Fail ({failRate}%)</p>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Score &lt; 50%</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [grades, setGrades]     = useState<GradesData | null>(null);
  const [userGrowth, setUserGrowth] = useState<UserGrowthData[]>([]);
  const [attendance, setAttendance] = useState<AttendanceData | null>(null);
  const [enrollment, setEnrollment] = useState<EnrollmentData[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.allSettled([
      adminApi.getOverview(),
      adminApi.getGradeAnalytics(),
      adminApi.getUserAnalytics(),
      adminApi.getAttendanceAnalytics(),
      adminApi.getEnrollmentTrends(),
    ]).then(([ov, gr, ug, at, en]) => {
      if (ov.status === 'fulfilled') setOverview(ov.value.data.data);
      if (gr.status === 'fulfilled') setGrades(gr.value.data.data);
      if (ug.status === 'fulfilled') setUserGrowth(ug.value.data.data || []);
      if (at.status === 'fulfilled') setAttendance(at.value.data.data);
      if (en.status === 'fulfilled') setEnrollment(en.value.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const gradeDistData: ChartDataItem[] = grades?.distribution ? [
    { label:'90-100', value: grades.distribution['90-100'] || 0 },
    { label:'70-89',  value: grades.distribution['70-89']  || 0 },
    { label:'50-69',  value: grades.distribution['50-69']  || 0 },
    { label:'<50',    value: grades.distribution['below50'] || 0 },
  ] : [];

  const growthData: ChartDataItem[] = userGrowth.slice(-6).map(d => ({
    label: `${d._id?.month||''}/${String(d._id?.year||'').slice(-2)}`,
    value: d.count || 0,
  }));

  const enrollmentData: ChartDataItem[] = enrollment.map(d => ({
    label: d.semester || d._id || 'Unknown',
    value: d.count || 0,
  }));

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-8 lg:p-12 scroll-smooth">
        <div className="max-w-7xl mx-auto">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
            <div>
              <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Platform Analytics</h1>
              <p className="text-slate-500 font-medium">Comprehensive data overview of system performance, growth, and user engagement.</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm">
              <PieChart size={24} />
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4 shadow-lg shadow-blue-600/20" />
              <p className="text-slate-500 font-bold tracking-wider uppercase text-sm">Crunching numbers...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label:'Total Users', value: overview?.totalUsers || 0, icon: Users, bg:'bg-indigo-50', color:'text-indigo-600', border:'border-indigo-100' },
                  { label:'Active Courses', value: overview?.totalCourses || 0, icon: BookOpen, bg:'bg-emerald-50', color:'text-emerald-600', border:'border-emerald-100' },
                  { label:'Enrollments', value: overview?.totalEnrollments || 0, icon: Network, bg:'bg-amber-50', color:'text-amber-600', border:'border-amber-100' },
                  { label:'Avg Attendance', value: `${attendance?.platformAttendanceRate || 0}%`, icon: CalendarCheck, bg:'bg-rose-50', color:'text-rose-600', border:'border-rose-100' },
                ].map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    className="bg-white rounded-[24px] border border-slate-200 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-slate-50 opacity-50 group-hover:scale-150 transition-transform duration-500 pointer-events-none" />
                    
                    <div className="flex justify-between items-start mb-6 relative z-10">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${s.bg} ${s.color} ${s.border}`}>
                        <s.icon size={20} />
                      </div>
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 text-[9px] font-black text-slate-500 uppercase tracking-widest">Live</span>
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-1">{s.value}</h3>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{s.label}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Charts Row 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Grades Distribution */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                      <BarChartIcon size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900 leading-tight">Grade Distribution</h3>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Score brackets across platform</p>
                    </div>
                  </div>
                  <BarChart data={gradeDistData} color="bg-purple-500" />
                </motion.div>

                {/* Pass/Fail Rate */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                  className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Target size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900 leading-tight">Platform Success Rate</h3>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overall pass vs fail</p>
                    </div>
                  </div>
                  <div className="h-[160px] flex items-center justify-center">
                    <DonutChart passRate={grades?.passRate} failRate={grades?.failRate} />
                  </div>
                </motion.div>
              </div>

              {/* Charts Row 2 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Enrollment Trends */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                  className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm lg:col-span-2">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <TrendingUp size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900 leading-tight">Enrollment Trends</h3>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Historical semester data</p>
                    </div>
                  </div>
                  <BarChart data={enrollmentData} color="bg-emerald-500" height={200} />
                </motion.div>

                {/* User Growth */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                  className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <Users size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900 leading-tight">New User Growth</h3>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Past 6 months</p>
                    </div>
                  </div>
                  <BarChart data={growthData} color="bg-amber-500" height={200} />
                </motion.div>
              </div>

            </div>
          )}
        </div>
      </main>
    </div>
  );
}
