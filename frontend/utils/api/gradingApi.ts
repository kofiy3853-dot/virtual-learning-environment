import axiosInstance from './axiosInstance';

const gradingApi = {
  /**
   * Grade a single submission
   */
  gradeSubmission: async (
    submissionId: string,
    rubricCriteria: Array<{ name: string; points: number; description: string }>,
    totalPoints: number,
    assignmentDescription: string
  ) => {
    const response = await axiosInstance.post(`/api/v1/ai/grade-submission`, {
      submissionId,
      rubricCriteria,
      totalPoints,
      assignmentDescription,
    });
    return response.data;
  },

  /**
   * Grade multiple submissions in batch
   */
  gradeSubmissionsBatch: async (
    submissions: Array<{ _id: string; content: string; studentId: string }>,
    rubricCriteria: Array<{ name: string; points: number; description: string }>,
    totalPoints: number,
    assignmentDescription: string
  ) => {
    const response = await axiosInstance.post(`/api/v1/ai/grade-batch`, {
      submissions,
      rubricCriteria,
      totalPoints,
      assignmentDescription,
    });
    return response.data;
  },

  /**
   * Get grading history for an assignment
   */
  getGradingHistory: async (assignmentId: string, limit: number = 50) => {
    const response = await axiosInstance.get(`/api/v1/ai/grading-history/${assignmentId}`, {
      params: { limit },
    });
    return response.data;
  },

  /**
   * Generate rubric from assignment description
   */
  generateRubric: async (assignmentDescription: string, totalPoints: number = 100) => {
    const response = await axiosInstance.post(`/api/v1/ai/generate-rubric`, {
      assignmentDescription,
      totalPoints,
    });
    return response.data;
  },

  /**
   * Compare AI grade with teacher grade
   */
  compareGrades: async (
    aiScore: number,
    teacherScore: number,
    submissionId: string
  ) => {
    const response = await axiosInstance.post(`/api/v1/ai/compare-grades`, {
      aiScore,
      teacherScore,
      submissionId,
    });
    return response.data;
  },

  /**
   * Generate personalized feedback for student
   */
  generatePersonalizedFeedback: async (
    gradingResult: any,
    studentName: string
  ) => {
    const response = await axiosInstance.post(`/api/v1/ai/personalized-feedback`, {
      gradingResult,
      studentName,
    });
    return response.data;
  },

  /**
   * Save grading result
   */
  saveGradingResult: async (
    submissionId: string,
    gradingResult: any,
    aiGenerated: boolean = true
  ) => {
    const response = await axiosInstance.post(`/api/v1/ai/save-grading`, {
      submissionId,
      gradingResult,
      aiGenerated,
    });
    return response.data;
  },
};

export default gradingApi;

