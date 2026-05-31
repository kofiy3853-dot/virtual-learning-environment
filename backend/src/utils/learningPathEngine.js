/**
 * Learning Path Engine
 * Generates personalized learning paths based on student performance
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
 * Analyze student performance and identify knowledge gaps
 * @param {Object} studentData - Student performance data
 * @param {Array} courseContent - Course content structure
 * @returns {Promise<Object>} Performance analysis with knowledge gaps
 */
async function analyzeStudentPerformance(studentData, courseContent) {
  try {
    const systemPrompt = `You are an expert educational analyst.
Analyze the student's performance data and identify knowledge gaps.
Provide analysis in JSON format:
{
  "overallPerformance": 0-100,
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "knowledgeGaps": [
    {
      "topic": "topic name",
      "gapLevel": 0-100,
      "reason": "why this gap exists",
      "impact": "impact on learning"
    }
  ],
  "learningStyle": "visual/auditory/kinesthetic/reading-writing",
  "recommendedPace": "slow/moderate/fast",
  "estimatedTimeToMastery": "number of hours",
  "priorityAreas": ["area1", "area2"]
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
          content: `Analyze this student's performance:\n\nStudent Data: ${JSON.stringify(studentData)}\n\nCourse Content: ${JSON.stringify(courseContent)}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      overallPerformance: 0,
      strengths: [],
      weaknesses: [],
      knowledgeGaps: [],
      learningStyle: 'unknown',
      recommendedPace: 'moderate',
      estimatedTimeToMastery: 0,
      priorityAreas: [],
    };
  } catch (error) {
    console.error('Error analyzing student performance:', error);
    throw new Error('Failed to analyze student performance');
  }
}

/**
 * Generate personalized learning path
 * @param {string} studentId - Student ID
 * @param {Object} performanceAnalysis - Performance analysis result
 * @param {Array} availableResources - Available learning resources
 * @returns {Promise<Object>} Personalized learning path
 */
async function generateLearningPath(studentId, performanceAnalysis, availableResources) {
  try {
    const systemPrompt = `You are an expert curriculum designer.
Create a personalized learning path based on the student's performance analysis.
The path should be adaptive and focus on knowledge gaps.

Format response as JSON:
{
  "pathName": "Path name",
  "description": "Path description",
  "duration": "estimated duration",
  "modules": [
    {
      "moduleId": "unique id",
      "title": "Module title",
      "description": "Module description",
      "duration": "hours",
      "difficulty": "beginner/intermediate/advanced",
      "resources": ["resource1", "resource2"],
      "objectives": ["objective1", "objective2"],
      "assessments": ["assessment1", "assessment2"],
      "prerequisites": ["prerequisite1"],
      "estimatedCompletion": "date"
    }
  ],
  "milestones": [
    {
      "name": "Milestone name",
      "description": "Description",
      "targetDate": "date",
      "successCriteria": ["criteria1", "criteria2"]
    }
  ],
  "adaptiveStrategies": ["strategy1", "strategy2"],
  "supportResources": ["resource1", "resource2"],
  "checkpoints": ["checkpoint1", "checkpoint2"]
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
          content: `Create a learning path for this student:\n\nPerformance Analysis: ${JSON.stringify(performanceAnalysis)}\n\nAvailable Resources: ${JSON.stringify(availableResources)}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2500,
    });

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const path = JSON.parse(jsonMatch[0]);
      return {
        ...path,
        studentId,
        createdAt: new Date(),
        lastUpdated: new Date(),
      };
    }

    return {
      pathName: 'Default Learning Path',
      description: 'Default path',
      duration: '0',
      modules: [],
      milestones: [],
      adaptiveStrategies: [],
      supportResources: [],
      checkpoints: [],
      studentId,
      createdAt: new Date(),
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error('Error generating learning path:', error);
    throw new Error('Failed to generate learning path');
  }
}

/**
 * Get recommended resources for a topic
 * @param {string} topic - Topic to get resources for
 * @param {string} learningStyle - Student's learning style
 * @param {string} difficultyLevel - Difficulty level
 * @returns {Promise<Array>} Recommended resources
 */
