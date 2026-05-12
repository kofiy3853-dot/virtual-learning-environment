'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { courseApi } from '@/utils/api/courseApi';
import { 
  BookOpen, ChevronRight, Activity, 
  Sparkles, TrendingUp, Play, Star,
  Search, MoreVertical, Heart, Eye,
  Layout, Palette, Code, UserPlus
} from 'lucide-react';
import DashboardLayout from '@/layouts/DashboardLayout';

interface Course {
  _id: string;
  code: string;
  title: string;
  status: string;
  coverImage?: string;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    courseApi.getMyCourses()
      .then((res) => {
        setCourses(res.data.data || []);
      })
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, []);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  })();

  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content */}
        <div className="flex-1 space-y-10">
          {/* Featured Banner */}
          <section className="relative overflow-hidden rounded-[2rem] gradient-card p-10 flex flex-col justify-center min-h-[240px] shadow-lg shadow-indigo-100">
             <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
                <Sparkles size={300} strokeWidth={0.5} className="absolute -top-20 -right-20" />
             </div>
             <div className="relative z-10 max-w-md">
                <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Online Course</p>
                <h1 className="text-3xl md:text-4xl font-display font-bold text-white leading-tight mb-8">
                   Sharpen Your Skills with Professional Online Courses
                </h1>
                <button className="h-12 px-8 bg-black text-white rounded-full font-bold text-sm flex items-center gap-2 hover:bg-gray-900 transition-all">
                   Join Now <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-black"><ChevronRight size={14} /></div>
                </button>
             </div>
          </section>

          {/* Quick Stats Grid */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {[
               { label: 'UI/UX Design', value: '2/8 watched', icon: Layout, bg: 'bg-indigo-50', color: 'text-indigo-600' },
               { label: 'Branding', value: '3/8 watched', icon: Palette, bg: 'bg-rose-50', color: 'text-rose-600' },
               { label: 'Front End', value: '6/12 watched', icon: Code, bg: 'bg-blue-50', color: 'text-blue-600' },
             ].map((item, i) => (
               <div key={i} className="card-premium flex items-center gap-4 py-6">
                  <div className={`w-12 h-12 rounded-2xl ${item.bg} flex items-center justify-center ${item.color}`}>
                     <item.icon size={22} />
                  </div>
                  <div className="flex-1">
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-1.5">{item.value}</p>
                     <h3 className="text-[15px] font-bold text-gray-900 leading-none">{item.label}</h3>
                  </div>
                  <button 
                    title="More Options"
                    aria-label="More Options"
                    className="text-gray-300 hover:text-gray-900 transition-colors"
                  >
                     <MoreVertical size={18} />
                  </button>
               </div>
             ))}
          </section>

          {/* Continue Watching Section */}
          <section className="space-y-6">
             <div className="flex items-center justify-between">
                <h2 className="text-xl font-display font-bold text-gray-900">Continue Watching</h2>
                <div className="flex gap-2">
                   <button 
                     title="Previous"
                     aria-label="Previous Section"
                     className="w-8 h-8 rounded-full bg-white shadow-soft flex items-center justify-center text-gray-400 hover:text-gray-900"
                   >
                     <ChevronRight size={16} className="rotate-180" />
                   </button>
                   <button 
                     title="Next"
                     aria-label="Next Section"
                     className="w-8 h-8 rounded-full bg-indigo-600 shadow-soft flex items-center justify-center text-white"
                   >
                     <ChevronRight size={16} />
                   </button>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {courses.slice(0, 3).map((course, i) => (
                   <motion.div 
                     key={course._id}
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: i * 0.1 }}
                     className="group cursor-pointer"
                   >
                      <div className="relative aspect-[4/3] rounded-[1.5rem] overflow-hidden mb-4 shadow-soft">
                         <img 
                           src={course.coverImage || `https://images.unsplash.com/photo-1587620962725-abab7fe55159?q=80&w=1631&auto=format&fit=crop`} 
                           alt="" 
                           className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                         />
                         <button 
                           title="Add to Favorites"
                           aria-label="Add to Favorites"
                           className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white"
                         >
                            <Heart size={18} />
                         </button>
                      </div>
                      <div className="space-y-3">
                         <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{course.code}</span>
                         <h3 className="text-[15px] font-bold text-gray-900 leading-snug group-hover:text-indigo-600 transition-colors">
                            {course.title}
                         </h3>
                         <div className="flex items-center gap-3 pt-2">
                            <div className="w-6 h-6 rounded-full bg-gray-200 border border-white overflow-hidden">
                               <img src={`https://i.pravatar.cc/100?u=${i}`} alt="" />
                            </div>
                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Leonardo Samsul</span>
                         </div>
                      </div>
                   </motion.div>
                ))}
             </div>
          </section>

          {/* Your Lesson Section */}
          <section className="space-y-6">
             <div className="flex items-center justify-between">
                <h2 className="text-xl font-display font-bold text-gray-900">Your Lesson</h2>
                <Link href="/courses" className="text-xs font-bold text-gray-400 hover:text-indigo-600 uppercase tracking-widest underline underline-offset-4">See all</Link>
             </div>
             <div className="card-premium p-0 overflow-hidden">
                <table className="w-full text-left">
                   <thead className="bg-gray-50/50 border-b border-gray-100">
                      <tr>
                         <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mentor</th>
                         <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Type</th>
                         <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Desc</th>
                         <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Action</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                      {[1, 2].map((_, i) => (
                         <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4">
                               <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs overflow-hidden">
                                     <img src={`https://i.pravatar.cc/100?u=mentor${i}`} alt="" />
                                  </div>
                                  <div>
                                     <p className="text-[13px] font-bold text-gray-900 leading-none mb-1">Padhang Satrio</p>
                                     <p className="text-[10px] text-gray-400 font-medium leading-none">2/16/2024</p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-6 py-4">
                               <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-widest">UI/UX Design</span>
                            </td>
                            <td className="px-6 py-4">
                               <p className="text-[13px] font-medium text-gray-500">Understand Of UI/UX Design</p>
                            </td>
                            <td className="px-6 py-4 text-center">
                               <button 
                                 title="View Details"
                                 aria-label="View Lesson Details"
                                 className="text-gray-300 hover:text-indigo-600 transition-colors"
                               >
                                 <ChevronRight size={18} />
                               </button>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </section>
        </div>

        {/* Sidebar Statistics */}
        <aside className="w-full lg:w-[320px] space-y-8">
           <section className="card-premium space-y-8 py-8">
              <div className="flex items-center justify-between">
                 <h2 className="text-lg font-display font-bold text-gray-900">Statistic</h2>
                 <button 
                   title="Statistic Options"
                   aria-label="Statistic Options"
                   className="text-gray-300 hover:text-gray-900"
                 >
                   <MoreVertical size={18} />
                 </button>
              </div>

              {/* Progress Circle */}
              <div className="flex flex-col items-center justify-center py-4">
                 <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90">
                       <circle cx="64" cy="64" r="56" fill="none" stroke="#F3F4F6" strokeWidth="8" />
                       <circle cx="64" cy="64" r="56" fill="none" stroke="#6366f1" strokeWidth="8" strokeDasharray={351.8} strokeDashoffset={351.8 * 0.68} strokeLinecap="round" />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                       <img src={`https://i.pravatar.cc/100?u=${user?.name}`} className="w-16 h-16 rounded-full border-4 border-white shadow-soft mb-1" alt="" />
                       <div className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">32%</div>
                    </div>
                 </div>
                 <div className="mt-6 text-center">
                    <h3 className="text-lg font-bold text-gray-900 leading-none mb-2">{greeting}, {user?.name?.split(' ')[0] || 'Jason'} 🔥</h3>
                    <p className="text-[12px] text-gray-400 font-medium px-6 leading-relaxed">Continue your learning to achieve your target!</p>
                 </div>
              </div>

              {/* Bar Chart Mockup */}
              <div className="space-y-4 pt-4 border-t border-gray-50">
                 <div className="flex items-end justify-between h-32 px-2">
                    {[30, 60, 45, 90, 40].map((h, i) => (
                       <div key={i} className="w-full flex flex-col items-center gap-3 group">
                          <div className="w-8 bg-gray-100 rounded-lg relative overflow-hidden h-full group-hover:bg-indigo-50 transition-colors">
                             <motion.div 
                               initial={{ height: 0 }}
                               animate={{ height: `${h}%` }}
                               className="absolute bottom-0 w-full bg-indigo-600 rounded-t-lg group-hover:bg-indigo-500 transition-colors"
                             />
                          </div>
                       </div>
                    ))}
                 </div>
                 <div className="flex justify-between px-1">
                    {['1-10', '11-20', '21-30'].map((label, i) => (
                       <span key={i} className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{label} Aug</span>
                    ))}
                 </div>
              </div>
           </section>

           {/* Mentors Section */}
           <section className="card-premium space-y-6 py-8">
              <div className="flex items-center justify-between">
                 <h2 className="text-lg font-display font-bold text-gray-900">Your mentor</h2>
                 <button 
                   title="Add Mentor"
                   aria-label="Add New Mentor"
                   className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-indigo-600"
                 >
                   <Plus size={14} />
                 </button>
              </div>
              <div className="space-y-5">
                 {[
                   { name: 'Padhang Satrio', role: 'Mentor' },
                   { name: 'Zakir Horizontal', role: 'Mentor' },
                   { name: 'Leonardo Samsul', role: 'Mentor' },
                 ].map((mentor, i) => (
                   <div key={i} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
                         <img src={`https://i.pravatar.cc/100?u=mentor_list_${i}`} alt="" />
                      </div>
                      <div className="flex-1 min-w-0">
                         <h4 className="text-[13px] font-bold text-gray-900 truncate">{mentor.name}</h4>
                         <p className="text-[10px] text-gray-400 font-medium">{mentor.role}</p>
                      </div>
                      <button className="text-[11px] font-bold text-gray-400 hover:text-indigo-600 flex items-center gap-1 group">
                         <UserPlus size={12} /> Follow
                      </button>
                   </div>
                 ))}
              </div>
              <button className="w-full py-3 text-[11px] font-bold text-gray-400 hover:text-indigo-600 uppercase tracking-widest bg-gray-50/50 rounded-2xl hover:bg-indigo-50 transition-all mt-4">
                 See All
              </button>
           </section>
        </aside>
      </div>
    </DashboardLayout>
  );
}

