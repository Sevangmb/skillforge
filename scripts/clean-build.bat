@echo off
echo ================================
echo   Nettoyage Next.js - SkillForge
echo ================================
echo.

echo 1. Suppression du dossier .next...
if exist .next rmdir /s /q .next
echo    ✅ .next supprime

echo.
echo 2. Suppression du cache node_modules...
if exist node_modules\.cache rmdir /s /q node_modules\.cache
echo    ✅ Cache modules supprime

echo.
echo 3. Nettoyage cache npm...
npm cache clean --force 2>nul
echo    ✅ Cache npm nettoye

echo.
echo 4. Demarrage en mode developpement...
echo    🚀 Lancement de npm run dev...
echo.

npm run dev

echo.
echo ================================
echo   Nettoyage termine !
echo ================================
pause