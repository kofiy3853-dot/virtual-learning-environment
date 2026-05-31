# Deployment Action Items - Virtual Learning Environment

## 🎯 Your Deployment Checklist

Complete these items in order to deploy your application to production.

---

## Phase 1: Preparation (30 minutes)

### 1.1 Gather Required Information
- [ ] Have your GitHub repository URL ready
- [ ] Have your email address for Render account
- [ ] Have a strong password for MongoDB user (save it!)
- [ ] Have a strong JWT_SECRET (generate random string, min 32 chars)

### 1.2 Create Accounts (if needed)
- [ ] Create Render account at https://render.com
- [ ] Create MongoDB Atlas account at https://mongodb.com/cloud/atlas
- [ ] Verify email addresses for both accounts

### 1.3 Review Documentation
- [ ] Read `QUICK_START_DEPLOYMENT.md` (5 min overview)
- [ ] Read `DEPLOYMENT_FINAL_GUIDE.md` (detailed steps)
- [ ] Bookmark `RENDER_DEPLOYMENT_GUIDE.md` (reference)

---

## Phase 2: MongoDB Setup (15 minutes)

### 2.1 Create MongoDB Cluster
- [ ] Log in to MongoDB Atlas
- [ ] Click "Create" → "Build a Cluster"
- [ ] Select "Free" tier
- [ ] Choose region (closest to your users)
- [ ] Click "Create Cluster"
- [ ] Wait for cluster to initialize (2-3 minutes)

### 2.2 Create Database User
- [ ] Click "Database Access" in left sidebar
- [ ] Click "Add New Database User"
- [ ] Choose "Password" authentication
- [ ] Enter username: `vle_user` (or your choice)
- [ ] Enter strong password (SAVE THIS!)
- [ ] Click "Add User"

