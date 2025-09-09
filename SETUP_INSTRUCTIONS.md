# Instructions de Configuration du Projet

## 🎉 Projet Démarré avec Succès !

Votre application de gestion de projets est maintenant en cours d'exécution :

- **Frontend** : http://localhost:5173 ✅
- **Backend** : Non démarré (nécessite Docker/PostgreSQL)

## 🔧 Configuration Supabase Requise

Pour que l'application fonctionne complètement, vous devez configurer Supabase :

### 1. Créer un projet Supabase
1. Allez sur [https://supabase.com](https://supabase.com)
2. Créez un compte ou connectez-vous
3. Cliquez sur "New Project"
4. Suivez les étapes de création

### 2. Récupérer les clés
1. Dans votre dashboard Supabase, allez dans **Settings** > **API**
2. Copiez :
   - **Project URL** (ex: `https://abcdefgh.supabase.co`)
   - **anon public key** (commence par `eyJhbGciOiJIUzI1NiIs...`)

### 3. Créer le fichier .env
Créez un fichier `.env` à la racine du projet avec :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anonyme-ici
```

### 4. Configurer la base de données
Suivez les instructions dans `docs/SUPABASE_SETUP.md` pour :
- Créer les tables
- Configurer les politiques RLS
- Insérer les données de test

## 🚀 Utilisation

1. **Accédez à l'application** : http://localhost:5173
2. **Configurez Supabase** selon les étapes ci-dessus
3. **Redémarrez le serveur** après avoir créé le fichier .env :
   ```bash
   # Arrêter le serveur (Ctrl+C)
   npm run dev
   ```

## 📋 Fonctionnalités Disponibles

- ✅ Interface utilisateur moderne
- ✅ Gestion des projets et tâches
- ✅ Système de rôles (Admin, Utilisateur)
- ✅ Tableau de bord Kanban
- ✅ Export Excel
- ⏳ Authentification (nécessite Supabase)
- ⏳ Base de données (nécessite Supabase)

## 🔍 Dépannage

### Erreur "Variables d'environnement Supabase manquantes"
- Vérifiez que le fichier `.env` existe
- Vérifiez que les variables commencent par `VITE_`
- Redémarrez le serveur après modification

### L'application ne se connecte pas à Supabase
- Vérifiez que l'URL et la clé sont correctes
- Vérifiez que votre projet Supabase est actif
- Consultez la console du navigateur pour les erreurs

## 📞 Support

Pour plus d'aide :
- Consultez `docs/SUPABASE_SETUP.md`
- Consultez `docs/ENV_SETUP.md`
- Vérifiez les logs dans la console du navigateur
