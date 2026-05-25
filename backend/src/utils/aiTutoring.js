/**
 * AI Tutoring Service
 * Provides personalized tutoring assistance to students
 */

const OpenAI = require('openai');

let _openai = null;
function getClient() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

/**
 * Generate tutoring response for student question
 * @param {string} question - Student's question
 * @param {string} courseTitle - Course title for context
 * @param {string} topic - Topic being studied
 * @param {string} studentLevel - Student's level (beginner, intermediate, advanced)
 * @returns {Promise<Object>} Tutoring response with explanation and examples
 */
async function generateTutoringResponse(question, courseTitle, topic, studentLevel = 'intermediate') {
  try {
    const systemPrompt = `You are an expert tutor helping students understand course material. 
Your role is to:
1. Understand the student's question
2. Provide clear, step-by-step explanations
3. Use examples relevant to the course
4. Adapt complexity to the student's level (${studentLevel})
5. Encourage critical thinking
6. Suggest practice problems

Course: ${courseTitle}
Topic: ${topic}
Student Level: ${studentLevel}

Format your response as JSON with the following structure:
{
  "explanation": "Clear explanation of the concept",
  "keyPoints": ["point1", "point2", "point3"],
  "examples": ["example1", "example2"],
  "practiceProblems": ["problem1", "problem2"],
  "relatedConcepts": ["concept1", "concept2"],
  "tips": "Study tips or memory aids"
}`;

    const response = await getClient().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: question,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const content = response.choices[0].message.content;
    
    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Fallback if JSON parsing fails
    return {
      explanation: content,
      keyPoints: [],
      examples: [],
      practiceProblems: [],
      relatedConcepts: [],
      tips: '',
    };
  } catch (error) {
    console.error('Error generating tutoring response:', error);
    throw new Error('Failed to generate tutoring response');
  }
}

/**
 * Generate practice problems for a topic
 * @param {string} topic - Topic to generate problems for
 * @param {string} difficulty - Difficulty level (easy, medium, hard)
 * @param {number} count - Number of problems to generate
 * @returns {Promise<Array>} Array of practice problems
 */
async function generatePracticeProblems(topic, difficulty = 'medium', count = 5) {
  try {
    const response = await getClient().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert educator creating practice problems for students.
Generate ${count} practice problems for the topic: ${topic}
Difficulty level: ${difficulty}

Format your response as a JSON array with the following structure:
[
  {
    "problem": "Problem statement",
    "hint": "Helpful hint",
    "solution": "Step-by-step solution",
    "explanation": "Why this solution is correct"
  }
]`,
        },
        {
          role: 'user',
          content: `Generate ${count} ${difficulty} practice problems for: ${topic}`,
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
    console.error('Error generating practice problems:', error);
    throw new Error('Failed to generate practice problems');
  }
}

/**
 * Analyze student's answer and provide feedback
 * @param {string} question - Original question
 * @param {string} studentAnswer - Student's answer
 * @param {string} topic - Topic being studied
 * @returns {Promise<Object>} Feedback on student's answer
 */
async function analyzeStudentAnswer(question, studentAnswer, topic) {
  try {
    const response = await getClient().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert tutor analyzing a student's answer.
Provide constructive feedback that:
1. Acknowledges what the student got right
2. Identifies any misconceptions
3. Provides the correct answer if needed
4. Suggests areas for improvement
5. Encourages the student

Topic: ${topic}

Format your response as JSON:
{
  "isCorrect": boolean,
  "correctnessScore": 0-100,
  "strengths": ["strength1", "strength2"],
  "improvements": ["area1", "area2"],
  "correctAnswer": "The correct answer or explanation",
  "feedback": "Encouraging and constructive feedback",
  "nextSteps": "What to study next"
}`,
        },
        {
          role: 'user',
          content: `Question: ${question}\n\nStudent's Answer: ${studentAnswer}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      isCorrect: false,
      correctnessScore: 0,
      strengths: [],
      improvements: [],
      correctAnswer: '',
      feedback: content,
      nextSteps: '',
    };
  } catch (error) {
    console.error('Error analyzing student answer:', error);
    throw new Error('Failed to analyze student answer');
  }
}

/**
 * Generate concept explanation with examples
 * @param {string} concept - Concept to explain
 * @param {string} courseContext - Course context
 * @param {string} studentLevel - Student's level
 * @returns {Promise<Object>} Concept explanation
 */
async function explainConcept(concept, courseContext, studentLevel = 'intermediate') {
  try {
    const response = await getClient().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert tutor explaining concepts to students.
Explain the concept in a way that is:
1. Clear and easy to understand
2. Appropriate for ${studentLevel} level students
3. Relevant to the course: ${courseContext}
4. Includes real-world examples
5. Connects to related concepts

Format your response as JSON:
{
  "definition": "Clear definition of the concept",
  "explanation": "Detailed explanation",
  "realWorldExamples": ["example1", "example2"],
  "commonMisconceptions": ["misconception1", "misconception2"],
  "relatedConcepts": ["concept1", "concept2"],
  "visualDescription": "How to visualize this concept",
  "practiceAdvice": "How to practice this concept"
}`,
        },
        {
          role: 'user',
          content: `Explain the concept: ${concept}`,
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
      definition: '',
      explanation: content,
      realWorldExamples: [],
      commonMisconceptions: [],
      relatedConcepts: [],
      visualDescription: '',
      practiceAdvice: '',
    };
  } catch (error) {
    console.error('Error explaining concept:', error);
    throw new Error('Failed to explain concept');
  }
}

module.exports = {
  generateTutoringResponse,
  generatePracticeProblems,
  analyzeStudentAnswer,
  explainConcept,
};

