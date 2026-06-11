'use client';

import { useQuery } from '@tanstack/react-query';
import { quizApi } from '@/utils/api/extraApis';
import { queryKeys } from '@/lib/queryKeys';
import { Quiz, Question } from '@/types';

export interface QuizAttempt {
  _id: string;
  status: 'in_progress' | 'completed' | 'started' | 'submitted' | 'graded';
  startedAt?: string;
  startTime?: string;
  score?: number;
  totalMarks?: number;
  percentage?: number;
  feedback?: string;
  answers?: Array<{ questionId: string; answer: string }>;
  student?: { _id: string; name: string };
  answerResults?: Array<{
    questionId: string;
    correct: boolean | null;
    studentAnswer?: string;
    correctAnswer?: string | null;
  }>;
}

export interface QuizDetailData {
  quiz: Quiz;
  questions: Question[];
  attempt: QuizAttempt | null;
  allAttempts: QuizAttempt[];
}

async function fetchQuizDetail(
  quizId: string,
  role: { isStudent: boolean; isTeacher: boolean }
): Promise<QuizDetailData> {
  const qRes = await quizApi.getQuiz(quizId);
  const quiz = qRes.data.data as Quiz;

  let questions: Question[] = [];
  let attempt: QuizAttempt | null = null;
  let allAttempts: QuizAttempt[] = [];

  if (role.isStudent) {
    // Get student's attempt first
    try {
      const aRes = await quizApi.getMyAttempt(quizId);
      attempt = aRes.data.data ?? null;
    } catch {
      attempt = null;
    }
    // Fetch questions for the student (needed to display the quiz)
    try {
      const qsRes = await quizApi.getQuestions(quizId);
      questions = qsRes.data.data || [];
    } catch {
      questions = [];
    }
  }

  if (role.isTeacher) {
    // Teachers always fetch questions
    try {
      const qsRes = await quizApi.getQuestions(quizId);
      questions = qsRes.data.data || [];
    } catch {
      questions = [];
    }
    try {
      const atRes = await quizApi.getAllAttempts(quizId);
      allAttempts = atRes.data.data || [];
    } catch {
      allAttempts = [];
    }
  }

  return { quiz, questions, attempt, allAttempts };
}

export function useQuizDetail(
  quizId: string | undefined,
  role: { isStudent: boolean; isTeacher: boolean },
  enabled = true
) {
  return useQuery({
    queryKey: [...queryKeys.quizzes.detail(quizId ?? ''), role.isStudent, role.isTeacher],
    queryFn: () => fetchQuizDetail(quizId!, role),
    enabled: Boolean(quizId) && enabled,
    // Auto-refresh every 15s for teachers so new student submissions appear without manual reload
    refetchInterval: role.isTeacher ? 15000 : false,
    refetchIntervalInBackground: false,
  });
}
