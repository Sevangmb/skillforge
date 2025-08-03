# 🚀 Guide de Déploiement Firebase - SkillForge AI

## 📋 Prérequis

### 1. Installation Firebase CLI
```bash
npm install -g firebase-tools
```
✅ **Déjà installé**

### 2. Connexion à Firebase
```bash
firebase login
```
⚠️ **Requis**: Vous devez vous connecter manuellement dans votre terminal

## 🔧 Configuration Firebase Project

### 1. Créer un Projet Firebase
1. Aller sur https://console.firebase.google.com
2. Cliquer sur "Add project" / "Ajouter un projet"
3. Nommer votre projet (ex: `skillforge-ai`)
4. Activer Google Analytics (optionnel)

### 2. Configurer les Services

#### Authentication
1. Dans Firebase Console → Authentication → Sign-in method
2. Activer "Email/Password"
3. Activer "Google" et configurer OAuth consent

#### Firestore Database
1. Dans Firebase Console → Firestore Database
2. Créer une base de données
3. Commencer en mode "test" (les règles sont déjà configurées)

#### Hosting (App Hosting recommandé)
1. Dans Firebase Console → Hosting
2. Suivre les instructions de configuration

### 3. Obtenir la Configuration Firebase
1. Dans Firebase Console → Project Settings → General
2. Copier la configuration dans "Your apps" → Web app
3. Mettre à jour `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
GOOGLE_AI_API_KEY=your_google_ai_api_key_here
```

### 4. Configurer le Project ID
Mettre à jour `.firebaserc`:
```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

## 🚀 Déploiement

### Option 1: Déploiement Standard
```bash
# Se connecter (manuel requis)
firebase login

# Initialiser le projet
firebase init

# Construire et déployer
npm run build
firebase deploy
```

### Option 2: App Hosting (Recommandé)
1. Dans Firebase Console → App Hosting
2. Connecter votre repository GitHub
3. Configurer les variables d'environnement
4. Déploiement automatique à chaque push

### Option 3: Déploiement Local avec CI Token
```bash
# Générer un token CI
firebase login:ci

# Déployer avec le token
FIREBASE_TOKEN=your_token firebase deploy
```

## 📁 Structure des Fichiers de Configuration

```
skillforge/
├── firebase.json          # Configuration Hosting/Firestore
├── .firebaserc            # Project ID
├── firestore.rules        # Règles de sécurité Firestore
├── firestore.indexes.json # Index Firestore
├── apphosting.yaml        # Configuration App Hosting
└── .env.local             # Variables d'environnement
```

## 🔒 Sécurité

### Règles Firestore (déjà configurées)
- Users: Lecture/écriture de leurs propres données uniquement
- Skills: Lecture seule pour tous les utilisateurs authentifiés
- AI Content: Lecture/écriture pour les utilisateurs authentifiés

### Variables d'Environnement
⚠️ **Important**: Ne jamais committer `.env.local` dans Git

## ✅ Vérification du Déploiement

Après le déploiement:
1. Vérifier l'URL de hosting
2. Tester l'authentification
3. Vérifier les fonctionnalités AI
4. Contrôler les logs d'erreur dans Firebase Console

## 🛠️ Dépannage

### Erreurs communes:
- **"Permission denied"**: Vérifier les règles Firestore
- **"Auth domain not authorized"**: Ajouter le domaine dans Firebase Auth settings
- **"API key restrictions"**: Configurer les restrictions d'API dans Google Cloud Console

### Logs utiles:
```bash
firebase functions:log  # Logs des Cloud Functions
firebase hosting:channel:open  # Preview channels
```

## 📞 Support

- Documentation Firebase: https://firebase.google.com/docs
- Next.js Deployment: https://nextjs.org/docs/deployment
- Firebase Support: https://support.google.com/firebase