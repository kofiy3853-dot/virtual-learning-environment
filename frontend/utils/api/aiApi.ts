import axiosInstance from './axiosInstance';

export const aiApi = {
  generateCourseOutline: (courseTitle: string, courseDescription: string, duration: number) =>
    axiosInstance.post('/api/v1/ai/course-outline', { courseTitle, courseDescription, duration }),

  generateQuizQuestions: (topic: string, difficulty = 'medium', count = 5) =>
    axiosInstance.post('/api/v1/ai/quiz-questions', { topic, difficulty, count }),

  generateAssignmentPrompt: (topic: string, learningOutcomes: string[], difficulty = 'medium') =>
    axiosInstance.post('/api/v1/ai/assignment-prompt', { topic, learningOutcomes, difficulty }),

  generateLectureNotes: (topic: string, subtopics: string[] = []) =>
    axiosInstance.post('/api/v1/ai/lecture-notes', { topic, subtopics }),

  generateStudentFeedback: (submissionContent: string, rubricCriteria: string, score: number) =>
    axiosInstance.post('/api/v1/ai/student-feedback', { submissionContent, rubricCriteria, score }),

  generateSyllabus: (courseInfo: { title: string; code: string; instructor: string; duration: number; level: string; description: string }) =>
    axiosInstance.post('/api/v1/ai/syllabus', courseInfo),

  getTutoringResponse: (question: string, courseTitle: string, topic: string, studentLevel = 'intermediate') =>
    axiosInstance.post('/api/v1/ai/tutoring', { question, courseTitle, topic, studentLevel }),

  explainConcept: (concept: string, courseContext: string, studentLevel = 'intermediate') =>
    axiosInstance.post('/api/v1/ai/explain-concept', { concept, courseContext, studentLevel }),

  generateRubric: (assignmentDescription: string, totalPoints = 100) =>
    axiosInstance.post('/api/v1/ai/generate-rubric', { assignmentDescription, totalPoints }),
};
