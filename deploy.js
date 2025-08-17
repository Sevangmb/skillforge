const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Démarrage du déploiement Firebase...\n');

// Vérifier si .env.local existe
if (!fs.existsSync('.env.local')) {
  console.log('❌ Fichier .env.local manquant!');
  console.log('📝 Copiez .env.local.example vers .env.local et ajoutez vos clés Firebase');
  process.exit(1);
}

// Étapes de déploiement
const steps = [
  {
    name: 'Build Next.js',
    command: 'npm run build'
  },
  {
    name: 'Déploiement Firebase',
    command: 'firebase deploy'
  }
];

async function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
}

async function deploy() {
  for (const step of steps) {
    console.log(`📦 ${step.name}...`);
    try {
      const output = await runCommand(step.command);
      console.log(`✅ ${step.name} terminé!`);
      if (output) console.log(output);
    } catch (error) {
      console.log(`❌ Erreur lors de ${step.name}:`);
      console.error(error.message);
      process.exit(1);
    }
  }
  
  console.log('\n🎉 Déploiement terminé avec succès!');
  console.log('🔗 Votre app est maintenant disponible sur Firebase Hosting');
}

deploy();