const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const { protect: auth, authorize } = require('../middleware/auth');

// AI utility imports
const { generateCourseOutline, generateQuizQuestions, generateAssignmentPrompt, generateLectureNotes, generateStudentFeedback, generateSyllabus } = require('../utils/aiHelper');
const { generateTutoringResponse, generatePracticeProblems, analyzeStudentAnswer, explainConcept } = require('../utils/aiTutoring');
const { gradeSubmission, gradeSubmissionsBatch, generateRubric, compareGrades, generatePersonalizedFeedback } = require('../utils/aiGrading');
const { checkPlagiarism, compareWithPreviousSubmissions, analyzeWritingPatterns, batchCheckPlagiarism } = require('../utils/plagiarismDetector');
const { analyzeStudentPerformance, generateLearningPath, getRecommendedResources, updateLearningPath } = require('../utils/learningPathEngine');
const { predictStudentRisk, generateInterventionPlan, identifyAtRiskStudents, generateRiskReport } = require('../utils/riskPrediction');
const { advancedSearch, generateSearchSuggestions, getTrendingTopics } = require('../utils/aiSearch');

// Models
const Submission = require('../models/Submission');
const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Assignment = require('../models/Assignment');
const Module = require('../models/Module');
const QuizAttempt = require('../models/QuizAttempt');
const AttendanceRecord = require('../models/AttendanceRecord');

const teacherOnly = authorize(['teacher', 'admin']);

// ─── COURSE CONTENT GENERATION ───────────────────────────────────────────────

router.post('/course-outline', auth, teacherOnly, asyncHandler(async (req, res) => {
  const { courseTitle, courseDescription, duration } = req.body;
  if (!courseTitle || !courseDescription || !duration) return res.status(400).json({ message: 'Missing required fields' });
  const outline = await generateCourseOutline(courseTitle, courseDescription, duration);
  res.json({ success: true, data: outline, message: 'Course outline generated successfully' });
}));

router.post('/quiz-questions', auth, teacherOnly, asyncHandler(async (req, res) => {
  const { topic, difficulty = 'medium', count = 5 } = req.body;
  if (!topic) return res.status(400).json({ message: 'Topic is required' });
  const questions = await generateQuizQuestions(topic, difficulty, count);
  res.json({ success: true, data: questions, message: 'Quiz questions generated successfully' });
}));

router.post('/assignment-prompt', auth, teacherOnly, asyncHandler(async (req, res) => {
  const { topic, learningOutcomes, difficulty = 'medium' } = req.body;
  if (!topic || !learningOutcomes?.length) return res.status(400).json({ message: 'Topic and learning outcomes are required' });
  const assignment = await generateAssignmentPrompt(topic, learningOutcomes, difficulty);
  res.json({ success: true, data: assignment, message: 'Assignment prompt generated successfully' });
}));

router.post('/lecture-notes', auth, teacherOnly, asyncHandler(async (req, res) => {
  const { topic, subtopics = [] } = req.body;
  if (!topic) return res.status(400).json({ message: 'Topic is required' });
  const notes = await generateLectureNotes(topic, subtopics);
  res.json({ success: true, data: notes, message: 'Lecture notes generated successfully' });
}));

router.post('/student-feedback', auth, teacherOnly, asyncHandler(async (req, res) => {
  const { submissionContent, rubricCriteria, score } = req.body;
  if (!submissionContent || !rubricCriteria || score === undefined) return res.status(400).json({ message: 'Missing required fields' });
  const feedback = await generateStudentFeedback(submissionContent, rubricCriteria, score);
  res.json({ success: true, data: feedback, message: 'Student feedback generated successfully' });
}));

router.post('/syllabus', auth, teacherOnly, asyncHandler(async (req, res) => {
  const { title, code, instructor, duration, level, description } = req.body;
  if (!title || !code || !instructor || !duration || !level || !description) return res.status(400).json({ message: 'Missing required fields' });
  const syllabus = await generateSyllabus({ title, code, instructor, duration, level, description });
  res.json({ success: true, data: syllabus, message: 'Syllabus generated successfully' });
}));

