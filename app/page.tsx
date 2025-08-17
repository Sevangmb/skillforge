'use client'

import { useEffect, useState } from 'react'
import { auth, db } from '../lib/firebase'
import { collection, getDocs } from 'firebase/firestore'

export default function Home() {
  const [isConnected, setIsConnected] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Tester la connexion Firebase
    const testFirebaseConnection = async () => {
      try {
        // Tester Firestore
        const testCollection = collection(db, 'test')
        await getDocs(testCollection)
        setIsConnected(true)
        console.log('✅ Firebase connecté avec succès!')
      } catch (error) {
        console.error('❌ Erreur de connexion Firebase:', error)
        setIsConnected(false)
      }
    }

    // Observer l'état d'authentification
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user)
    })

    testFirebaseConnection()

    return () => unsubscribe()
  }, [])

  return (
    <main style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>🔥 SkillForge - Firebase Studio</h1>
      
      <div style={{ marginTop: '2rem' }}>
        <h2>🔗 État de la connexion</h2>
        <div style={{ 
          padding: '1rem', 
          borderRadius: '8px', 
          backgroundColor: isConnected ? '#d4edda' : '#f8d7da',
          border: `1px solid ${isConnected ? '#c3e6cb' : '#f5c6cb'}`,
          color: isConnected ? '#155724' : '#721c24'
        }}>
          {isConnected ? '✅ Firebase connecté' : '❌ Firebase déconnecté'}
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2>👤 Authentification</h2>
        <div style={{ 
          padding: '1rem', 
          borderRadius: '8px', 
          backgroundColor: '#e2e3e5',
          border: '1px solid #d6d8db'
        }}>
          {user ? `Connecté en tant que: ${user.email}` : 'Non connecté'}
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2>🛠️ Services Firebase</h2>
        <ul>
          <li>🔥 Firestore Database: {isConnected ? 'Opérationnel' : 'En attente'}</li>
          <li>🔐 Authentication: Configuré</li>
          <li>📦 Storage: Configuré</li>
          <li>🚀 Hosting: Prêt pour le déploiement</li>
        </ul>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2>📝 Prochaines étapes</h2>
        <ol>
          <li>Configurer les clés Firebase dans .env.local</li>
          <li>Créer le projet dans Firebase Console</li>
          <li>Activer Firestore Database</li>
          <li>Activer Authentication</li>
          <li>Déployer sur Firebase Hosting</li>
        </ol>
      </div>
    </main>
  )
}