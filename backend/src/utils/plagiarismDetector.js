/**
 * Plagiarism Detection Service
 * Detects plagiarism and academic dishonesty in student submissions
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
 * Check submission for plagiarism
 * @param {string} submissionContent - Student's submission content
 * @param {string} submissionId - Submission ID for tracking
 * @param {Array} previousSubmissions - Array of previous submissions for comparison
 * @returns {Promise<Object>} Plagiarism detection result
 */
async function checkPlagiarism(submissionContent, submissionId, previousSubmissions = []) {
  try {
    const systemPrompt = `You are an expert plagiarism detection system.
Analyze the submission for signs of plagiarism including:
1. Direct copying from sources
2. Paraphrasing without attribution
3. Structural similarity to other submissions
4. Unusual writing patterns or inconsistencies
5. Suspicious phrases or terminology

Provide a detailed plagiarism report in JSON format:
{
  "similarityScore": 0-100,
  "plagiarismRisk": "low/medium/high/critical",
  "suspiciousSegments": [
    {
      "text": "suspicious text segment",
      "similarity": 0-100,
      "reason": "why this is suspicious"
    }
  ],
  "writingPatternAnalysis": {
    "consistency": "consistent/inconsistent",
    "vocabulary": "appropriate/unusual",
    "complexity": "appropriate/too_high/too_low"
  },
  "potentialSources": ["possible source 1", "possible source 2"],
  "recommendations": "Recommendations for further investigation",
  "flaggedForReview": boolean
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
          content: `Please analyze this submission for plagiarism:\n\n${submissionContent}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        ...result,
        submissionId,
        checkedAt: new Date(),
      };
    }

    return {
      similarityScore: 0,
      plagiarismRisk: 'unknown',
      suspiciousSegments: [],
      writingPatternAnalysis: {},
      potentialSources: [],
      recommendations: content,
      flaggedForReview: false,
      submissionId,
      checkedAt: new Date(),
    };
  } catch (error) {
    console.error('Error checking plagiarism:', error);
    throw new Error('Failed to check plagiarism');
  }
}

/**
 * Compare submission with previous submissions
 * @param {string} submissionContent - Current submission
 * @param {Array} previousSubmissions - Previous submissions to compare
 * @returns {Promise<Object>} Comparison results
 */
