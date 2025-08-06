/**
 * Script pour réactiver Firebase dans l'application
 * À exécuter après activation de l'authentification anonyme
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 Réactivation de Firebase dans SkillForge...');

const hybridServicePath = path.join(__dirname, '../src/lib/hybrid-quiz-service.ts');

try {
    // Lire le fichier actuel
    let content = fs.readFileSync(hybridServicePath, 'utf8');
    
    // Chercher et remplacer le constructeur pour réactiver Firebase
    const oldConstructor = `  private constructor() {
    // Force le mode démo pour éviter les erreurs de permissions
    this.useFirebase = false;
    console.log('🎮 SkillForge démarré en MODE DÉMO');
    console.log('📋 Toutes les fonctionnalités sont disponibles !');
    console.log('🔧 Pour Firebase: consultez SOLUTION_IMMEDIATE.md');
  }`;

    const newConstructor = `  private constructor() {
    this.checkFirebaseAvailability();
    console.log('🚀 SkillForge démarré avec Firebase + Mode Démo');
    console.log('📊 Système hybrid actif : Firebase avec fallback intelligent');
  }`;

    if (content.includes(oldConstructor)) {
        content = content.replace(oldConstructor, newConstructor);
        
        // Écrire le fichier modifié
        fs.writeFileSync(hybridServicePath, content);
        
        console.log('✅ Firebase réactivé avec succès !');
        console.log('📊 Mode hybrid actif : Firebase + Fallback');
        console.log('🔄 Redémarrez l\'application pour appliquer les changements');
        console.log('');
        console.log('Commandes de redémarrage :');
        console.log('- npm run dev (nouveau terminal)');
        console.log('- ou utilisez le script de nettoyage : npm run fresh');
        
    } else {
        console.log('⚠️  Firebase semble déjà activé ou structure différente');
        console.log('🔍 Vérifiez manuellement src/lib/hybrid-quiz-service.ts');
    }
    
} catch (error) {
    console.error('❌ Erreur lors de la réactivation :', error.message);
    console.log('🔧 Activez manuellement en modifiant hybrid-quiz-service.ts');
    console.log('   Changez: this.useFirebase = false;');
    console.log('   En:      this.checkFirebaseAvailability();');
}