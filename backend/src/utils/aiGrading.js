/**
 * AI Grading Service
 * Automatically grades assignments and provides constructive feedback
 */

const OpenAI = require('openai');

// Lazy client — uses OpenAI key if available, falls back to OpenRouter, then NVIDIA
let _openai = null;
function getClient() {
  if (!_openai) {
    if (process.env.OPENAI_API_KEY) {
      _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    } else if (process.env.NVIDIA_API_KEY) {
      _openai = new OpenAI({
        apiKey: process.env.NVIDIA_API_KEY,
        baseURL: 'https://integrate.api.nvidia.com/v1',
      });
    } else if (process.env.OPENROUTER_API_KEY) {
      _openai = new OpenAI({
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:3000',
          'X-Title': 'UniLearn LMS',
        },
      });
    } else {
      throw new Error('No AI API key set. Add OPENAI_API_KEY, NVIDIA_API_KEY, or OPENROUTER_API_KEY to .env');
    }
  }
  return _openai;
}

/**
 * Grade a single submission
 * @param {string} submissionContent - Student's submission content
 * @param {Array} rubricCriteria - Grading rubric criteria
 * @param {number} totalPoints - Total points for assignment
 * @param {string} assignmentDescription - Assignment description for context
 * @returns {Promise<Object>} Grading result with score and feedback
 */
async function gradeSubmission(submissionContent, rubricCriteria, totalPoints, assignmentDescription) {
  try {
    const rubricText = rubricCriteria
      .map((c, i) => `${i + 1}. ${c.name} (${c.points} points): ${c.description}`)
      .join('\n');

    const systemPrompt = `You are an expert educator grading student submissions.
Your task is to:
1. Evaluate the submission against the rubric criteria
2. Assign points for each criterion
3. Provide specific, constructive feedback
4. Identify strengths and areas for improvement
5. Suggest next steps for learning

Assignment: ${assignmentDescription}

Rubric Criteria:
${rubricText}

Total Points: ${totalPoints}

Format your response as JSON:
{
  "totalScore": number (0-${totalPoints}),
  "percentage": number (0-100),
  "rubricScores": [
    {
      "criterion": "criterion name",
      "score": number,
      "maxScore": number,
      "feedback": "specific feedback for this criterion"
    }
  ],
  "strengths": ["strength1", "strength2", "strength3"],
  "improvements": ["area1", "area2", "area3"],
  "generalFeedback": "Overall constructive feedback",
  "suggestions": "Specific suggestions for improvement",
  "grade": "A/B/C/D/F based on percentage"
}`;

    const response = await getClient().chat.completions.create({
      model: process.env.OPENAI_API_KEY ? 'gpt-4o' : 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `Please grade this submission:\n\n${submissionContent}`,
        },
      ],
      temperature: 0.5,
      max_tokens: 2000,
    });

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      totalScore: 0,
      percentage: 0,
      rubricScores: [],
      strengths: [],
      improvements: [],
      generalFeedback: content,
      suggestions: '',
      grade: 'F',
    };
  } catch (error) {
    console.error('Error grading submission:', error);
    throw new Error('Failed to grade submission');
  }
}

/**
 * Grade multiple submissions in batch
 * @param {Array} submissions - Array of submissions to grade
 * @param {Array} rubricCriteria - Grading rubric criteria
 * @param {number} totalPoints - Total points for assignment
 * @param {string} assignmentDescription - Assignment description
 * @returns {Promise<Array>} Array of grading results
 */
