# Complete Deployment Checklist for Render

## Pre-Deployment: Local Testing

- [ ] Run `npm install` in both `backend/` and `frontend/` directories
- [ ] Create `.env` file in `backend/` with all required variables
- [ ] Test backend locally: `npm run dev` (should connect to MongoDB)
- [ ] Test frontend locally: `npm run dev` (should connect to backend)
- [ ] Run tests: `npm test` in backend
- [ ] Verify no console errors or warnings

## Backend Deployment (Render)

### 1. Create Render Service
- [ ] Go to [Render Dashboard](https://dashboard.render.com)
- [ ] Click "New +" → "Web Service"
- [ ] Connect your GitHub repository
- [ ] Select the repository and branch (main)

### 2. Configure Backend Service
- [ ] **Name**: `virtual-learning-environment-backend` (or your choice)
- [ ] **Environment**: Node
- [ ] **Build Command**: `npm install`
- [ ] **Start Command**: `npm start`
- [ ] **Plan**: Free tier (for testing) or Starter (for production)

### 3. Set Environment Variables
Add these in the Render dashboard under "Environment":

```
MONGO_URI=mongodb+srv://[username]:[password]@[cluster].mongodb.net/virtual-learning-environment
NODE_ENV=production
PORT=5000
CLIENT_URL=https://your-frontend-url.onrender.com
JWT_SECRET=[generate-a-secure-random-string]
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=[your-cloudinary-cloud-name]
CLOUDINARY_API_KEY=[your-cloudinary-api-key]
CLOUDINARY_API_SECRET=[your-cloudinary-api-secret]
OPENAI_API_KEY=[your-openai-api-key]
ADMIN_PASSWORD=[secure-admin-password]
LOG_LEVEL=info
```

### 4. MongoDB Atlas Setup
- [ ] Create MongoDB Atlas account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
- [ ] Create a free cluster
- [ ] Create a database user with username and password
- [ ] Get connection string from "Connect" → "Drivers"
- [ ] Add Render IP to IP Whitelist (or use 0.0.0.0/0 for development)
- [ ] Update `MONGO_URI` in Render environment variables

### 5. Deploy Backend
- [ ] Click "Create Web Service"
- [ ] Monitor deployment logs
- [ ] Verify: "✅ MongoDB Connected" appears in logs
- [ ] Note the backend URL (e.g., `https://your-backend.onrender.com`)

## Frontend Deployment (Render or Vercel)

### Option A: Deploy to Render

1. Create new Web Service in Render
2. **Build Command**: `npm run build`
3. **Start Command**: `npm start`
4. **Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
   NODE_ENV=production
   ```
5. Deploy and note the frontend URL

### Option B: Deploy to Vercel (Recommended for Next.js)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. **Framework Preset**: Next.js
5. **Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
   ```
6. Deploy

## Post-Deployment Testing

### Backend Tests
- [ ] Test health check: `curl https://your-backend.onrender.com/api/auth/me`
- [ ] Test login: POST to `/api/auth/login` with test credentials
- [ ] Check logs for any errors

### Frontend Tests
- [ ] Visit frontend URL
- [ ] Test landing page loads
- [ ] Test registration flow
- [ ] Test login flow
- [ ] Test dashboard redirect based on role
- [ ] Test teacher AI features (if applicable)

### Integration Tests
- [ ] Create a new user account
- [ ] Login with new account
- [ ] Verify role-based dashboard redirect
- [ ] Test course creation (if teacher)
- [ ] Test course enrollment (if student)

## Troubleshooting

### Backend Won't Start
1. Check logs for MongoDB connection error
2. Verify `MONGO_URI` is set correctly
3. Verify MongoDB Atlas IP whitelist includes Render
4. Check all required environment variables are set

### 401/403 Errors
1. Verify `JWT_SECRET` is set and consistent
2. Check authorization middleware in `backend/src/middleware/auth.js`
3. Verify user role is correct in database

### CORS Errors
1. Verify `CLIENT_URL` matches frontend URL exactly
2. Check `frontend/utils/api/axiosInstance.ts` has correct API URL
3. Verify `NEXT_PUBLIC_API_URL` is set in frontend

### Database Connection Timeout
1. Check MongoDB Atlas cluster is running
2. Verify IP whitelist includes Render's IP
3. Check connection string format
4. Increase timeout in `backend/src/config/db.js` if needed

## Security Checklist

- [ ] `JWT_SECRET` is a strong random string (not default)
- [ ] `ADMIN_PASSWORD` is changed from default
- [ ] `CLOUDINARY_API_SECRET` is not exposed in frontend code
- [ ] `OPENAI_API_KEY` is not exposed in frontend code
- [ ] MongoDB user has minimal required permissions
- [ ] HTTPS is enforced (Render does this automatically)
- [ ] CORS is restricted to your frontend domain
- [ ] Rate limiting is enabled on sensitive endpoints

## Monitoring

- [ ] Set up error logging (check `backend/logs/` directory)
- [ ] Monitor Render dashboard for resource usage
- [ ] Check MongoDB Atlas for connection issues
- [ ] Review security logs for unauthorized access attempts

## Rollback Plan

If deployment fails:
1. Check Render deployment logs for specific error
2. Verify all environment variables are set
3. Test locally with same environment variables
4. Fix issue locally and push new commit
5. Trigger manual deploy in Render

## Next Steps

After successful deployment:
1. Share frontend URL with users
2. Create test accounts for different roles
3. Document any custom configurations
4. Set up monitoring and alerts
5. Plan for database backups
