import React from 'react';

function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🎉 Application de Gestion de Projets</h1>
      <p>L'application React fonctionne !</p>
      <p>Vous pouvez maintenant vous connecter :</p>
      <ul>
        <li>Email : test@test.com</li>
        <li>Mot de passe : password123</li>
      </ul>
      <button 
        onClick={() => alert('Bouton fonctionnel !')}
        style={{
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Tester
      </button>
    </div>
  );
}

export default App;