async function getRecommendedResources(topic, learningStyle, difficultyLevel) {
  try {
    const response = await getClient().chat.completions.create({
      model: process.env.OPENAI_API_KEY ? 'gpt-4o' : 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert in educational resources.
Recommend learning resources for the given topic, learning style, and difficulty level.

Format response as JSON array:
[
  {
    "title": "Resource title",
    "type": "video/article/interactive/book/podcast",
    "description": "Resource description",
    "duration": "estimated duration",
    "difficulty": "beginner/intermediate/advanced",
    "url": "resource url or identifier",
    "rating": 0-5,
    "relevance": 0-100,
    "suitableFor": ["learning style1", "learning style2"]
  }
]`,
        },
        {
          role: 'user',
          content: `Recommend resources for:\nTopic: ${topic}\nLearning Style: ${learningStyle}\nDifficulty: ${difficultyLevel}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\[[\s\S]*\]/);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return [];
  } catch (error) {
    console.error('Error getting recommended resources:', error);
    throw new Error('Failed to get recommended resources');
  }
}

/**
 * Update learning path based on progress
 * @param {Object} currentPath - Current learning path
 * @param {Object} progressData - Student progress data
 * @returns {Promise<Object>} Updated learning path
 */
async function updateLearningPath(currentPath, progressData) {
  try {
    const response = await getClient().chat.completions.create({
      model: process.env.OPENAI_API_KEY ? 'gpt-4o' : 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert in adaptive learning.
Update the learning path based on the student's progress.
Adjust difficulty, pacing, and resources as needed.

Format response as JSON:
{
  "adjustments": ["adjustment1", "adjustment2"],
  "nextSteps": ["step1", "step2"],
  "acceleratedModules": ["module1"],
  "reviewModules": ["module1"],
  "newResources": ["resource1", "resource2"],
  "estimatedCompletion": "new estimated date",
  "motivationalMessage": "Encouraging message",
  "recommendations": "Specific recommendations"
}`,
        },
        {
          role: 'user',
          content: `Update this learning path:\n\nCurrent Path: ${JSON.stringify(currentPath)}\n\nProgress Data: ${JSON.stringify(progressData)}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const updates = JSON.parse(jsonMatch[0]);
      return {
        ...currentPath,
        ...updates,
        lastUpdated: new Date(),
      };
    }

    return currentPath;
  } catch (error) {
    console.error('Error updating learning path:', error);
    throw new Error('Failed to update learning path');
  }
}

/**
 * Generate learning recommendations
 * @param {Object} studentData - Student data
 * @param {Object} performanceAnalysis - Performance analysis
 * @returns {Promise<Object>} Learning recommendations
 */
async function generateLearningRecommendations(studentData, performanceAnalysis) {
  try {
    const response = await getClient().chat.completions.create({
      model: process.env.OPENAI_API_KEY ? 'gpt-4o' : 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert learning coach.
Generate personalized learning recommendations based on student data and performance.

Format response as JSON:
{
  "immediateActions": ["action1", "action2"],
  "shortTermGoals": ["goal1", "goal2"],
  "longTermGoals": ["goal1", "goal2"],
  "studyTips": ["tip1", "tip2"],
  "resourceRecommendations": ["resource1", "resource2"],
  "motivationalInsights": "Insights to motivate the student",
  "timeManagement": "Time management advice",
  "supportNeeded": ["support1", "support2"]
}`,
        },
        {
          role: 'user',
          content: `Generate recommendations for this student:\n\nStudent Data: ${JSON.stringify(studentData)}\n\nPerformance Analysis: ${JSON.stringify(performanceAnalysis)}`,
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
      immediateActions: [],
      shortTermGoals: [],
      longTermGoals: [],
      studyTips: [],
      resourceRecommendations: [],
      motivationalInsights: '',
      timeManagement: '',
      supportNeeded: [],
    };
  } catch (error) {
    console.error('Error generating learning recommendations:', error);
    throw new Error('Failed to generate learning recommendations');
  }
}

module.exports = {
  analyzeStudentPerformance,
  generateLearningPath,
  getRecommendedResources,
  updateLearningPath,
  generateLearningRecommendations,
};



