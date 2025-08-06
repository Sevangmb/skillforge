# 🔥 Guide Firebase CLI - SkillForge

Guide complet pour configurer et déployer Firebase via CLI.

## 🚀 Installation et Configuration

### ✅ Firebase CLI est déjà installé !
Version installée: `14.11.2`

## 📋 Étapes pour Déployer les Règles Firestore

### Option 1: Script PowerShell (Recommandé)
```powershell
# Exécuter le script de déploiement
.\scripts\deploy-firestore.ps1
```

### Option 2: Commandes NPM
```bash
# Se connecter à Firebase (première fois seulement)
npm run firebase:login

# Déployer les règles Firestore
npm run firebase:rules-deploy
```

### Option 3: Commandes Firebase directes
```bash
# Se connecter
npx firebase login

# Déployer les règles
npx firebase deploy --only firestore:rules --project skillforge-ai-tk7mp

# Déployer les index
npx firebase deploy --only firestore:indexes --project skillforge-ai-tk7mp
```

## 🗄️ Initialisation de la Base de Données

### Installer firebase-admin pour les scripts
```bash
npm install firebase-admin --save-dev
```

### Exécuter le script d'initialisation
```bash
node scripts/init-database.js
```

Ce script créera :
- ✅ 3 compétences de base (JavaScript, React, Node.js)
- ✅ 2 parcours de quiz avec IA
- ✅ 2 étapes de quiz interactives  
- ✅ 1 défi quotidien de test

## 🔧 Émulateurs Firebase (Développement Local)

### Démarrer les émulateurs
```bash
npm run firebase:emulators
```

Accès aux interfaces :
- **Firebase UI**: http://localhost:4000
- **Firestore**: http://localhost:8080
- **Auth**: http://localhost:9099

## 📁 Fichiers Créés

### Configuration Firebase
- ✅ `firebase.json` - Configuration principale
- ✅ `.firebaserc` - Projet par défaut
- ✅ `firestore.rules` - Règles de sécurité
- ✅ `firestore.indexes.json` - Index de performance

### Scripts
- ✅ `scripts/deploy-firestore.ps1` - Script PowerShell
- ✅ `scripts/deploy-firestore.bat` - Script Batch
- ✅ `scripts/init-database.js` - Initialisation données

## 🔒 Règles Firestore Configurées

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Utilisateurs authentifiés seulement
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Collections quiz accessibles aux authentifiés
    match /quiz_paths/{document} {
      allow read, write: if request.auth != null;
    }
    
    match /quiz_steps/{document} {
      allow read, write: if request.auth != null;
    }
    
    match /daily_challenges/{document} {
      allow read, write: if request.auth != null;
    }
    
    // Règle par défaut
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🎯 Prochaines Étapes

1. **Déployer les règles** : `.\scripts\deploy-firestore.ps1`
2. **Initialiser les données** : `node scripts/init-database.js`
3. **Tester l'application** : `npm run dev`
4. **Vérifier Firebase Debug** dans l'interface

## ❌ Résolution des Erreurs

### "Missing or insufficient permissions"
→ Les règles ne sont pas déployées
→ Exécuter: `npm run firebase:rules-deploy`

### "Permission denied"
→ Utilisateur non authentifié
→ Vérifier l'authentification dans l'app

### "Firebase project not found"
→ Vérifier `.firebaserc` et le nom du projet

## 🔗 Liens Utiles

- [Firebase Console](https://console.firebase.google.com)
- [Projet SkillForge](https://console.firebase.google.com/project/skillforge-ai-tk7mp)
- [Documentation Firebase CLI](https://firebase.google.com/docs/cli)

---

🎉 **Firebase CLI est maintenant configuré et prêt à l'emploi !**