async function gradeSubmissionsBatch(submissions, rubricCriteria, totalPoints, assignmentDescription) {
  try {
    const results = [];

    for (const submission of submissions) {
      const result = await gradeSubmission(
        submission.content,
        rubricCriteria,
        totalPoints,
        assignmentDescription
      );

      results.push({
        submissionId: submission._id,
        studentId: submission.studentId,
        ...result,
      });

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
  } catch (error) {
    console.error('Error grading batch submissions:', error);
    throw new Error('Failed to grade batch submissions');
  }
}

/**
 * Generate detailed rubric from assignment description
 * @param {string} assignmentDescription - Assignment description
 * @param {number} totalPoints - Total points for assignment
 * @returns {Promise<Array>} Generated rubric criteria
 */
async function generateRubric(assignmentDescription, totalPoints = 100) {
  try {
    const response = await getClient().chat.completions.create({
      model: process.env.OPENAI_API_KEY ? 'gpt-4o' : 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert educator creating grading rubrics.
Generate a detailed rubric for grading this assignment.
Total points: ${totalPoints}

Format your response as a JSON array:
[
  {
    "name": "Criterion name",
    "description": "What this criterion evaluates",
    "points": number,
    "levels": [
      {
        "level": "Excellent",
        "description": "What excellent work looks like"
      },
      {
        "level": "Good",
        "description": "What good work looks like"
      },
      {
        "level": "Satisfactory",
        "description": "What satisfactory work looks like"
      },
      {
        "level": "Needs Improvement",
        "description": "What needs improvement"
      }
    ]
  }
]`,
        },
        {
          role: 'user',
          content: `Create a rubric for this assignment:\n\n${assignmentDescription}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\[[\s\S]*\]/);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return [];
  } catch (error) {
    console.error('Error generating rubric:', error);
    throw new Error('Failed to generate rubric');
  }
}

/**
 * Compare AI grade with teacher grade and provide insights
 * @param {Object} aiGrade - AI grading result
 * @param {number} teacherGrade - Teacher's grade
 * @param {string} submissionId - Submission ID
 * @returns {Promise<Object>} Comparison insights
 */
async function compareGrades(aiGrade, teacherGrade, submissionId) {
  try {
    const difference = Math.abs(aiGrade.totalScore - teacherGrade);
    const percentDifference = (difference / aiGrade.totalScore) * 100;

    const response = await getClient().chat.completions.create({
      model: process.env.OPENAI_API_KEY ? 'gpt-4o' : 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert educator analyzing grading consistency.
Compare the AI grade with the teacher grade and provide insights.

AI Grade: ${aiGrade.totalScore}
Teacher Grade: ${teacherGrade}
Difference: ${difference} points (${percentDifference.toFixed(1)}%)

Provide analysis in JSON format:
{
  "isConsistent": boolean,
  "consistencyScore": 0-100,
  "insights": "Analysis of the difference",
  "possibleReasons": ["reason1", "reason2"],
  "recommendations": "Recommendations for grading consistency"
}`,
        },
        {
          role: 'user',
          content: `AI Grade: ${aiGrade.totalScore}, Teacher Grade: ${teacherGrade}`,
        },
      ],
      temperature: 0.5,
      max_tokens: 1000,
    });

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      isConsistent: Math.abs(percentDifference) < 10,
      consistencyScore: Math.max(0, 100 - percentDifference),
      insights: `Difference of ${difference} points`,
      possibleReasons: [],
      recommendations: '',
    };
  } catch (error) {
    console.error('Error comparing grades:', error);
    throw new Error('Failed to compare grades');
  }
}

/**
 * Generate personalized feedback for student
 * @param {Object} gradingResult - Grading result from gradeSubmission
 * @param {string} studentName - Student's name
 * @returns {Promise<Object>} Personalized feedback
 */
async function generatePersonalizedFeedback(gradingResult, studentName) {
  try {
    const response = await getClient().chat.completions.create({
      model: process.env.OPENAI_API_KEY ? 'gpt-4o' : 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an encouraging educator providing personalized feedback to students.
Create encouraging, constructive feedback that:
1. Acknowledges their effort
2. Highlights specific strengths
3. Identifies areas for improvement
4. Provides actionable next steps
5. Motivates continued learning

Student Name: ${studentName}
Score: ${gradingResult.totalScore}/${gradingResult.rubricScores?.[0]?.maxScore || 100}
Grade: ${gradingResult.grade}

Format as JSON:
{
  "greeting": "Personalized greeting",
  "celebration": "What they did well",
  "strengths": ["strength1", "strength2"],
  "improvements": ["area1", "area2"],
  "actionItems": ["action1", "action2"],
  "encouragement": "Motivational message",
  "nextSteps": "What to focus on next"
}`,
        },
        {
          role: 'user',
          content: `Generate personalized feedback for ${studentName} who scored ${gradingResult.totalScore} points`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      greeting: `Hello ${studentName}!`,
      celebration: '',
      strengths: gradingResult.strengths || [],
      improvements: gradingResult.improvements || [],
      actionItems: [],
      encouragement: 'Keep up the good work!',
      nextSteps: '',
    };
  } catch (error) {
    console.error('Error generating personalized feedback:', error);
    throw new Error('Failed to generate personalized feedback');
  }
}

module.exports = {
  gradeSubmission,
  gradeSubmissionsBatch,
  generateRubric,
  compareGrades,
  generatePersonalizedFeedback,
};



