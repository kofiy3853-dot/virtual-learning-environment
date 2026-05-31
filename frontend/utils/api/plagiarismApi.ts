import axiosInstance from './axiosInstance';

const plagiarismApi = {
  /**
   * Check submission for plagiarism
   */
  checkPlagiarism: async (submissionId: string) => {
    const response = await axiosInstance.post(`/api/v1/ai/check-plagiarism`, {
      submissionId,
    });
    return response.data;
  },

  /**
   * Get plagiarism report for a submission
   */
  getPlagiarismReport: async (submissionId: string) => {
    const response = await axiosInstance.get(`/api/v1/ai/plagiarism-report/${submissionId}`);
    return response.data;
  },

  /**
   * Compare submission with previous submissions
   */
  compareWithPreviousSubmissions: async (
    submissionId: string,
    previousSubmissionIds: string[]
  ) => {
    const response = await axiosInstance.post(`/api/v1/ai/compare-submissions`, {
      submissionId,
      previousSubmissionIds,
    });
    return response.data;
  },

  /**
   * Analyze writing patterns
   */
  analyzeWritingPatterns: async (
    submissionId: string,
    previousSubmissionIds: string[] = []
  ) => {
    const response = await axiosInstance.post(`/api/v1/ai/analyze-writing-patterns`, {
      submissionId,
      previousSubmissionIds,
    });
    return response.data;
  },

  /**
   * Batch check multiple submissions for plagiarism
   */
  batchCheckPlagiarism: async (submissionIds: string[]) => {
    const response = await axiosInstance.post(`/api/v1/ai/batch-check-plagiarism`, {
      submissionIds,
    });
    return response.data;
  },

  /**
   * Get plagiarism statistics for an assignment
   */
  getPlagiarismStats: async (assignmentId: string) => {
    const response = await axiosInstance.get(`/api/v1/ai/plagiarism-stats/${assignmentId}`);
    return response.data;
  },

  /**
   * Flag submission for manual review
   */
  flagForReview: async (submissionId: string, reason: string) => {
    const response = await axiosInstance.post(`/api/v1/ai/flag-for-review`, {
      submissionId,
      reason,
    });
    return response.data;
  },

  /**
   * Get flagged submissions
   */
  getFlaggedSubmissions: async (assignmentId: string) => {
    const response = await axiosInstance.get(`/api/v1/ai/flagged-submissions/${assignmentId}`);
    return response.data;
  },
};

export default plagiarismApi;