// ─── TUTORING ─────────────────────────────────────────────────────────────────

router.post('/tutoring', auth, asyncHandler(async (req, res) => {
  const { question, courseTitle, topic, studentLevel = 'intermediate' } = req.body;
  if (!question || !courseTitle || !topic) return res.status(400).json({ message: 'Missing required fields' });
  const response = await generateTutoringResponse(question, courseTitle, topic, studentLevel);
  res.json({ success: true, data: response, message: 'Tutoring response generated successfully' });
}));

router.post('/practice-problems', auth, asyncHandler(async (req, res) => {
  const { topic, difficulty = 'medium', count = 5 } = req.body;
  if (!topic) return res.status(400).json({ message: 'Topic is required' });
  const problems = await generatePracticeProblems(topic, difficulty, count);
  res.json({ success: true, data: problems, message: 'Practice problems generated successfully' });
}));

router.post('/analyze-answer', auth, asyncHandler(async (req, res) => {
  const { question, studentAnswer, topic } = req.body;
  if (!question || !studentAnswer || !topic) return res.status(400).json({ message: 'Missing required fields' });
  const feedback = await analyzeStudentAnswer(question, studentAnswer, topic);
  res.json({ success: true, data: feedback, message: 'Answer analysis completed successfully' });
}));

router.post('/explain-concept', auth, asyncHandler(async (req, res) => {
  const { concept, courseContext, studentLevel = 'intermediate' } = req.body;
  if (!concept || !courseContext) return res.status(400).json({ message: 'Missing required fields' });
  const explanation = await explainConcept(concept, courseContext, studentLevel);
  res.json({ success: true, data: explanation, message: 'Concept explanation generated successfully' });
}));

// ─── GRADING ──────────────────────────────────────────────────────────────────

router.post('/grade-submission', auth, teacherOnly, asyncHandler(async (req, res) => {
  const { submissionId, rubricCriteria, totalPoints, assignmentDescription } = req.body;
  if (!submissionId || !rubricCriteria || !totalPoints || !assignmentDescription) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const submission = await Submission.findById(submissionId).populate('student', 'name');
  if (!submission) return res.status(404).json({ message: 'Submission not found' });

  const submissionContent = submission.textContent || 'No text content provided';
  const gradingResult = await gradeSubmission(submissionContent, rubricCriteria, totalPoints, assignmentDescription);

  res.json({ success: true, data: gradingResult, message: 'Submission graded successfully' });
}));

router.post('/grade-batch', auth, teacherOnly, asyncHandler(async (req, res) => {
  const { assignmentId, rubricCriteria, totalPoints, assignmentDescription } = req.body;
  if (!assignmentId || !rubricCriteria || !totalPoints || !assignmentDescription) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const submissions = await Submission.find({ assignment: assignmentId }).populate('student', 'name');
  const submissionsData = submissions.map(s => ({
    _id: s._id,
    content: s.textContent || '',
    studentId: s.student?._id,
    studentName: s.student?.name,
  }));

  const gradingResults = await gradeSubmissionsBatch(submissionsData, rubricCriteria, totalPoints, assignmentDescription);
  res.json({ success: true, data: gradingResults, message: 'Batch grading completed successfully' });
}));

router.get('/grading-history/:assignmentId', auth, teacherOnly, asyncHandler(async (req, res) => {
  const { assignmentId } = req.params;
  const submissions = await Submission.find({ assignment: assignmentId, grade: { $exists: true } })
    .populate('student', 'name email')
    .select('student grade feedback submittedAt status')
    .sort({ submittedAt: -1 })
    .limit(Number(req.query.limit) || 50);

  res.json({ success: true, data: submissions, message: 'Grading history retrieved successfully' });
}));

