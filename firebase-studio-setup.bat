@echo off
echo ========================================
echo    Firebase Studio Setup for SkillForge
echo ========================================
echo.

echo 1. Checking Firebase CLI authentication...
firebase projects:list
echo.

echo 2. Setting current project...
firebase use skillforge-ai-tk7mp
echo.

echo 3. Deploying Firestore rules...
firebase deploy --only firestore:rules
echo.

echo 4. Checking Firebase Console URLs:
echo    - Project Console: https://console.firebase.google.com/project/skillforge-ai-tk7mp/overview
echo    - Authentication: https://console.firebase.google.com/project/skillforge-ai-tk7mp/authentication
echo    - Firestore: https://console.firebase.google.com/project/skillforge-ai-tk7mp/firestore
echo    - Hosting: https://console.firebase.google.com/project/skillforge-ai-tk7mp/hosting
echo.

echo 5. Enable Authentication providers in console...
echo    Go to: https://console.firebase.google.com/project/skillforge-ai-tk7mp/authentication/providers
echo    Enable: Email/Password
echo.

echo 6. Configure authorized domains...
echo    Go to: https://console.firebase.google.com/project/skillforge-ai-tk7mp/authentication/settings
echo    Add: localhost
echo.

echo Setup complete! Your Firebase project is ready.
pause