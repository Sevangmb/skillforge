# Firebase App Hosting Deployment Guide

## Environment Variables Configuration

After fixing the build issues, you need to configure environment variables in Firebase App Hosting:

### 1. Set Firebase App Hosting Parameters

Run these commands to set the required parameters for your Firebase App Hosting deployment:

```bash
# Set Firebase API configuration parameters
firebase apphosting:secrets:set FIREBASE_API_KEY
firebase apphosting:secrets:set FIREBASE_AUTH_DOMAIN
firebase apphosting:secrets:set FIREBASE_PROJECT_ID
firebase apphosting:secrets:set FIREBASE_STORAGE_BUCKET
firebase apphosting:secrets:set FIREBASE_MESSAGING_SENDER_ID
firebase apphosting:secrets:set FIREBASE_APP_ID
```

When prompted, enter the corresponding values from your `.env.local` file:

- **FIREBASE_API_KEY**: `AIzaSyDmRORJqVcDW6OWFP7Oiw1npDyGXj1y860`
- **FIREBASE_AUTH_DOMAIN**: `skillforge-ai-tk7mp.firebaseapp.com`
- **FIREBASE_PROJECT_ID**: `skillforge-ai-tk7mp`
- **FIREBASE_STORAGE_BUCKET**: `skillforge-ai-tk7mp.firebasestorage.app`
- **FIREBASE_MESSAGING_SENDER_ID**: `430093616142`
- **FIREBASE_APP_ID**: `1:430093616142:web:95e69e98d0cb9112a6285f`

### 2. Redeploy to Firebase App Hosting

After setting the environment variables, redeploy your application:

```bash
# Trigger a new deployment
git push origin master
```

Or manually trigger from Firebase Console:
1. Go to Firebase Console > App Hosting
2. Find your SkillForge AI backend
3. Click "Deploy" to trigger a new build

### 3. Verify Deployment

After deployment, check:
1. Build logs show successful completion
2. Application loads without Firebase initialization errors
3. Authentication functionality works properly
4. User settings and language selection work

## Build Fixes Applied

### Firebase Configuration
- Conditional Firebase initialization only in browser environment
- Null checks for all Firebase service calls
- SSR-safe context providers

### Next.js Configuration
- Added `output: 'standalone'` for Firebase App Hosting
- Environment variable validation
- Optimized for serverless deployment

### Authentication Context
- Browser environment checks before Firebase initialization
- Graceful handling when Firebase is not available during SSR

### Language Context
- SSR-safe language initialization
- Browser-only language detection and storage

## Troubleshooting

If build still fails:
1. Verify all environment variables are set correctly
2. Check Firebase project permissions
3. Ensure Firebase services are enabled in console
4. Review build logs for specific errors

## Local Development

For local development, ensure your `.env.local` file contains all required Firebase configuration variables as shown in `.env.example`.