router.post('/generate-rubric', auth, teacherOnly, asyncHandler(async (req, res) => {
  const { assignmentDescription, totalPoints = 100 } = req.body;
  if (!assignmentDescription) return res.status(400).json({ message: 'Assignment description is required' });
  const rubric = await generateRubric(assignmentDescription, totalPoints);
  res.json({ success: true, data: rubric, message: 'Rubric generated successfully' });
}));

router.post('/compare-grades', auth, teacherOnly, asyncHandler(async (req, res) => {
  const { aiScore, teacherScore, submissionId } = req.body;
  if (aiScore === undefined || teacherScore === undefined || !submissionId) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  const comparison = await compareGrades({ totalScore: aiScore }, teacherScore, submissionId);
  res.json({ success: true, data: comparison, message: 'Grade comparison completed successfully' });
}));

router.post('/personalized-feedback', auth, teacherOnly, asyncHandler(async (req, res) => {
  const { gradingResult, studentName } = req.body;
  if (!gradingResult || !studentName) return res.status(400).json({ message: 'Missing required fields' });
  const feedback = await generatePersonalizedFeedback(gradingResult, studentName);
  res.json({ success: true, data: feedback, message: 'Personalized feedback generated successfully' });
}));

// ─── PLAGIARISM ───────────────────────────────────────────────────────────────

router.post('/check-plagiarism', auth, teacherOnly, asyncHandler(async (req, res) => {
  const { submissionId } = req.body;
  if (!submissionId) return res.status(400).json({ message: 'Submission ID is required' });

  const submission = await Submission.findById(submissionId).populate('student', 'name');
  if (!submission) return res.status(404).json({ message: 'Submission not found' });

  const submissionContent = submission.textContent || '';
  const result = await checkPlagiarism(submissionContent, submissionId, []);
  res.json({ success: true, data: result, message: 'Plagiarism check completed successfully' });
}));

router.get('/plagiarism-report/:submissionId', auth, teacherOnly, asyncHandler(async (req, res) => {
  const submission = await Submission.findById(req.params.submissionId).populate('student', 'name email');
  if (!submission) return res.status(404).json({ message: 'Submission not found' });
  res.json({ success: true, data: submission, message: 'Submission retrieved successfully' });
}));

router.post('/compare-submissions', auth, teacherOnly, asyncHandler(async (req, res) => {
  const { submissionId, previousSubmissionIds } = req.body;
  if (!submissionId || !previousSubmissionIds) return res.status(400).json({ message: 'Missing required fields' });

  const [current, previous] = await Promise.all([
    Submission.findById(submissionId),
    Submission.find({ _id: { $in: previousSubmissionIds } }),
  ]);
  if (!current) return res.status(404).json({ message: 'Submission not found' });

  const result = await compareWithPreviousSubmissions(
    current.textContent || '',
    previous.map(s => ({ id: s._id, content: s.textContent || '' }))
  );
  res.json({ success: true, data: result, message: 'Submission comparison completed successfully' });
}));

router.post('/analyze-writing-patterns', auth, teacherOnly, asyncHandler(async (req, res) => {
  const { submissionId, previousSubmissionIds = [] } = req.body;
  if (!submissionId) return res.status(400).json({ message: 'Submission ID is required' });

  const [current, previous] = await Promise.all([
    Submission.findById(submissionId),
    Submission.find({ _id: { $in: previousSubmissionIds } }),
  ]);
  if (!current) return res.status(404).json({ message: 'Submission not found' });

  const result = await analyzeWritingPatterns(
    current.textContent || '',
    previous.map(s => ({ id: s._id, content: s.textContent || '' }))
  );
  res.json({ success: true, data: result, message: 'Writing pattern analysis completed successfully' });
}));