async function compareWithPreviousSubmissions(submissionContent, previousSubmissions) {
  try {
    const previousTexts = previousSubmissions
      .map((s, i) => `Submission ${i + 1}:\n${s.content}`)
      .join('\n\n---\n\n');

    const response = await getClient().chat.completions.create({
      model: process.env.OPENAI_API_KEY ? 'gpt-4o' : 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert at detecting similarities between submissions.
Compare the current submission with previous submissions and identify:
1. Exact matches
2. Paraphrased content
3. Structural similarities
4. Suspicious patterns

Provide results in JSON format:
{
  "matches": [
    {
      "submissionIndex": number,
      "similarity": 0-100,
      "matchedText": "text that matches",
      "type": "exact/paraphrased/structural"
    }
  ],
  "overallSimilarity": 0-100,
  "suspiciousIndicators": ["indicator1", "indicator2"],
  "recommendation": "Recommendation for instructor"
}`,
        },
        {
          role: 'user',
          content: `Current submission:\n${submissionContent}\n\nPrevious submissions:\n${previousTexts}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      matches: [],
      overallSimilarity: 0,
      suspiciousIndicators: [],
      recommendation: content,
    };
  } catch (error) {
    console.error('Error comparing submissions:', error);
    throw new Error('Failed to compare submissions');
  }
}

/**
 * Analyze writing patterns for consistency
 * @param {string} submissionContent - Submission to analyze
 * @param {Array} previousSubmissions - Previous submissions from same student
 * @returns {Promise<Object>} Writing pattern analysis
 */
async function analyzeWritingPatterns(submissionContent, previousSubmissions = []) {
  try {
    const previousTexts = previousSubmissions
      .map((s, i) => `Previous submission ${i + 1}:\n${s}`)
      .join('\n\n---\n\n');

    const response = await getClient().chat.completions.create({
      model: process.env.OPENAI_API_KEY ? 'gpt-4o' : 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert in analyzing writing patterns and style.
Analyze the writing patterns and compare with previous submissions.
Look for:
1. Vocabulary consistency
2. Sentence structure patterns
3. Grammar and punctuation style
4. Tone and voice consistency
5. Unusual deviations

Provide analysis in JSON format:
{
  "vocabularyLevel": "basic/intermediate/advanced",
  "sentenceComplexity": "simple/moderate/complex",
  "toneConsistency": 0-100,
  "styleConsistency": 0-100,
  "unusualPatterns": ["pattern1", "pattern2"],
  "deviations": ["deviation1", "deviation2"],
  "overallConsistency": 0-100,
  "suspiciousIndicators": ["indicator1", "indicator2"],
  "assessment": "Assessment of writing authenticity"
}`,
        },
        {
          role: 'user',
          content: `Current submission:\n${submissionContent}\n\nPrevious submissions:\n${previousTexts}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      vocabularyLevel: 'unknown',
      sentenceComplexity: 'unknown',
      toneConsistency: 0,
      styleConsistency: 0,
      unusualPatterns: [],
      deviations: [],
      overallConsistency: 0,
      suspiciousIndicators: [],
      assessment: content,
    };
  } catch (error) {
    console.error('Error analyzing writing patterns:', error);
    throw new Error('Failed to analyze writing patterns');
  }
}

/**
 * Generate plagiarism report
 * @param {Object} plagiarismResult - Result from checkPlagiarism
 * @param {Object} writingAnalysis - Result from analyzeWritingPatterns
 * @param {Object} comparisonResult - Result from compareWithPreviousSubmissions
 * @returns {Promise<Object>} Comprehensive plagiarism report
 */
async function generatePlagiarismReport(plagiarismResult, writingAnalysis, comparisonResult) {
  try {
    const response = await getClient().chat.completions.create({
      model: process.env.OPENAI_API_KEY ? 'gpt-4o' : 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert in generating plagiarism reports for academic institutions.
Create a comprehensive plagiarism report based on the analysis results.
Include:
1. Executive summary
2. Detailed findings
3. Risk assessment
4. Recommendations for action
5. Next steps

Format as JSON:
{
  "executiveSummary": "Brief summary of findings",
  "riskLevel": "low/medium/high/critical",
  "detailedFindings": "Detailed analysis",
  "recommendations": ["recommendation1", "recommendation2"],
  "nextSteps": ["step1", "step2"],
  "requiresInvestigation": boolean,
  "suggestedActions": ["action1", "action2"]
}`,
        },
        {
          role: 'user',
          content: `Plagiarism Analysis: ${JSON.stringify(plagiarismResult)}\n\nWriting Analysis: ${JSON.stringify(writingAnalysis)}\n\nComparison: ${JSON.stringify(comparisonResult)}`,
        },
      ],
      temperature: 0.5,
      max_tokens: 1500,
    });

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      executiveSummary: content,
      riskLevel: 'unknown',
      detailedFindings: '',
      recommendations: [],
      nextSteps: [],
      requiresInvestigation: false,
      suggestedActions: [],
    };
  } catch (error) {
    console.error('Error generating plagiarism report:', error);
    throw new Error('Failed to generate plagiarism report');
  }
}

/**
 * Batch check multiple submissions for plagiarism
 * @param {Array} submissions - Array of submissions to check
 * @returns {Promise<Array>} Array of plagiarism results
 */
async function batchCheckPlagiarism(submissions) {
  try {
    const results = [];

    for (const submission of submissions) {
      const result = await checkPlagiarism(
        submission.content,
        submission._id,
        []
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
    console.error('Error batch checking plagiarism:', error);
    throw new Error('Failed to batch check plagiarism');
  }
}

module.exports = {
  checkPlagiarism,
  compareWithPreviousSubmissions,
  analyzeWritingPatterns,
  generatePlagiarismReport,
  batchCheckPlagiarism,
};



