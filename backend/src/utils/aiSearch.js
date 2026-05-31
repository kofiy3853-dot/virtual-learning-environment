/**
 * AI-Powered Search Engine
 * Provides semantic search and intelligent search suggestions
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
 * Perform semantic search across course content
 * @param {string} query - Search query
 * @param {Array} courseContent - Course content to search
 * @param {string} searchType - Type of search (courses/materials/discussions/assignments)
 * @returns {Promise<Array>} Search results
 */
async function semanticSearch(query, courseContent, searchType = 'all') {
  try {
    const systemPrompt = `You are an expert search engine for educational content.
Perform semantic search on the provided content and return relevant results.

Format response as JSON array:
[
  {
    "id": "content id",
    "title": "Content title",
    "type": "course/material/discussion/assignment",
    "description": "Content description",
    "relevanceScore": 0-100,
    "matchedKeywords": ["keyword1", "keyword2"],
    "preview": "Content preview",
    "url": "content url",
    "metadata": {
      "author": "author name",
      "date": "date",
      "tags": ["tag1", "tag2"]
    }
  }
]`;

    const response = await getClient().chat.completions.create({
      model: process.env.OPENAI_API_KEY ? 'gpt-4o' : 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `Search for: "${query}"\n\nSearch Type: ${searchType}\n\nContent: ${JSON.stringify(courseContent)}`,
        },
      ],
      temperature: 0.5,
      max_tokens: 2000,
    });

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\[[\s\S]*\]/);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return [];
  } catch (error) {
    console.error('Error performing semantic search:', error);
    throw new Error('Failed to perform semantic search');
  }
}

/**
 * Generate search suggestions based on query
 * @param {string} query - Partial search query
 * @param {Array} searchHistory - User's search history
 * @param {Array} courseContent - Course content
 * @returns {Promise<Array>} Search suggestions
 */
async function generateSearchSuggestions(query, searchHistory = [], courseContent = []) {
  try {
    const response = await getClient().chat.completions.create({
      model: process.env.OPENAI_API_KEY ? 'gpt-4o' : 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert search suggestion engine.
Generate helpful search suggestions based on the partial query and context.

Format response as JSON array:
[
  {
    "suggestion": "suggested search term",
    "type": "popular/related/trending/personalized",
    "description": "why this suggestion is relevant",
    "searchCount": 0,
    "relevance": 0-100
  }
]`,
        },
        {
          role: 'user',
          content: `Generate suggestions for: "${query}"\n\nSearch History: ${JSON.stringify(searchHistory)}\n\nAvailable Content: ${JSON.stringify(courseContent.slice(0, 10))}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\[[\s\S]*\]/);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return [];
  } catch (error) {
    console.error('Error generating search suggestions:', error);
    throw new Error('Failed to generate search suggestions');
  }
}

/**
 * Analyze search query and extract intent
 * @param {string} query - Search query
 * @returns {Promise<Object>} Query analysis with intent
 */
async function analyzeSearchQuery(query) {
  try {
    const response = await getClient().chat.completions.create({
      model: process.env.OPENAI_API_KEY ? 'gpt-4o' : 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert in natural language processing and search intent analysis.
Analyze the search query and extract the user's intent.

Format response as JSON:
{
  "originalQuery": "original query",
  "normalizedQuery": "normalized query",
  "intent": "search/question/navigation/research",
  "keywords": ["keyword1", "keyword2"],
  "entities": ["entity1", "entity2"],
  "suggestedFilters": {
    "type": ["type1", "type2"],
    "difficulty": "beginner/intermediate/advanced",
    "dateRange": "recent/all-time"
  },
  "relatedTopics": ["topic1", "topic2"],
  "confidence": 0-100
}`,
        },
        {
          role: 'user',
          content: `Analyze this search query: "${query}"`,
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
      originalQuery: query,
      normalizedQuery: query,
      intent: 'search',
      keywords: [],
      entities: [],
      suggestedFilters: {},
      relatedTopics: [],
      confidence: 0,
    };
  } catch (error) {
    console.error('Error analyzing search query:', error);
    throw new Error('Failed to analyze search query');
  }
}

/**
 * Perform advanced search with filters
 * @param {string} query - Search query
 * @param {Object} filters - Search filters
 * @param {Array} courseContent - Course content
 * @returns {Promise<Array>} Filtered search results
 */
async function advancedSearch(query, filters = {}, courseContent = []) {
  try {
    const systemPrompt = `You are an expert search engine for educational content.
Perform advanced search with filters on the provided content.

Format response as JSON array:
[
  {
    "id": "content id",
    "title": "Content title",
    "type": "course/material/discussion/assignment",
    "description": "Content description",
    "relevanceScore": 0-100,
    "matchedFilters": ["filter1", "filter2"],
    "preview": "Content preview",
    "url": "content url",
    "metadata": {
      "author": "author name",
      "date": "date",
      "difficulty": "beginner/intermediate/advanced",
      "tags": ["tag1", "tag2"]
    }
  }
]`;

    const filterString = Object.entries(filters)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join(', ');

    const response = await getClient().chat.completions.create({
      model: process.env.OPENAI_API_KEY ? 'gpt-4o' : 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `Search for: "${query}"\n\nFilters: ${filterString}\n\nContent: ${JSON.stringify(courseContent)}`,
        },
      ],
      temperature: 0.5,
      max_tokens: 2000,
    });

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\[[\s\S]*\]/);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return [];
  } catch (error) {
    console.error('Error performing advanced search:', error);
    throw new Error('Failed to perform advanced search');
  }
}

/**
 * Get trending search topics
 * @param {Array} searchHistory - Search history data
 * @param {string} timeRange - Time range (day/week/month)
 * @returns {Promise<Array>} Trending topics
 */
async function getTrendingTopics(searchHistory = [], timeRange = 'week') {
  try {
    const response = await getClient().chat.completions.create({
      model: process.env.OPENAI_API_KEY ? 'gpt-4o' : 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert in analyzing search trends.
Identify trending topics from search history.

Format response as JSON array:
[
  {
    "topic": "topic name",
    "searchCount": 0,
    "trend": "rising/stable/declining",
    "relatedTopics": ["topic1", "topic2"],
    "description": "topic description",
    "relevance": 0-100
  }
]`,
        },
        {
          role: 'user',
          content: `Analyze trending topics from this search history (${timeRange}):\n\n${JSON.stringify(searchHistory)}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\[[\s\S]*\]/);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return [];
  } catch (error) {
    console.error('Error getting trending topics:', error);
    throw new Error('Failed to get trending topics');
  }
}

module.exports = {
  semanticSearch,
  generateSearchSuggestions,
  analyzeSearchQuery,
  advancedSearch,
  getTrendingTopics,
};