### 2.3 Get Connection String
- [ ] Click "Clusters" in left sidebar
- [ ] Click "Connect" on your cluster
- [ ] Choose "Drivers"
- [ ] Select "Node.js" version "5.9 or later"
- [ ] Copy the connection string
- [ ] Replace `<password>` with your database password
- [ ] Replace `<username>` with your database username
- [ ] Save the final connection string (you'll need it soon)

### 2.4 Configure IP Whitelist
- [ ] Click "Network Access" in left sidebar
- [ ] Click "Add IP Address"
- [ ] For now: Click "Allow Access from Anywhere" (0.0.0.0/0)
- [ ] Click "Confirm"
- [ ] Note: For production, restrict to Render's IP range

---

## Phase 3: Backend Deployment (20 minutes)

### 3.1 Connect GitHub to Render
- [ ] Log in to Render at https://render.com
- [ ] Click "New +" → "Web Service"
- [ ] Click "Connect account" next to GitHub
- [ ] Authorize Render to access your GitHub
- [ ] Select your repository
- [ ] Select branch (usually `main`)

### 3.2 Configure Backend Service
- [ ] Fill in service name: `virtual-learning-environment-backend`
- [ ] Set Environment: `Node`
- [ ] Set Build Command: `npm install`
- [ ] Set Start Command: `npm start`
- [ ] Set Root Directory: `backend`
- [ ] Select Plan: `Free` (for testing) or `Starter` (for production)

### 3.3 Add Environment Variables
- [ ] Scroll to "Environment" section
- [ ] Click "Add Environment Variable" for each:

```
MONGO_URI = mongodb+srv://vle_user:yourpassword@cluster0.abc123.mongodb.net/virtual-learning-environment
NODE_ENV = production
PORT = 5000
CLIENT_URL = https://your-frontend-url.onrender.com
JWT_SECRET = your-secure-random-string-here-min-32-chars
JWT_EXPIRE = 7d
CLOUDINARY_CLOUD_NAME = your-cloudinary-name
CLOUDINARY_API_KEY = your-cloudinary-key
CLOUDINARY_API_SECRET = your-cloudinary-secret
OPENAI_API_KEY = your-openai-key
ADMIN_PASSWORD = secure-admin-password
LOG_LEVEL = info
```

**Important Notes**:
- `MONGO_URI` must include your actual password
- `JWT_SECRET` should be a random string (use a password generator)
- `CLIENT_URL` will be updated after frontend deployment
- Leave `CLOUDINARY_*` and `OPENAI_API_KEY` blank if not using these services

### 3.4 Deploy Backend
- [ ] Click "Create Web Service"
- [ ] Wait for deployment (2-3 minutes)
- [ ] Check "Logs" tab for: `✅ MongoDB Connected`
- [ ] If error, check troubleshooting section below
- [ ] Copy backend URL (e.g., `https://your-backend.onrender.com`)
- [ ] Save this URL for frontend configuration

### 3.5 Verify Backend
- [ ] Open backend URL in browser
- [ ] You should see a 404 or error (that's normal)
- [ ] Test API: `https://your-backend-url/api/auth/me`
- [ ] Should return 401 (not logged in) - that's correct

---

## Phase 4: Frontend Deployment (20 minutes)

### 4.1 Update Frontend Environment
- [ ] In your repository, open `frontend/.env.local`
- [ ] Update `NEXT_PUBLIC_API_URL` to your backend URL:
  ```
  NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
  ```
- [ ] Commit and push to GitHub

### 4.2 Deploy Frontend to Render
- [ ] In Render dashboard, click "New +"
- [ ] Select "Web Service"
- [ ] Connect your GitHub repository (same as backend)
- [ ] Fill in service details:
  - **Name**: `virtual-learning-environment-frontend`
  - **Environment**: Node
  - **Build Command**: `npm run build`
  - **Start Command**: `npm start`
  - **Root Directory**: `frontend`
  - **Plan**: Free or Starter

### 4.3 Add Frontend Environment Variables
- [ ] Add these environment variables:
  ```
  NEXT_PUBLIC_API_URL = https://your-backend.onrender.com
  NODE_ENV = production
  ```

### 4.4 Deploy Frontend
- [ ] Click "Create Web Service"
- [ ] Wait for deployment (3-5 minutes)
- [ ] Check logs for any errors
- [ ] Copy frontend URL (e.g., `https://your-frontend.onrender.com`)

### 4.5 Update Backend CLIENT_URL
- [ ] Go back to backend service in Render
- [ ] Click "Environment"
- [ ] Update `CLIENT_URL` to your frontend URL
- [ ] Click "Save"
- [ ] Render will automatically redeploy backend

---

## Phase 5: Testing (15 minutes)

### 5.1 Test Landing Page
- [ ] Visit your frontend URL
- [ ] Verify landing page loads
- [ ] Check navigation works
- [ ] Verify role-based cards display
- [ ] Click "Sign Up" button

### 5.2 Test Registration
- [ ] Fill in registration form:
  - Name: `Test Teacher`
  - Email: `teacher@example.com`
  - Password: `password123`
  - Account Type: `Teacher`
- [ ] Click "Create Account"
- [ ] Should redirect to `/dashboard/teacher`
- [ ] Verify you see teacher dashboard
- [ ] Check backend logs for successful registration

### 5.3 Test Login
- [ ] Log out (if logged in)
- [ ] Go to login page
- [ ] Enter credentials from registration
- [ ] Click "Sign In"
- [ ] Should redirect to `/dashboard/teacher`
- [ ] Verify user data displays correctly

### 5.4 Test Student Registration
- [ ] Register another account as "Student"
- [ ] Use different email: `student@example.com`
- [ ] Should redirect to `/dashboard/student`
- [ ] Verify different dashboard layout

### 5.5 Test Authorization
- [ ] As teacher, try accessing student routes
- [ ] Should see error or redirect
- [ ] Verify error messages are helpful
- [ ] Check backend logs for 403 errors

---

## Phase 6: Post-Deployment (10 minutes)

### 6.1 Monitor Logs
- [ ] Check Render backend logs for errors
- [ ] Check Render frontend logs for errors
- [ ] Look for any 500 errors or warnings

### 6.2 Create Admin Account
- [ ] Register as admin (if admin registration is enabled)
- [ ] Or use backend admin creation script
- [ ] Test admin features

### 6.3 Security Checklist
- [ ] Verify `JWT_SECRET` is a strong random string
- [ ] Verify `ADMIN_PASSWORD` is changed from default
- [ ] Verify API keys are not exposed in frontend code
- [ ] Verify HTTPS is enforced (Render does this)
- [ ] Verify CORS is restricted to your domain

### 6.4 Share with Users
- [ ] Share frontend URL with users
- [ ] Provide registration instructions
- [ ] Provide login instructions
- [ ] Provide support contact information

---

## Troubleshooting

### MongoDB Connection Error
**Error**: `Error: connect ECONNREFUSED 127.0.0.1:27017`

**Solution**:
1. [ ] Verify `MONGO_URI` is set in Render environment
2. [ ] Check MongoDB Atlas IP whitelist includes Render
3. [ ] Verify connection string format is correct
4. [ ] Test connection string locally first
5. [ ] Check MongoDB Atlas cluster is running

### 401 Unauthorized Errors
**Error**: `Failed to load resource: the server responded with a status of 401`

**Solution**:
1. [ ] Verify `JWT_SECRET` is set and consistent
2. [ ] Check user exists in database
3. [ ] Verify token is being sent in requests
4. [ ] Check browser console for specific error messages
5. [ ] Verify `NEXT_PUBLIC_API_URL` is correct

### CORS Errors
**Error**: `Access to XMLHttpRequest blocked by CORS policy`

**Solution**:
1. [ ] Verify `CLIENT_URL` matches frontend URL exactly
2. [ ] Check `NEXT_PUBLIC_API_URL` matches backend URL
3. [ ] Verify backend CORS middleware is configured
4. [ ] Check browser console for specific error
5. [ ] Clear browser cache and try again

### 403 Forbidden Errors
**Error**: `Access denied. This resource requires teacher role.`

**Solution**:
1. [ ] Verify user role is correct in database
2. [ ] Check authorization middleware in backend
3. [ ] Verify role is being sent correctly from frontend
4. [ ] Check user role in browser console: `console.log(user.role)`
5. [ ] Verify role is lowercase in database

### Build Failures
**Error**: `Build failed` or `npm install failed`

**Solution**:
1. [ ] Check Render build logs for specific error
2. [ ] Verify `package.json` exists in root directory
3. [ ] Verify `Root Directory` is set correctly
4. [ ] Try building locally first: `npm install && npm run build`
5. [ ] Check for missing dependencies

---

## Quick Reference

| Item | Value | Status |
|------|-------|--------|
| Frontend URL | https://your-frontend.onrender.com | ⏳ |
| Backend URL | https://your-backend.onrender.com | ⏳ |
| MongoDB Connection | mongodb+srv://... | ⏳ |
| Admin Panel | /admin | ⏳ |
| Teacher Dashboard | /dashboard/teacher | ⏳ |
| Student Dashboard | /dashboard/student | ⏳ |

---

## Support Resources

- **Render Documentation**: https://render.com/docs
- **MongoDB Atlas Documentation**: https://docs.atlas.mongodb.com
- **Next.js Documentation**: https://nextjs.org/docs
- **Express.js Documentation**: https://expressjs.com
- **GitHub Issues**: Check your repository issues for known problems

---

## Final Checklist

- [ ] All phases completed
- [ ] All tests passed
- [ ] No errors in logs
- [ ] Users can register
- [ ] Users can login
- [ ] Dashboard redirects work
- [ ] Authorization works
- [ ] Admin account created
- [ ] Security checklist completed
- [ ] Users have been notified

---

## Estimated Time

- Phase 1 (Preparation): 30 minutes
- Phase 2 (MongoDB): 15 minutes
- Phase 3 (Backend): 20 minutes
- Phase 4 (Frontend): 20 minutes
- Phase 5 (Testing): 15 minutes
- Phase 6 (Post-Deployment): 10 minutes

**Total Estimated Time**: 110 minutes (1 hour 50 minutes)

---

## Next Steps After Deployment

1. Monitor logs daily for first week
2. Create test accounts for different roles
3. Test all features thoroughly
4. Set up error tracking (Sentry)
5. Configure monitoring and alerts
6. Plan for database backups
7. Document any custom configurations
8. Plan for scaling if needed

---

**Status**: Ready to deploy
**Last Updated**: May 27, 2026
**Questions?**: Check the deployment guides or GitHub issues
