# 🔥 SkillForge - Firebase Studio

Application Next.js intégrée avec Firebase Studio pour le développement et la gestion de données.

## 🚀 Démarrage rapide

### 1. Configuration Firebase
1. Suivez le guide détaillé: [`FIREBASE_SETUP.md`](./FIREBASE_SETUP.md)
2. Copiez `.env.local.example` vers `.env.local`
3. Ajoutez vos clés Firebase dans `.env.local`

### 2. Installation et développement
```bash
npm install
npm run dev
```

### 3. Build et déploiement
```bash
npm run build
firebase deploy
```

Ou utilisez le script automatisé:
```bash
node deploy.js
```

## 📁 Structure du projet

```
skillforge/
├── app/                    # Pages Next.js (App Router)
│   ├── page.tsx           # Page d'accueil avec tests Firebase
│   ├── admin/page.tsx     # Panel admin pour Firestore
│   └── layout.tsx         # Layout principal
├── lib/
│   └── firebase.ts        # Configuration Firebase SDK
├── firebase.json          # Configuration Firebase
├── firestore.rules        # Règles de sécurité Firestore
├── storage.rules          # Règles de sécurité Storage
├── .env.local.example     # Template variables d'environnement
└── FIREBASE_SETUP.md      # Guide de configuration complet
```

## 🔧 Services Firebase configurés

- ✅ **Hosting**: Déploiement automatique
- ✅ **Firestore**: Base de données NoSQL
- ✅ **Authentication**: Système d'authentification
- ✅ **Storage**: Stockage de fichiers
- ✅ **Rules**: Sécurité configurée

## 🎯 Fonctionnalités

### Page d'accueil (`/`)
- État de connexion Firebase
- Test de connectivité Firestore
- Statut d'authentification
- Dashboard des services

### Page Admin (`/admin`)
- Interface CRUD pour Firestore
- Test d'ajout/suppression de données
- Gestion des collections
- Monitoring en temps réel

## 🔑 Variables d'environnement

Copiez `.env.local.example` vers `.env.local` et configurez:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 🛡️ Sécurité

- 🔒 Règles Firestore: Accès authentifié uniquement
- 🔐 Règles Storage: Upload/download sécurisés
- ⚠️ Mode test activé par défaut (à changer en production)

## 📊 Monitoring

Consultez Firebase Console pour:
- 📈 Analytics d'utilisation
- 👥 Gestion des utilisateurs
- 🗄️ Données Firestore
- 📁 Fichiers Storage
- 🚀 Déploiements Hosting

## 🔗 Liens utiles

- [Firebase Console](https://console.firebase.google.com)
- [Documentation Firebase](https://firebase.google.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

---

**Projet configuré avec Claude Code** 🤖