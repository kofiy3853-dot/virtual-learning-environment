const OpenAI = require('openai');

// Lazy client — instantiated on first use so missing key doesn't crash startup
let _openai = null;
function getClient() {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not set in environment');
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

/**
 * Safely parse JSON from AI response — handles markdown code fences
 */
function parseJSON(content) {
  // Strip markdown code fences if present
  const cleaned = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  return JSON.parse(cleaned);
}

/**
 * Generate course outline using AI
 */
async function generateCourseOutline(courseTitle, courseDescription, duration) {
  try {
    const response = await getClient().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an expert course designer. Generate detailed, structured course outlines. Always respond with valid JSON only, no markdown.' },
        { role: 'user', content: `Create a detailed course outline for:\nTitle: ${courseTitle}\nDescription: ${courseDescription}\nDuration: ${duration} weeks\n\nFormat as JSON:\n{\n  "modules": [{"week": number, "title": string, "topics": [string], "learningOutcomes": [string], "activities": [string]}],\n  "assessments": [string],\n  "resources": [string]\n}` }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });
    return parseJSON(response.choices[0].message.content);
  } catch (error) {
    console.error('Error generating course outline:', error.message);
    throw new Error('Failed to generate course outline');
  }
}

/**
 * Generate quiz questions using AI
 */
async function generateQuizQuestions(topic, difficulty = 'medium', count = 5) {
  try {
    const response = await getClient().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an expert educator. Generate high-quality quiz questions. Always respond with valid JSON only, no markdown.' },
        { role: 'user', content: `Generate ${count} ${difficulty} quiz questions about: ${topic}\n\nFormat as JSON:\n{\n  "questions": [\n    {\n      "question": string,\n      "type": "multiple_choice",\n      "options": [string, string, string, string],\n      "correctAnswer": number (0-3 index),\n      "explanation": string,\n      "difficulty": "${difficulty}"\n    }\n  ]\n}` }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });
    return parseJSON(response.choices[0].message.content);
  } catch (error) {
    console.error('Error generating quiz questions:', error.message);
    throw new Error('Failed to generate quiz questions');
  }
}

/**
 * Generate assignment prompt using AI
 */
async function generateAssignmentPrompt(topic, learningOutcomes, difficulty = 'medium') {
  try {
    const response = await getClient().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an expert course designer. Create engaging assignment prompts. Always respond with valid JSON only, no markdown.' },
        { role: 'user', content: `Create an assignment prompt for:\nTopic: ${topic}\nLearning Outcomes: ${learningOutcomes.join(', ')}\nDifficulty: ${difficulty}\n\nFormat as JSON:\n{\n  "title": string,\n  "description": string,\n  "objectives": [string],\n  "requirements": [string],\n  "rubric": {"criteria": [{"name": string, "description": string, "points": number}], "totalPoints": number},\n  "dueDate": "2 weeks",\n  "resources": [string]\n}` }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });
    return parseJSON(response.choices[0].message.content);
  } catch (error) {
    console.error('Error generating assignment:', error.message);
    throw new Error('Failed to generate assignment');
  }
}

/**
 * Generate lecture notes using AI
 */
async function generateLectureNotes(topic, subtopics = []) {
  try {
    const response = await getClient().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an expert educator. Create comprehensive, well-structured lecture notes.' },
        { role: 'user', content: `Create detailed lecture notes for:\nTopic: ${topic}\n${subtopics.length > 0 ? `Subtopics: ${subtopics.join(', ')}` : ''}\n\nInclude clear headings, key concepts, examples, summary points, discussion questions, and further reading.` }
      ],
      temperature: 0.7,
      max_tokens: 3000
    });
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating lecture notes:', error.message);
    throw new Error('Failed to generate lecture notes');
  }
}

/**
 * Generate student feedback using AI
 */
async function generateStudentFeedback(submissionContent, rubricCriteria, score) {
  try {
    const response = await getClient().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an expert educator providing constructive feedback. Always respond with valid JSON only, no markdown.' },
        { role: 'user', content: `Provide feedback for a student submission:\nSubmission: ${String(submissionContent).substring(0, 500)}\nRubric: ${rubricCriteria}\nScore: ${score}/100\n\nFormat as JSON:\n{\n  "strengths": [string],\n  "areasForImprovement": [string],\n  "suggestions": [string],\n  "encouragement": string,\n  "nextSteps": [string]\n}` }
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: 'json_object' }
    });
    return parseJSON(response.choices[0].message.content);
  } catch (error) {
    console.error('Error generating feedback:', error.message);
    throw new Error('Failed to generate feedback');
  }
}

/**
 * Generate complete syllabus using AI
 */
async function generateSyllabus(courseInfo) {
  try {
    const response = await getClient().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an expert course designer. Create comprehensive, professional course syllabi.' },
        { role: 'user', content: `Create a complete course syllabus for:\nCourse Title: ${courseInfo.title}\nCourse Code: ${courseInfo.code}\nInstructor: ${courseInfo.instructor}\nDuration: ${courseInfo.duration} weeks\nLevel: ${courseInfo.level}\nDescription: ${courseInfo.description}\n\nInclude course overview, objectives, learning outcomes, grading, weekly schedule, policies, and academic integrity statement. Format as professional markdown.` }
      ],
      temperature: 0.7,
      max_tokens: 3000
    });
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating syllabus:', error.message);
    throw new Error('Failed to generate syllabus');
  }
}

module.exports = {
  generateCourseOutline,
  generateQuizQuestions,
  generateAssignmentPrompt,
  generateLectureNotes,
  generateStudentFeedback,
  generateSyllabus
};

