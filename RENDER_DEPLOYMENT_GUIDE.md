# Render Deployment Guide

## Current Issue
The deployment is failing with `Error: connect ECONNREFUSED 127.0.0.1:27017` because the MongoDB connection string is not configured on Render.

## Solution: Configure Environment Variables on Render

### Step 1: Get Your MongoDB Atlas Connection String
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Log in to your account
3. Navigate to your cluster
4. Click "Connect"
5. Choose "Drivers" → "Node.js"
6. Copy the connection string (it looks like: `mongodb+srv://username:password@cluster.mongodb.net/database-name`)

### Step 2: Add Environment Variables to Render
1. Go to your Render service dashboard
2. Click on your backend service
3. Go to **Environment** tab
4. Add the following environment variables:

```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/virtual-learning-environment
NODE_ENV=production
PORT=5000
CLIENT_URL=https://your-frontend-url.onrender.com
JWT_SECRET=your_secure_jwt_secret_here
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
OPENAI_API_KEY=your_openai_api_key_here
ADMIN_PASSWORD=your_secure_admin_password
LOG_LEVEL=info
```

### Step 3: Redeploy
1. After adding environment variables, click "Manual Deploy" or push a new commit to trigger deployment
2. Monitor the deployment logs to ensure MongoDB connects successfully

## Important Notes

### MongoDB Atlas IP Whitelist
- Add Render's IP range to MongoDB Atlas IP whitelist
- Or use "Allow access from anywhere" (0.0.0.0/0) for development (not recommended for production)

### CORS Configuration
- Update `CLIENT_URL` to match your frontend URL on Render
- The backend uses this for CORS headers

### Database Connection Fallback
The app currently falls back to `mongodb://127.0.0.1:27017/lms` if `MONGO_URI` is not set. This is why it's trying to connect to localhost on Render.

## Deployment Checklist

- [ ] MongoDB Atlas cluster created and connection string obtained
- [ ] `MONGO_URI` environment variable set on Render
- [ ] `CLIENT_URL` set to your frontend Render URL
- [ ] `JWT_SECRET` set to a secure random string
- [ ] `CLOUDINARY_*` variables configured (if using file uploads)
- [ ] `OPENAI_API_KEY` configured (if using AI features)
- [ ] MongoDB IP whitelist updated to allow Render
- [ ] Manual deploy triggered after environment variables added
- [ ] Logs show successful MongoDB connection

## Troubleshooting

### Still getting ECONNREFUSED?
1. Verify `MONGO_URI` is set in Render environment variables
2. Check MongoDB Atlas IP whitelist includes Render's IP
3. Verify connection string format is correct
4. Check MongoDB Atlas cluster is running

### 403 Errors on AI Routes?
- Ensure user has proper role (teacher/admin)
- Check authorization middleware in `backend/src/middleware/auth.js`

### CORS Errors?
- Verify `CLIENT_URL` matches your frontend URL exactly
- Check `frontend/utils/api/axiosInstance.ts` for correct API base URL

## Frontend Deployment (Vercel/Render)

If deploying frontend to Render:
1. Set `NEXT_PUBLIC_API_URL` to your backend Render URL
2. Example: `https://your-backend.onrender.com`

If deploying frontend to Vercel:
1. Set `NEXT_PUBLIC_API_URL` environment variable
2. Example: `https://your-backend.onrender.com`
