# NVIDIA API Integration - Virtual Learning Environment

## Overview

NVIDIA API integration has been added to the Virtual Learning Environment, enabling support for advanced reasoning models like DeepSeek-v4-Flash. This provides an alternative to OpenAI and OpenRouter for AI-powered features.

## What's Been Added

### 1. NVIDIA API Support in aiHelper.js
- Added NVIDIA API client initialization with proper baseURL
- Integrated into the AI provider priority chain:
  1. OpenAI (if `OPENAI_API_KEY` is set)
  2. NVIDIA (if `NVIDIA_API_KEY` is set)
  3. OpenRouter (if `OPENROUTER_API_KEY` is set)

### 2. Model Selection
- Automatically selects the appropriate model based on available API keys:
  - OpenAI: `gpt-4o`
  - NVIDIA: `deepseek-ai/deepseek-v4-flash`
  - OpenRouter: `openai/gpt-4o-mini`

### 3. Environment Configuration
- Added `NVIDIA_API_KEY` to `.env` file
- Updated `.env.example` with NVIDIA API documentation
- Documented the priority order of AI providers

## How to Use

### Step 1: Get NVIDIA API Key
1. Visit [build.nvidia.com](https://build.nvidia.com/)
2. Sign up or log in
3. Navigate to API keys section
4. Create a new API key
5. Copy the key (starts with `nvapi-`)

### Step 2: Add to Environment
1. Open `backend/.env`
2. Find the line: `NVIDIA_API_KEY=your_nvidia_api_key_here`
3. Replace with your actual API key:
   ```
   NVIDIA_API_KEY=nvapi-your-actual-key-here
   ```

### Step 3: Restart Backend
```bash
npm run dev
```

The backend will now use NVIDIA API for AI features if OpenAI is not configured.

## Features Using NVIDIA API

All AI features now support NVIDIA API:
- ✅ Generate course outlines
- ✅ Generate quiz questions
- ✅ Generate assignment prompts
- ✅ Generate lecture notes
- ✅ Generate student feedback
- ✅ Generate course syllabi

## API Priority

The system checks for API keys in this order:

```
1. OPENAI_API_KEY
   ↓ (if not set)
2. NVIDIA_API_KEY
   ↓ (if not set)
3. OPENROUTER_API_KEY
   ↓ (if not set)
4. Error: No AI API key set
```

This means:
- If you have OpenAI key, it will be used (highest priority)
- If you only have NVIDIA key, it will be used
- If you only have OpenRouter key, it will be used
- If none are set, the app will throw an error

## Configuration Files

### backend/.env
```
# NVIDIA API (for advanced reasoning models like DeepSeek)
NVIDIA_API_KEY=your_nvidia_api_key_here
```

### backend/.env.example
```
# AI Configuration (use one or more — OpenAI takes priority, then NVIDIA, then OpenRouter)
# OpenAI key: https://platform.openai.com/api-keys
OPENAI_API_KEY=your_openai_api_key_here
# NVIDIA API key (for advanced reasoning models like DeepSeek): https://build.nvidia.com/
NVIDIA_API_KEY=your_nvidia_api_key_here
# OpenRouter key (cheaper alternative): https://openrouter.ai/keys
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

## Code Changes

### backend/src/utils/aiHelper.js

**Added:**
- NVIDIA API client initialization in `getClient()`
- `getModel()` function to select appropriate model
- NVIDIA support in error messages

**Updated:**
- All AI functions now use `getModel()` instead of hardcoded model selection
- Error messages include NVIDIA_API_KEY as an option

**Example:**
```javascript
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
      // ... OpenRouter config
    }
  }
  return _openai;
}

function getModel() {
  if (process.env.OPENAI_API_KEY) {
    return 'gpt-4o';
  } else if (process.env.NVIDIA_API_KEY) {
    return 'deepseek-ai/deepseek-v4-flash';
  } else {
    return 'openai/gpt-4o-mini';
  }
}
```

## Security Notes

### ⚠️ IMPORTANT: Never Expose API Keys

1. **Never commit API keys to code**
   - Use environment variables only
   - Add `.env` to `.gitignore`

2. **Never share API keys in chat or documentation**
   - If exposed, revoke immediately
   - Generate new key

3. **Use environment variables in production**
   - Set `NVIDIA_API_KEY` in deployment platform (Render, Heroku, etc.)
   - Never hardcode keys

### If Your Key Was Exposed

1. Go to [build.nvidia.com](https://build.nvidia.com/)
2. Revoke the exposed key immediately
3. Generate a new key
4. Update `.env` with new key
5. Restart the application

## Testing

### Test NVIDIA API Integration

```bash
# 1. Ensure NVIDIA_API_KEY is set in .env
# 2. Comment out OPENAI_API_KEY and OPENROUTER_API_KEY
# 3. Start the backend
npm run dev

# 4. Test an AI endpoint
curl -X POST http://localhost:5000/api/ai/quiz-questions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "topic": "Machine Learning",
    "difficulty": "medium",
    "count": 3
  }'
```

## Troubleshooting

### Error: "No AI API key set"
- Ensure `NVIDIA_API_KEY` is set in `.env`
- Verify the key format (should start with `nvapi-`)
- Restart the backend after adding the key

### Error: "Invalid API key"
- Verify the key is correct
- Check for extra spaces or characters
- Ensure the key hasn't been revoked

### Error: "Model not found"
- Verify NVIDIA API supports the model `deepseek-ai/deepseek-v4-flash`
- Check NVIDIA API documentation for available models

### Slow responses
- NVIDIA API may have rate limiting
- Consider using OpenAI for faster responses
- Check NVIDIA API status page

## Performance Comparison

| Provider | Model | Speed | Cost | Quality |
|----------|-------|-------|------|---------|
| OpenAI | gpt-4o | Fast | High | Excellent |
| NVIDIA | deepseek-v4-flash | Medium | Low | Very Good |
| OpenRouter | gpt-4o-mini | Fast | Low | Good |

## Deployment

### Render Deployment

1. Go to Render dashboard
2. Select backend service
3. Go to "Environment"
4. Add environment variable:
   ```
   NVIDIA_API_KEY=your_nvidia_api_key_here
   ```
5. Save and redeploy

### Other Platforms

Set `NVIDIA_API_KEY` environment variable in your deployment platform:
- Heroku: `heroku config:set NVIDIA_API_KEY=...`
- AWS: Set in Lambda environment variables
- Docker: Set in docker-compose.yml or Dockerfile
- Vercel: Set in project settings

## Documentation

- NVIDIA API Docs: https://build.nvidia.com/
- OpenAI Docs: https://platform.openai.com/docs
- OpenRouter Docs: https://openrouter.ai/docs

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify API key is correct
3. Check NVIDIA API status
4. Review backend logs for error messages
5. Ensure backend is restarted after adding key

## Summary

NVIDIA API integration is now fully functional in the Virtual Learning Environment. The system automatically selects the best available AI provider based on configured API keys, with NVIDIA as a cost-effective alternative to OpenAI.

**Next Steps:**
1. Get NVIDIA API key from build.nvidia.com
2. Add to `backend/.env`
3. Restart backend
4. Test AI features

---

**Status**: ✅ NVIDIA API Integration Complete
**Last Updated**: May 27, 2026
