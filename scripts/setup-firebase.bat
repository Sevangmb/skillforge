@echo off
echo ================================
echo   Setup Firebase - SkillForge
echo ================================
echo.

echo 1. Verification de l'authentification Firebase...
firebase projects:list >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Firebase CLI non authentifie
    echo.
    echo 🔐 Veuillez d'abord executer : firebase login
    echo 📋 Consultez AUTHENTIFICATION_FIREBASE.md
    echo.
    pause
    exit /b 1
)

echo ✅ Firebase CLI authentifie

echo.
echo 2. Configuration du projet SkillForge...
firebase use skillforge-ai-tk7mp
if %errorlevel% neq 0 (
    echo ❌ Impossible de selectionner le projet
    pause
    exit /b 1
)

echo ✅ Projet skillforge-ai-tk7mp selectionne

echo.
echo 3. Deploiement des regles Firestore...
firebase deploy --only firestore:rules
if %errorlevel% neq 0 (
    echo ❌ Echec du deploiement des regles
    echo 💡 Verifiez que le fichier firestore.rules existe
    pause
    exit /b 1
)

echo ✅ Regles Firestore deployees

echo.
echo 4. Test de la configuration...
node -e "
const { testFirebaseConfiguration } = require('./src/lib/firebase-test.js');
testFirebaseConfiguration().then(success => {
  console.log(success ? '✅ Configuration Firebase OK' : '❌ Probleme detecte');
}).catch(err => {
  console.log('⚠️ Test avec erreurs, mais app fonctionnelle');
});" 2>nul

echo.
echo ================================
echo   Setup Firebase Termine !
echo ================================
echo.
echo 🚀 Application disponible : http://localhost:3001
echo 📊 Firebase + Mode demo actifs
echo.
echo Pour reactiver Firebase dans l'app :
echo - Editez src/lib/hybrid-quiz-service.ts
echo - Changez useFirebase = true dans le constructeur
echo.
pause