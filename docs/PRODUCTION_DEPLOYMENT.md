# Guide de Déploiement en Production

## 🎯 **Étapes pour la mise en production**

### 1. **Configuration Supabase** ⚡

#### A. Créer un projet Supabase
1. Allez sur [supabase.com](https://supabase.com)
2. Créez un compte ou connectez-vous
3. Cliquez sur "New Project"
4. Donnez un nom à votre projet (ex: "gestion-projets-prod")
5. Choisissez une région proche de vos utilisateurs
6. Créez un mot de passe sécurisé pour la base de données

#### B. Configurer la base de données
1. Dans le dashboard Supabase, allez dans **SQL Editor**
2. Copiez et exécutez le contenu du fichier `supabase/migrations/create_complete_schema.sql`
3. Vérifiez que toutes les tables sont créées sans erreur

#### C. Configurer l'authentification
1. Allez dans **Authentication** > **Settings**
2. Dans **Site URL**, ajoutez votre domaine de production
3. Dans **Redirect URLs**, ajoutez les mêmes URLs
4. Désactivez "Enable email confirmations" pour simplifier (optionnel)

#### D. Configurer le stockage
1. Allez dans **Storage**
2. Créez un bucket appelé "attachments"
3. Configurez les politiques de sécurité :

```sql
-- Politique pour permettre l'upload aux utilisateurs authentifiés
CREATE POLICY "Utilisateurs authentifiés peuvent uploader"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'attachments');

-- Politique pour permettre la lecture aux utilisateurs authentifiés
CREATE POLICY "Utilisateurs authentifiés peuvent lire"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'attachments');
```

### 2. **Récupérer les clés Supabase** 🔑

1. Dans votre dashboard Supabase, allez dans **Settings** > **API**
2. Copiez ces deux valeurs :
   - **Project URL** : `https://votre-projet.supabase.co`
   - **anon public key** : La longue clé commençant par `eyJhbGciOiJIUzI1NiIs...`

### 3. **Déploiement sur Netlify** 🚀

#### A. Préparer le build
```bash
npm run build
```

#### B. Déployer sur Netlify

**Option 1 : Interface Web**
1. Allez sur [netlify.com](https://netlify.com)
2. Glissez-déposez le dossier `dist/` sur Netlify
3. Votre site sera déployé avec une URL temporaire

**Option 2 : CLI Netlify**
```bash
# Installer Netlify CLI
npm install -g netlify-cli

# Se connecter
netlify login

# Déployer
netlify deploy --prod --dir=dist
```

#### C. Configurer les variables d'environnement
1. Dans votre dashboard Netlify, allez dans **Site settings**
2. Cliquez sur **Environment variables**
3. Ajoutez ces variables :
   - `VITE_SUPABASE_URL` = votre URL Supabase
   - `VITE_SUPABASE_ANON_KEY` = votre clé anonyme

#### D. Redéployer avec les variables
```bash
netlify deploy --prod
```

### 4. **Déploiement sur Vercel** ⚡

#### A. Avec l'interface web
1. Connectez votre repo GitHub à [vercel.com](https://vercel.com)
2. Dans **Settings** > **Environment Variables**, ajoutez :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Redéployez depuis l'onglet **Deployments**

#### B. Avec Vercel CLI
```bash
# Installer Vercel CLI
npm install -g vercel

# Déployer
vercel --prod

# Ajouter les variables d'environnement
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
```

### 5. **Configuration finale dans Supabase** 🔒

1. Retournez dans **Authentication** > **Settings**
2. Mettez à jour les **Site URL** et **Redirect URLs** avec votre domaine de production
3. Exemple : `https://votre-app.netlify.app` ou `https://votre-app.vercel.app`

### 6. **Créer le premier utilisateur Super Admin** 👤

1. Allez sur votre application en production
2. Créez un compte avec votre email
3. Dans Supabase, allez dans **SQL Editor** et exécutez :

```sql
-- Mettre à jour le rôle du premier utilisateur
UPDATE users 
SET role = 'SUPER_ADMIN' 
WHERE email = 'votre-email@example.com';
```

### 7. **Tests de production** ✅

Vérifiez que tout fonctionne :
- [ ] Connexion/inscription
- [ ] Création de départements
- [ ] Création de membres
- [ ] Création de projets
- [ ] Création de tâches
- [ ] Upload de fichiers
- [ ] Commentaires
- [ ] Export Excel/PDF

## 🔧 **Dépannage**

### Erreur de connexion Supabase
- Vérifiez que les variables d'environnement sont correctes
- Vérifiez que l'URL ne se termine pas par `/`
- Vérifiez que votre domaine est autorisé dans Supabase

### Erreur RLS (Row Level Security)
- Vérifiez que les politiques sont bien créées
- Vérifiez que l'utilisateur a le bon rôle dans la table `users`

### Erreur d'upload de fichiers
- Vérifiez que le bucket "attachments" existe
- Vérifiez les politiques de stockage

## 📞 **Support**

Si vous rencontrez des problèmes :
1. Consultez les logs dans le dashboard Supabase
2. Vérifiez la console du navigateur
3. Consultez la documentation Supabase

---

🎉 **Votre application sera en production en moins de 30 minutes !**