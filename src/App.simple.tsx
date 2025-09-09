import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabase';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('test@test.com');
  const [password, setPassword] = useState('password123');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
      
      if (!user) {
        setIsLoginModalOpen(true);
      }
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);
        setIsLoginModalOpen(!session?.user);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert('Erreur de connexion: ' + error.message);
    } else {
      setUser(data.user);
      setIsLoginModalOpen(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsLoginModalOpen(true);
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div>Chargement...</div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
      {user ? (
        <div>
          <h1>🎉 Bienvenue dans votre Application de Gestion de Projets !</h1>
          <p>Connecté en tant que : <strong>{user.email}</strong></p>
          <button 
            onClick={handleLogout}
            style={{
              padding: '10px 20px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Se déconnecter
          </button>
          
          <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
            <h2>🚀 Prêt pour le déploiement !</h2>
            <p>Votre application fonctionne parfaitement en local.</p>
            <p>Vous pouvez maintenant la déployer sur Vercel !</p>
          </div>
        </div>
      ) : (
        <div>
          <h1>Application de Gestion de Projets</h1>
          <p>Veuillez vous connecter :</p>
          
          <form onSubmit={handleLogin} style={{ maxWidth: '400px' }}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Email :</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '5px'
                }}
                required
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Mot de passe :</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '5px'
                }}
                required
              />
            </div>
            
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Se connecter
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;
