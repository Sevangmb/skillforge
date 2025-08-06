# 🔐 Authentification Firebase CLI

## ✅ **Firebase CLI Installé**
Version détectée : **14.11.2** ✅

## 🚀 **Étapes d'Authentification**

### **1. Authentification Interactive**

Ouvrez un **nouveau terminal** (Command Prompt ou PowerShell) et exécutez :

```bash
firebase login
```

**Ce qui va se passer :**
1. 🌐 Une page web va s'ouvrir automatiquement
2. 🔐 Connectez-vous avec votre compte Google
3. ✅ Autorisez l'accès à Firebase CLI
4. 🎉 Le terminal affichera "Success! Logged in as [votre-email]"

### **2. Vérification de l'Authentification**

Après connexion, testez :

```bash
firebase projects:list
```

**Vous devriez voir :**
```
┌──────────────────────┬────────────────────┬────────────────────┬──────────────────────────┐
│ Project Display Name │ Project ID         │ Project Number     │ Resource Location ID     │
├──────────────────────┼────────────────────┼────────────────────┼──────────────────────────┤
│ SkillForge AI        │ skillforge-ai-tk7mp│ 430093616142       │ [Not specified]          │
└──────────────────────┴────────────────────┴────────────────────┴──────────────────────────┘
```

### **3. Configuration du Projet**

Dans le dossier SkillForge :

```bash
cd "C:\Users\sevan\OneDrive\Bureau\jeu\skillforge"
firebase use skillforge-ai-tk7mp
```

### **4. Déploiement des Règles Firestore**

Une fois authentifié :

```bash
npm run firebase:rules
```

**Ou directement :**
```bash
firebase deploy --only firestore:rules
```

## 🔧 **Commandes à Exécuter** 

Copiez-collez ces commandes **une par une** dans votre terminal :

```bash
# 1. Authentification
firebase login

# 2. Vérifier l'accès aux projets  
firebase projects:list

# 3. Aller dans le dossier SkillForge
cd "C:\Users\sevan\OneDrive\Bureau\jeu\skillforge"

# 4. Sélectionner le projet
firebase use skillforge-ai-tk7mp

# 5. Déployer les règles Firestore
firebase deploy --only firestore:rules

# 6. Activer l'authentification anonyme (optionnel via CLI)
firebase auth:import --hash-algo scrypt
```

## 📋 **Checklist**

- [ ] **Étape 1** : `firebase login` réussi
- [ ] **Étape 2** : `firebase projects:list` affiche skillforge-ai-tk7mp
- [ ] **Étape 3** : `firebase use skillforge-ai-tk7mp` configuré
- [ ] **Étape 4** : `firebase deploy --only firestore:rules` déployé
- [ ] **Étape 5** : Application testée sans erreur permissions

## 🚨 **Si Problème d'Authentification**

### **Alternative : Token d'accès**
```bash
# Générer un token pour environnements non-interactifs
firebase login:ci
# Suivez les instructions pour obtenir le token
```

### **Alternative : Console Firebase**
Si CLI continue à poser problème :
1. **Allez sur** https://console.firebase.google.com
2. **Projet** : skillforge-ai-tk7mp  
3. **Firestore Database** → **Règles** → Copiez le contenu de `firestore.rules`
4. **Authentification** → **Méthodes de connexion** → Activez **Anonyme**

## 🎯 **Résultat Attendu**

Après authentification réussie :
- ✅ **Firebase CLI connecté** à votre compte Google
- ✅ **Accès au projet** skillforge-ai-tk7mp confirmé  
- ✅ **Règles Firestore** déployées automatiquement
- ✅ **Application** fonctionne avec Firebase ET mock data

---

## 💡 **Note Importante**

**L'application fonctionne déjà parfaitement en mode démo !** L'authentification Firebase améliore juste la persistance des données cloud.

**Accès actuel** : http://localhost:3001 ✅