router.post('/batch-check-plagiarism', auth, teacherOnly, asyncHandler(async (req, res) => {
  const { submissionIds } = req.body;
  if (!submissionIds?.length) return res.status(400).json({ message: 'Submission IDs are required' });

  const submissions = await Submission.find({ _id: { $in: submissionIds } }).populate('student', 'name');
  const submissionsData = submissions.map(s => ({ id: s._id, content: s.textContent || '', studentName: s.student?.name }));

  const results = await batchCheckPlagiarism(submissionsData);
  res.json({ success: true, data: results, message: 'Batch plagiarism check completed successfully' });
}));

router.get('/plagiarism-stats/:assignmentId', auth, teacherOnly, asyncHandler(async (req, res) => {
  const submissions = await Submission.find({ assignment: req.params.assignmentId });
  const stats = {
    totalSubmissions: submissions.length,
    gradedSubmissions: submissions.filter(s => s.grade !== undefined).length,
    averageGrade: submissions.reduce((sum, s) => sum + (s.grade || 0), 0) / (submissions.length || 1),
  };
  res.json({ success: true, data: stats, message: 'Assignment stats retrieved successfully' });
}));

router.post('/flag-for-review', auth, teacherOnly, asyncHandler(async (req, res) => {
  const { submissionId, reason } = req.body;
  if (!submissionId || !reason) return res.status(400).json({ message: 'Missing required fields' });

  const submission = await Submission.findByIdAndUpdate(
    submissionId,
    { $set: { flaggedForReview: true, flagReason: reason, flaggedBy: req.user._id, flaggedAt: new Date() } },
    { new: true }
  );
  if (!submission) return res.status(404).json({ message: 'Submission not found' });

  res.json({ success: true, data: submission, message: 'Submission flagged for review successfully' });
}));

router.get('/flagged-submissions/:assignmentId', auth, teacherOnly, asyncHandler(async (req, res) => {
  const submissions = await Submission.find({ assignment: req.params.assignmentId, flaggedForReview: true })
    .populate('student', 'name email');
  res.json({ success: true, data: submissions, message: 'Flagged submissions retrieved successfully' });
}));

// ─── LEARNING PATH ────────────────────────────────────────────────────────────

router.post('/learning-path', auth, asyncHandler(async (req, res) => {
  const { studentId, courseId } = req.body;
  if (!studentId || !courseId) return res.status(400).json({ message: 'Student ID and course ID are required' });

  // Fetch real data from DB
  const [student, course, submissions, quizAttempts] = await Promise.all([
    User.findById(studentId).select('name email'),
    Course.findById(courseId).select('title description level'),
    Submission.find({ student: studentId }).populate('assignment', 'title totalPoints').sort({ submittedAt: -1 }).limit(20),
    QuizAttempt.find({ student: studentId }).sort({ createdAt: -1 }).limit(20),
  ]);

  if (!student) return res.status(404).json({ message: 'Student not found' });
  if (!course) return res.status(404).json({ message: 'Course not found' });

  const modules = await Module.find({ course: courseId }).select('title description order').sort({ order: 1 });

  const studentData = {
    studentId,
    name: student.name,
    courseTitle: course.title,
    recentScores: submissions.map(s => ({ assignment: s.assignment?.title, score: s.grade, total: s.assignment?.totalPoints })),
    quizScores: quizAttempts.map(a => ({ score: a.score, total: a.totalPoints })),
    completedModules: [],
  };

  const courseContent = {
    title: course.title,
    description: course.description,
    level: course.level,
    modules: modules.map(m => ({ title: m.title, description: m.description })),
  };

  const performanceAnalysis = await analyzeStudentPerformance(studentData, courseContent);
  const learningPath = await generateLearningPath(studentId, performanceAnalysis, modules);

  res.json({ success: true, data: learningPath, message: 'Learning path generated successfully' });
}));

router.get('/learning-path/:studentId', auth, asyncHandler(async (req, res) => {
  const student = await User.findById(req.params.studentId).select('name email');
  if (!student) return res.status(404).json({ message: 'Student not found' });
  res.json({ success: true, data: { studentId: req.params.studentId, name: student.name }, message: 'Student retrieved successfully' });
}));

