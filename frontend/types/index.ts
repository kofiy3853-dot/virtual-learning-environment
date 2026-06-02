export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  status: 'active' | 'suspended'; // Fix #5: was missing from interface
  avatar?: string;
  department?: string;
  createdAt?: string;
}

export interface ContentItem {
  _id: string;
  title: string;
  type: 'pdf' | 'video' | 'slide' | 'note' | 'image';
  fileUrl: string;
  order: number;
}

export interface Module {
  _id: string;
  title: string;
  description?: string;
  weekNumber: number;
  order: number;
  content?: ContentItem[];
}

export interface Course {
  _id: string;
  title: string;
  code: string;
  description?: string;
  status: 'active' | 'draft' | 'archived';
  semester: string;
  academicYear: string;
  teacher?: {
    _id: string;
    name?: string;
  } | string;
  students?: string[] | User[];
  modules?: Module[];
  // Extended wizard fields
  thumbnail?: string;
  category?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  startDate?: string;
  endDate?: string;
  enrollmentType?: 'open' | 'invite';
  maxStudents?: number;
  gradingSystem?: 'percentage' | 'passfail';
  assignmentsEnabled?: boolean;
  certificateEnabled?: boolean;
  schedule?: { day: string; time: string }[];
}


export interface Quiz {
  _id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  duration: number;
  totalMarks: number;
  course: string | Course;
  isPublished: boolean;
  questions?: Question[];
}

export interface Question {
  _id: string;
  text: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string[];
  correctAnswer: string;
  marks: number;
  order: number;
  explanation?: string;
}

export interface Attempt {
  _id: string;
  student: string | User;
  quiz: string | Quiz;
  startTime: string;
  endTime?: string;
  answers: Record<string, string>;
  score?: number;
  status: 'started' | 'submitted' | 'graded';
  feedback?: string;
}

export interface LiveSession {
  _id: string;
  title: string;
  description?: string;
  course: string;
  instructor: string | User;
  scheduledAt: string;
  status: 'scheduled' | 'live' | 'ended';
  roomUrl?: string;
}

export interface Certificate {
  _id: string;
  student: string | User;
  course: Course;
  certificateId: string;
  issuedAt: string;
  grade?: number;
}
