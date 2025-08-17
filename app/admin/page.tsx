'use client'

import { useEffect, useState } from 'react'
import { auth, db } from '../../lib/firebase'
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore'

export default function Admin() {
  const [user, setUser] = useState(null)
  const [testData, setTestData] = useState([])
  const [newItem, setNewItem] = useState('')

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user)
    })

    loadTestData()

    return () => unsubscribe()
  }, [])

  const loadTestData = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'test'))
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setTestData(data)
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    }
  }

  const addTestItem = async () => {
    if (!newItem.trim()) return

    try {
      await addDoc(collection(db, 'test'), {
        name: newItem,
        createdAt: new Date(),
        type: 'test-item'
      })
      setNewItem('')
      loadTestData()
      console.log('✅ Item ajouté avec succès!')
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout:', error)
    }
  }

  const deleteTestItem = async (id) => {
    try {
      await deleteDoc(doc(db, 'test', id))
      loadTestData()
      console.log('✅ Item supprimé avec succès!')
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error)
    }
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>⚙️ Administration Firebase Studio</h1>
      
      <div style={{ marginTop: '2rem' }}>
        <h2>👤 Utilisateur actuel</h2>
        <div style={{ 
          padding: '1rem', 
          borderRadius: '8px', 
          backgroundColor: '#e2e3e5',
          border: '1px solid #d6d8db'
        }}>
          {user ? user.email : 'Non connecté'}
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2>🗄️ Test Firestore Database</h2>
        
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Nom du nouvel item"
            style={{
              padding: '0.5rem',
              marginRight: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
          <button
            onClick={addTestItem}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Ajouter
          </button>
        </div>

        <div>
          <h3>Items dans la collection 'test':</h3>
          {testData.length === 0 ? (
            <p>Aucun item trouvé. Ajoutez-en un pour tester Firestore!</p>
          ) : (
            <ul>
              {testData.map((item) => (
                <li key={item.id} style={{ marginBottom: '0.5rem' }}>
                  <span>{item.name}</span>
                  <button
                    onClick={() => deleteTestItem(item.id)}
                    style={{
                      marginLeft: '1rem',
                      padding: '0.25rem 0.5rem',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Supprimer
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <a 
          href="/"
          style={{
            display: 'inline-block',
            padding: '0.5rem 1rem',
            backgroundColor: '#28a745',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px'
          }}
        >
          ← Retour à l'accueil
        </a>
      </div>
    </main>
  )
}