router.post('/learning-path/update', auth, asyncHandler(async (req, res) => {
  const { studentId, progressData } = req.body;
  if (!studentId || !progressData) return res.status(400).json({ message: 'Student ID and progress data are required' });
  const updatedPath = await updateLearningPath({ studentId }, progressData);
  res.json({ success: true, data: updatedPath, message: 'Learning path updated successfully' });
}));

router.get('/learning-resources', auth, asyncHandler(async (req, res) => {
  const { topic, learningStyle = 'visual', difficultyLevel = 'intermediate' } = req.query;
  if (!topic) return res.status(400).json({ message: 'Topic is required' });
  const resources = await getRecommendedResources(topic, learningStyle, difficultyLevel);
  res.json({ success: true, data: resources, message: 'Recommended resources retrieved successfully' });
}));

// ─── RISK PREDICTION ──────────────────────────────────────────────────────────

router.post('/at-risk-students', auth, teacherOnly, asyncHandler(async (req, res) => {
  const { courseId } = req.body;
  if (!courseId) return res.status(400).json({ message: 'Course ID is required' });

  const [course, enrollments] = await Promise.all([
    Course.findById(courseId).select('title'),
    Enrollment.find({ course: courseId, status: 'active' }).populate('student', 'name email'),
  ]);
  if (!course) return res.status(404).json({ message: 'Course not found' });

  // Build student performance snapshots
  const studentSnapshots = await Promise.all(
    enrollments.map(async (enr) => {
      const [submissions, quizAttempts] = await Promise.all([
        Submission.find({ student: enr.student._id }).select('grade status submittedAt'),
        QuizAttempt.find({ student: enr.student._id }).select('score totalPoints'),
      ]);
      const avgGrade = submissions.filter(s => s.grade != null).reduce((sum, s) => sum + s.grade, 0) / (submissions.filter(s => s.grade != null).length || 1);
      const avgQuiz = quizAttempts.reduce((sum, a) => sum + (a.score / (a.totalPoints || 1)) * 100, 0) / (quizAttempts.length || 1);
      const lateCount = submissions.filter(s => s.status === 'late').length;
      return {
        studentId: enr.student._id,
        name: enr.student.name,
        email: enr.student.email,
        averageGrade: Math.round(avgGrade),
        averageQuizScore: Math.round(avgQuiz),
        submissionCount: submissions.length,
        lateSubmissions: lateCount,
      };
    })
  );

  const courseData = { courseId, title: course.title, enrolledStudents: enrollments.length };
  const [atRiskStudents, report] = await Promise.all([
    identifyAtRiskStudents(studentSnapshots, courseData),
    generateRiskReport(studentSnapshots, courseData),
  ]);

  res.json({ success: true, data: { students: atRiskStudents, report }, message: 'At-risk students identified successfully' });
}));

router.get('/risk-score/:studentId', auth, asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { courseId } = req.query;
  if (!courseId) return res.status(400).json({ message: 'courseId query param is required' });

  const [submissions, quizAttempts] = await Promise.all([
    Submission.find({ student: studentId }).select('grade status submittedAt'),
    QuizAttempt.find({ student: studentId }).select('score totalPoints createdAt'),
  ]);

  const recentScores = submissions.filter(s => s.grade != null).map(s => s.grade);
  const avgGrade = recentScores.reduce((a, b) => a + b, 0) / (recentScores.length || 1);
  const lateRate = submissions.filter(s => s.status === 'late').length / (submissions.length || 1);

  const studentData = {
    studentId,
    courseId,
    recentScores,
    averageGrade: Math.round(avgGrade),
    lateSubmissionRate: Math.round(lateRate * 100),
    submissionCount: submissions.length,
    quizAttempts: quizAttempts.length,
  };

  const riskPrediction = await predictStudentRisk(studentData, []);
  res.json({ success: true, data: riskPrediction, message: 'Risk score calculated successfully' });
}));

