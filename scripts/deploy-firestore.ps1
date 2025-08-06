# Script PowerShell pour déployer Firebase
Write-Host "================================" -ForegroundColor Green
Write-Host "   Firebase Deployment Script" -ForegroundColor Green  
Write-Host "================================" -ForegroundColor Green
Write-Host ""

try {
    # Vérifier si on est connecté
    Write-Host "Vérification de la connexion Firebase..." -ForegroundColor Yellow
    $loginCheck = npx firebase projects:list 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Connexion à Firebase nécessaire..." -ForegroundColor Yellow
        npx firebase login
        if ($LASTEXITCODE -ne 0) {
            throw "Échec de la connexion Firebase"
        }
    }

    Write-Host "✅ Connexion Firebase OK" -ForegroundColor Green
    Write-Host ""

    # Déployer les règles Firestore
    Write-Host "Déploiement des règles Firestore..." -ForegroundColor Yellow
    npx firebase deploy --only firestore:rules --project skillforge-ai-tk7mp
    if ($LASTEXITCODE -ne 0) {
        throw "Échec du déploiement des règles"
    }
    Write-Host "✅ Règles Firestore déployées" -ForegroundColor Green

    # Déployer les index
    Write-Host "Déploiement des index Firestore..." -ForegroundColor Yellow  
    npx firebase deploy --only firestore:indexes --project skillforge-ai-tk7mp
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️ Avertissement: Échec du déploiement des index" -ForegroundColor Yellow
    } else {
        Write-Host "✅ Index Firestore déployés" -ForegroundColor Green
    }

    Write-Host ""
    Write-Host "================================" -ForegroundColor Green
    Write-Host "   Déploiement terminé avec succès !" -ForegroundColor Green
    Write-Host "================================" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Erreur: $_" -ForegroundColor Red
    Write-Host "Consultez la documentation Firebase pour plus d'aide." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Appuyez sur Entrée pour continuer..." -ForegroundColor Cyan
Read-Host