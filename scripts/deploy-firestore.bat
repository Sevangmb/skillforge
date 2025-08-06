@echo off
echo ================================
echo   Firebase Deployment Script
echo ================================
echo.

echo 1. Se connecter a Firebase (ouvrir le navigateur)
npx firebase login

echo.
echo 2. Deployer les regles Firestore
npx firebase deploy --only firestore:rules

echo.
echo 3. Deployer les index Firestore  
npx firebase deploy --only firestore:indexes

echo.
echo 4. Verification du deploiement
npx firebase firestore:rules:get

echo.
echo ================================
echo   Deploiement termine !
echo ================================
pause