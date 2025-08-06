# 🔥 Firebase Setup - Instructions Complètes

## ✅ Ce qui est déjà configuré :

✅ Firebase CLI installé (version 14.11.2)
✅ Fichiers de configuration créés
✅ Règles Firestore définies  
✅ Scripts de déploiement prêts
✅ Script d'initialisation de données

## 🚀 **Étapes à Suivre pour Déployer :**

### 1. Se connecter à Firebase (Une seule fois)
```bash
npx firebase login
```
*Cela ouvrira votre navigateur pour l'authentification Google*

### 2. Déployer les règles Firestore
```bash
npx firebase deploy --only firestore:rules --project skillforge-ai-tk7mp
```

### 3. Déployer les index (optionnel mais recommandé)
```bash
npx firebase deploy --only firestore:indexes --project skillforge-ai-tk7mp
```

### 4. Initialiser la base avec des données de test
```bash
node scripts/init-database.js  
```

## 🎯 **Ou utilisez le script automatique :**

### Windows PowerShell (Recommandé)
```powershell
.\scripts\deploy-firestore.ps1
```

### Windows Command Prompt  
```cmd
scripts\deploy-firestore.bat
```

## 📊 **Vérifier le Déploiement**

1. Allez sur [Firebase Console](https://console.firebase.google.com/project/skillforge-ai-tk7mp)
2. Naviguez vers "Firestore Database" → "Règles"  
3. Vous devriez voir les nouvelles règles déployées
4. Dans "Données", vous verrez les collections créées

## 🧪 **Tester l'Application**

```bash
npm run dev
```

L'erreur "Missing or insufficient permissions" devrait être résolue !

## 🎉 **Résultat Final**

Après ces étapes :
- ✅ Règles Firestore déployées
- ✅ Base de données peuplée avec données de test
- ✅ Application fonctionnelle avec quiz automatiques
- ✅ Système IA opérationnel

---

**Note**: La première connexion nécessite une authentification dans le navigateur. Suivez simplement les instructions à l'écran !