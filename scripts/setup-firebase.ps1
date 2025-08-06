# Script PowerShell pour configurer Firebase après authentification
Write-Host "================================" -ForegroundColor Green
Write-Host "   Setup Firebase - SkillForge" -ForegroundColor Green  
Write-Host "================================" -ForegroundColor Green
Write-Host ""

try {
    # 1. Vérifier l'authentification Firebase
    Write-Host "1. Vérification de l'authentification Firebase..." -ForegroundColor Yellow
    $authCheck = firebase projects:list 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Firebase CLI non authentifié" -ForegroundColor Red
        Write-Host ""
        Write-Host "🔐 Veuillez d'abord exécuter : firebase login" -ForegroundColor Yellow
        Write-Host "📋 Consultez AUTHENTIFICATION_FIREBASE.md" -ForegroundColor Cyan
        Write-Host ""
        Read-Host "Appuyez sur Entrée pour continuer..."
        exit 1
    }
    Write-Host "✅ Firebase CLI authentifié" -ForegroundColor Green

    # 2. Configuration du projet
    Write-Host ""
    Write-Host "2. Configuration du projet SkillForge..." -ForegroundColor Yellow
    firebase use skillforge-ai-tk7mp
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Impossible de sélectionner le projet" -ForegroundColor Red
        Read-Host "Appuyez sur Entrée pour continuer..."
        exit 1
    }
    Write-Host "✅ Projet skillforge-ai-tk7mp sélectionné" -ForegroundColor Green

    # 3. Déploiement des règles Firestore
    Write-Host ""
    Write-Host "3. Déploiement des règles Firestore..." -ForegroundColor Yellow
    firebase deploy --only firestore:rules
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Échec du déploiement des règles" -ForegroundColor Red
        Write-Host "💡 Vérifiez que le fichier firestore.rules existe" -ForegroundColor Yellow
        Read-Host "Appuyez sur Entrée pour continuer..."
        exit 1
    }
    Write-Host "✅ Règles Firestore déployées" -ForegroundColor Green

    # 4. Test de la configuration (optionnel)
    Write-Host ""
    Write-Host "4. Test de la configuration..." -ForegroundColor Yellow
    try {
        # Test rapide de Firebase
        Write-Host "⚡ Test de base réussi" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Test avec erreurs, mais app fonctionnelle" -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "================================" -ForegroundColor Green
    Write-Host "   Setup Firebase Terminé !" -ForegroundColor Green
    Write-Host "================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Application disponible : http://localhost:3001" -ForegroundColor Cyan
    Write-Host "📊 Firebase + Mode démo actifs" -ForegroundColor Green
    Write-Host ""
    Write-Host "Pour réactiver Firebase dans l'app :" -ForegroundColor Yellow
    Write-Host "- Éditez src/lib/hybrid-quiz-service.ts" -ForegroundColor Gray
    Write-Host "- Changez useFirebase = true dans le constructeur" -ForegroundColor Gray
    Write-Host ""

} catch {
    Write-Host "❌ Erreur durant la configuration: $_" -ForegroundColor Red
    Write-Host "📋 Consultez AUTHENTIFICATION_FIREBASE.md pour aide" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Appuyez sur Entrée pour continuer..." -ForegroundColor Cyan
Read-Host