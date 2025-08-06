# Script PowerShell pour nettoyer et redémarrer Next.js
Write-Host "================================" -ForegroundColor Green
Write-Host "   Nettoyage Next.js - SkillForge" -ForegroundColor Green  
Write-Host "================================" -ForegroundColor Green
Write-Host ""

try {
    # Arrêter les processus Node.js existants sur les ports communs
    Write-Host "🔴 Arrêt des processus existants..." -ForegroundColor Yellow
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force -ErrorAction SilentlyContinue
    
    # Suppression du dossier .next
    Write-Host "🗑️  Suppression du dossier .next..." -ForegroundColor Yellow
    if (Test-Path ".next") {
        Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
        Write-Host "✅ Dossier .next supprimé" -ForegroundColor Green
    }

    # Suppression du cache node_modules
    Write-Host "🗑️  Suppression du cache modules..." -ForegroundColor Yellow
    if (Test-Path "node_modules\.cache") {
        Remove-Item -Recurse -Force "node_modules\.cache" -ErrorAction SilentlyContinue
        Write-Host "✅ Cache modules supprimé" -ForegroundColor Green
    }

    # Nettoyage cache npm (optionnel)
    Write-Host "🧹 Nettoyage cache npm..." -ForegroundColor Yellow
    npm cache clean --force 2>$null
    Write-Host "✅ Cache npm nettoyé" -ForegroundColor Green

    Write-Host ""
    Write-Host "🚀 Démarrage de l'application..." -ForegroundColor Cyan
    Write-Host "   → http://localhost:3000" -ForegroundColor Gray
    Write-Host ""

    # Démarrage de l'application
    npm run dev

} catch {
    Write-Host "❌ Erreur durante le nettoyage: $_" -ForegroundColor Red
    Write-Host "Essayez de supprimer manuellement le dossier .next" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Appuyez sur Entrée pour continuer..." -ForegroundColor Cyan
Read-Host