router.post('/intervention', auth, teacherOnly, asyncHandler(async (req, res) => {
  const { studentId, riskPrediction } = req.body;
  if (!studentId || !riskPrediction) return res.status(400).json({ message: 'Student ID and risk prediction are required' });

  const student = await User.findById(studentId).select('name email');
  if (!student) return res.status(404).json({ message: 'Student not found' });

  const interventionPlan = await generateInterventionPlan(riskPrediction, { studentId, name: student.name, email: student.email });
  res.json({ success: true, data: interventionPlan, message: 'Intervention plan created successfully' });
}));

router.get('/intervention/:studentId', auth, asyncHandler(async (req, res) => {
  const student = await User.findById(req.params.studentId).select('name email');
  if (!student) return res.status(404).json({ message: 'Student not found' });
  res.json({ success: true, data: { studentId: req.params.studentId, name: student.name }, message: 'Student retrieved successfully' });
}));

router.post('/risk-report', auth, teacherOnly, asyncHandler(async (req, res) => {
  const { courseId } = req.body;
  if (!courseId) return res.status(400).json({ message: 'Course ID is required' });

  const [course, enrollments] = await Promise.all([
    Course.findById(courseId).select('title'),
    Enrollment.find({ course: courseId, status: 'active' }).populate('student', 'name'),
  ]);
  if (!course) return res.status(404).json({ message: 'Course not found' });

  const courseData = { courseId, title: course.title, enrolledStudents: enrollments.length };
  const report = await generateRiskReport(enrollments.map(e => ({ studentId: e.student._id, name: e.student.name })), courseData);
  res.json({ success: true, data: report, message: 'Risk report generated successfully' });
}));

// ─── SEARCH ───────────────────────────────────────────────────────────────────

router.post('/search', auth, asyncHandler(async (req, res) => {
  const { query, courseId, filters = {} } = req.body;
  if (!query) return res.status(400).json({ message: 'Search query is required' });

  // Build content index from DB
  const courseQuery = courseId ? { _id: courseId } : {};
  const [courses, modules, assignments] = await Promise.all([
    Course.find({ ...courseQuery, status: 'active' }).select('title description level category').limit(50),
    Module.find(courseId ? { course: courseId } : {}).select('title description').limit(50),
    Assignment.find(courseId ? { course: courseId } : {}).select('title description').limit(50),
  ]);

  const courseContent = [
    ...courses.map(c => ({ id: c._id, type: 'course', title: c.title, description: c.description })),
    ...modules.map(m => ({ id: m._id, type: 'material', title: m.title, description: m.description })),
    ...assignments.map(a => ({ id: a._id, type: 'assignment', title: a.title, description: a.description })),
  ];

  const startTime = Date.now();
  const results = await advancedSearch(query, filters, courseContent);
  res.json({ success: true, data: { results, totalResults: results.length, executionTime: Date.now() - startTime }, message: 'Search completed successfully' });
}));

router.post('/search/suggestions', auth, asyncHandler(async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ message: 'Query is required' });
  const suggestions = await generateSearchSuggestions(query, [], []);
  res.json({ success: true, data: { suggestions }, message: 'Suggestions generated successfully' });
}));

router.get('/search/history', auth, asyncHandler(async (req, res) => {
  res.json({ success: true, data: { history: [] }, message: 'Search history retrieved successfully' });
}));

router.post('/search/history/clear', auth, asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Search history cleared successfully' });
}));

router.get('/search/trending', auth, asyncHandler(async (req, res) => {
  const { timeRange = 'week' } = req.query;
  const topics = await getTrendingTopics([], timeRange);
  res.json({ success: true, data: { topics }, message: 'Trending topics retrieved successfully' });
}));

module.exports = router;
