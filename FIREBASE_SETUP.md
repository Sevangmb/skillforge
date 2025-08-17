# 🔥 Configuration Firebase Studio - Guide Complet

## 1. 🚀 Créer le projet Firebase

1. Allez sur [Firebase Console](https://console.firebase.google.com)
2. Cliquez sur "Créer un projet"
3. Nommez le projet: `skillforge-app`
4. Activez Google Analytics (optionnel)
5. Créez le projet

## 2. 🔑 Obtenir les clés de configuration

1. Dans Firebase Console, cliquez sur l'icône web (</>) 
2. Nommez l'app: `skillforge-web`
3. Cochez "Configurer Firebase Hosting"
4. Copiez les clés de configuration

## 3. 📝 Configurer les variables d'environnement

1. Copiez `.env.local.example` vers `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Remplacez les valeurs dans `.env.local` avec vos vraies clés Firebase

## 4. 🗄️ Configurer Firestore Database

1. Dans Firebase Console → Firestore Database
2. Cliquez "Créer une base de données"
3. Choisissez "Commencer en mode test" (temporaire)
4. Sélectionnez une région (europe-west1 pour la France)

## 5. 🔐 Configurer Authentication

1. Dans Firebase Console → Authentication
2. Onglet "Sign-in method"
3. Activez les méthodes souhaitées:
   - Email/Password (recommandé)
   - Google (optionnel)
   - GitHub (optionnel)

## 6. 📦 Configurer Storage

1. Dans Firebase Console → Storage
2. Cliquez "Commencer"
3. Choisissez "Commencer en mode test"
4. Sélectionnez la même région que Firestore

## 7. 🚀 Déployer sur Firebase Hosting

1. Se connecter à Firebase:
   ```bash
   firebase login
   ```

2. Initialiser Firebase (si pas déjà fait):
   ```bash
   firebase init
   ```
   - Sélectionnez: Hosting, Firestore, Storage
   - Projet: skillforge-app
   - Public directory: out
   - Single-page app: Yes
   - Automatic builds: No

3. Builder et déployer:
   ```bash
   npm run build
   firebase deploy
   ```

   Ou utiliser le script:
   ```bash
   node deploy.js
   ```

## 8. ✅ Vérification du déploiement

1. Votre app sera disponible sur: `https://skillforge-app.web.app`
2. Testez la page d'accueil: connexion Firebase
3. Testez la page admin: `/admin` - CRUD Firestore

## 9. 🔧 Configuration des règles de sécurité

### Firestore Rules (firestore.rules):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permettre lecture/écriture aux utilisateurs authentifiés
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Storage Rules (storage.rules):
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 10. 🧪 Test des fonctionnalités

### Page d'accueil (`/`):
- ✅ Connexion Firebase confirmée
- ✅ État d'authentification
- ✅ Status des services

### Page admin (`/admin`):
- ✅ Test CRUD Firestore
- ✅ Ajout d'items de test
- ✅ Suppression d'items

## 11. 📊 Surveillance dans Firebase Studio

1. **Firestore**: Consultez les collections et documents
2. **Authentication**: Gérez les utilisateurs
3. **Storage**: Gérez les fichiers
4. **Hosting**: Gérez les déploiements
5. **Analytics**: Suivez l'utilisation (si activé)

## 🚨 Points importants

- ⚠️ **Sécurité**: Changez les règles Firestore en production
- 🔄 **CI/CD**: Utilisez `firebase deploy` pour les mises à jour
- 📱 **Mobile**: Les clés sont publiques, c'est normal
- 🔒 **Admin**: Utilisez Firebase Admin SDK pour les opérations sensibles

## 📞 Support

En cas de problème:
1. Vérifiez les logs Firebase Console
2. Vérifiez la console développeur du navigateur
3. Consultez la documentation Firebase

🎉 **Votre Firebase Studio est maintenant configuré et prêt!**