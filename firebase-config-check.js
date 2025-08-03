#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔥 Firebase Configuration Checker for SkillForge\n');

// Check Firebase CLI installation
try {
  const version = execSync('firebase --version', { encoding: 'utf8' });
  console.log(`✅ Firebase CLI installed: ${version.trim()}`);
} catch (error) {
  console.log('❌ Firebase CLI not installed');
  process.exit(1);
}

// Check authentication
try {
  const projects = execSync('firebase projects:list', { encoding: 'utf8' });
  console.log('✅ Firebase CLI authenticated');
  console.log('📋 Available projects:');
  console.log(projects);
} catch (error) {
  console.log('❌ Firebase CLI not authenticated');
  console.log('Run: firebase login');
  process.exit(1);
}

// Check current project
try {
  const currentProject = execSync('firebase use', { encoding: 'utf8' });
  console.log(`🎯 Current project: ${currentProject.trim()}`);
} catch (error) {
  console.log('⚠️  No project selected');
}

// Check firebase.json configuration
if (fs.existsSync('./firebase.json')) {
  console.log('✅ firebase.json exists');
  const config = JSON.parse(fs.readFileSync('./firebase.json', 'utf8'));
  
  if (config.firestore) {
    console.log('✅ Firestore configuration found');
  }
  
  if (config.hosting) {
    console.log('✅ Hosting configuration found');
  }
  
  if (config.emulators) {
    console.log('✅ Emulators configuration found');
  }
} else {
  console.log('❌ firebase.json not found');
}

// Check environment variables
const envFile = '.env.local';
if (fs.existsSync(envFile)) {
  console.log('✅ .env.local exists');
  const env = fs.readFileSync(envFile, 'utf8');
  
  const requiredVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID'
  ];
  
  let missingVars = [];
  requiredVars.forEach(varName => {
    if (!env.includes(varName)) {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length === 0) {
    console.log('✅ All required environment variables present');
  } else {
    console.log(`❌ Missing environment variables: ${missingVars.join(', ')}`);
  }
} else {
  console.log('❌ .env.local not found');
}

console.log('\n🔗 Firebase Console URLs:');
console.log('   - Project: https://console.firebase.google.com/project/skillforge-ai-tk7mp/overview');
console.log('   - Auth: https://console.firebase.google.com/project/skillforge-ai-tk7mp/authentication');
console.log('   - Firestore: https://console.firebase.google.com/project/skillforge-ai-tk7mp/firestore');
console.log('   - Hosting: https://console.firebase.google.com/project/skillforge-ai-tk7mp/hosting');

console.log('\n📝 Next Steps:');
console.log('1. Enable Email/Password authentication in Firebase Console');
console.log('2. Add localhost to authorized domains');
console.log('3. Test authentication flow');
console.log('4. Deploy to Firebase Hosting when ready');