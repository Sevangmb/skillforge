# 🔐 Guide d'Administration SkillForge

## 📊 **Vue d'ensemble**

SkillForge dispose maintenant d'une **zone d'administration complète** permettant aux modérateurs et administrateurs de gérer efficacement la plateforme.

### **🎯 Accès à l'administration**
- **URL** : https://skillforge-ai-tk7mp.web.app/admin
- **Accès** : Visible uniquement aux utilisateurs avec rôle `moderator`, `admin` ou `super_admin`
- **Administrateur initial** : `sevans@hotmail.fr` (Super Admin)

---

## 🔑 **Système de Rôles et Permissions**

### **Hiérarchie des rôles**
1. **Super Admin** (`super_admin`) - Contrôle total du système
2. **Administrator** (`admin`) - Gestion complète des utilisateurs et contenu  
3. **Moderator** (`moderator`) - Modération du contenu et analytics
4. **User** (`user`) - Utilisateur standard

### **Permissions par rôle**

#### **Super Admin** 🔴
- ✅ Toutes les permissions administrateur
- ✅ Gestion des autres administrateurs
- ✅ Configuration système avancée
- ✅ Accès aux logs système

#### **Administrator** 🟣  
- ✅ Gestion des utilisateurs (voir, modifier, bannir, promouvoir)
- ✅ Modération du contenu (approuver, rejeter, supprimer)
- ✅ Analytics et métriques détaillées
- ✅ Configuration système
- ✅ Gestion des compétences et achievements
- ✅ Consultation des logs d'audit

#### **Moderator** 🔵
- ✅ Consultation des utilisateurs
- ✅ Modération du contenu
- ✅ Analytics de base
- ✅ Consultation des logs

---

## 🖥️ **Interface d'Administration**

### **Dashboard Principal**
- **Métriques en temps réel** : Utilisateurs actifs, inscriptions, activité
- **État du système** : Statut des services, alertes, performance
- **Catégories populaires** : Analyse des compétences les plus demandées
- **Croissance** : Évolution des inscriptions et de l'engagement

### **Gestion des Utilisateurs**
- **Liste complète** : Tous les utilisateurs avec filtres et recherche
- **Actions disponibles** :
  - 👁️ Voir le profil détaillé
  - ✏️ Modifier les informations
  - ⬆️ Promouvoir (moderator → admin)
  - 🚫 Bannir/Débannir
  - 🗑️ Supprimer (admin uniquement)

### **Modération du Contenu**
- **Quiz et compétences** soumis par les utilisateurs
- **Signalements** de contenu inapproprié
- **Approbation/Rejet** avec commentaires
- **Historique** des actions de modération

### **Analytics Avancées**
- **Métriques d'utilisation** détaillées
- **Rapports** de performance par catégorie
- **Tendances** d'apprentissage
- **Export de données** pour analyse externe

---

## 🚀 **Guide d'Utilisation**

### **1. Premier accès (sevans@hotmail.fr)**
1. **Connectez-vous** avec `sevans@hotmail.fr`
2. **Bouton "Admin"** apparaît automatiquement dans l'en-tête
3. **Cliquez** sur le bouton pour accéder à l'interface
4. **Badge "Admin"** confirme vos permissions

### **2. Navigation dans l'interface**
- **Onglets principaux** : Dashboard, Utilisateurs, Contenu, Analytics, Système, Logs
- **Breadcrumbs** pour navigation rapide
- **Recherche globale** dans chaque section
- **Notifications** pour actions importantes

### **3. Gestion quotidienne**
- **Vérifiez le dashboard** pour les métriques clés
- **Modérez le contenu** signalé
- **Surveillez les utilisateurs** suspects
- **Consultez les logs** pour audit

### **4. Promotion d'utilisateurs**
1. **Onglet Utilisateurs** → Rechercher l'utilisateur
2. **Menu Actions** (⋮) → "Promouvoir"
3. **Choisir le nouveau rôle** (user → moderator → admin)
4. **Confirmer** l'action

---

## 🔒 **Sécurité et Bonnes Pratiques**

### **Contrôle d'accès**
- ✅ **Vérification email** : Seuls les emails autorisés ont accès admin
- ✅ **Permissions granulaires** : Chaque action vérifie les droits
- ✅ **Logs d'audit** : Toutes les actions sont tracées
- ✅ **Sessions sécurisées** : Authentification Firebase

### **Recommandations**
1. **Changez rarement les super admins** - Risque de sécurité élevé
2. **Loggez toutes les actions sensibles** - Traçabilité complète
3. **Révisez régulièrement les permissions** - Principe du moindre privilège
4. **Surveillez les connexions suspectes** - Détection d'intrusion

---

## 🛠️ **Configuration Technique**

### **Fichiers clés**
```
src/lib/admin/permissions.ts     # Configuration des rôles
src/hooks/useAdminAuth.ts        # Hook d'authentification admin  
src/components/admin/            # Composants d'interface
src/lib/types/admin.ts          # Types TypeScript
```

### **Ajout d'un nouvel administrateur**
1. **Modifiez** `src/lib/admin/permissions.ts`
2. **Ajoutez l'email** dans `ADMIN_EMAILS`
3. **Redéployez** l'application
4. **L'utilisateur** aura automatiquement les droits admin

### **Personnalisation des permissions**
```typescript
// Modifier ROLE_PERMISSIONS dans permissions.ts
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  moderator: [
    'users.view',
    'content.moderate',
    // Ajouter nouvelles permissions ici
  ],
  // ...
};
```

---

## 📈 **Métriques et Analytics**

### **Indicateurs clés (KPI)**
- **Utilisateurs actifs** : Connectés dans les dernières 24h
- **Taux d'engagement** : Sessions par utilisateur
- **Croissance** : Nouvelles inscriptions (jour/semaine/mois)
- **Complétion** : Quiz terminés par catégorie
- **Rétention** : Utilisateurs revenant après 7 jours

### **Alertes automatiques**
- 🔴 **Pic d'activité** inhabituel (possible attaque)
- 🟠 **Baisse d'engagement** significative  
- 🟡 **Erreurs système** répétées
- 🔵 **Nouveau contenu** en attente de modération

---

## 🆘 **Support et Maintenance**

### **En cas de problème**
1. **Vérifiez les logs** système dans l'onglet "Logs"
2. **Consultez les métriques** pour identifier les anomalies
3. **Contactez l'équipe technique** avec les détails
4. **Documentez** l'incident pour amélioration

### **Maintenance préventive**
- **Backup hebdomadaire** des données utilisateurs
- **Mise à jour** des permissions selon l'évolution
- **Audit mensuel** des comptes administrateurs
- **Test** des fonctionnalités critiques

---

## 🎯 **Roadmap Fonctionnalités**

### **À venir (prochaine version)**
- 📊 **Rapports automatisés** par email
- 🤖 **Modération automatique** par IA
- 📱 **Application mobile** d'administration
- 🔔 **Notifications push** pour alertes critiques
- 📈 **Dashboard personnalisable** par rôle

### **Fonctionnalités avancées**
- 🌍 **Multi-tenant** pour organisations
- 🔐 **Authentification 2FA** obligatoire pour admins
- 📋 **Workflows** d'approbation complexes
- 🧠 **Intelligence artificielle** pour détection d'anomalies

---

*La zone d'administration SkillForge est conçue pour évoluer avec les besoins de la plateforme. N'hésitez pas à proposer des améliorations !*