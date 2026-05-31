# Quick Start: Deploy to Render

## 5-Minute Setup

### Step 1: MongoDB Atlas (2 minutes)
1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create free account → Create cluster
3. Create database user (username/password)
4. Click "Connect" → "Drivers" → Copy connection string
5. Replace `<password>` with your database user password
6. Example: `mongodb+srv://user:password@cluster.mongodb.net/virtual-learning-environment`

### Step 2: Render Backend (2 minutes)
1. Go to [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect GitHub repository
4. Fill in:
   - **Name**: `virtual-learning-environment-backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Root Directory**: `backend`

### Step 3: Environment Variables (1 minute)
In Render dashboard, go to "Environment" and add:

```
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/virtual-learning-environment
NODE_ENV=production
PORT=5000
CLIENT_URL=https://your-frontend-url.onrender.com
JWT_SECRET=generate-a-random-string-here
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret
OPENAI_API_KEY=your-openai-key
ADMIN_PASSWORD=secure-password
LOG_LEVEL=info
```

### Step 4: Deploy
1. Click "Create Web Service"
2. Wait for deployment (2-3 minutes)
3. Check logs for: `✅ MongoDB Connected`
4. Copy the backend URL (e.g., `https://your-backend.onrender.com`)

### Step 5: Frontend (Optional - if deploying to Render)
1. Create new Web Service
2. **Build Command**: `npm run build`
3. **Start Command**: `npm start`
4. **Root Directory**: `frontend`
5. **Environment Variable**:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
   ```

## Troubleshooting

### MongoDB Connection Error
- Verify `MONGO_URI` is set correctly
- Check MongoDB Atlas IP whitelist includes Render
- Ensure database user password is correct

### 401 Errors
- Verify `JWT_SECRET` is set
- Check user exists in database
- Verify token is being sent in requests

### CORS Errors
- Verify `CLIENT_URL` matches frontend URL exactly
- Check `NEXT_PUBLIC_API_URL` in frontend matches backend URL

## Testing After Deployment

1. Visit frontend URL
2. Click "Sign Up"
3. Create account as "Teacher"
4. Verify redirected to `/dashboard/teacher`
5. Check backend logs for successful requests

## Important Notes

- **Free tier**: Render spins down after 15 minutes of inactivity (cold start)
- **MongoDB Atlas**: Free tier has 512MB storage limit
- **Credentials**: Never commit `.env` files to GitHub
- **API Key**: Revoke exposed NVIDIA key immediately

## Next Steps

1. Set up monitoring in Render dashboard
2. Configure MongoDB Atlas backups
3. Test all user flows in production
4. Create admin account for testing
5. Document any custom configurations

---

**Need help?** Check `RENDER_DEPLOYMENT_GUIDE.md` for detailed instructions.
