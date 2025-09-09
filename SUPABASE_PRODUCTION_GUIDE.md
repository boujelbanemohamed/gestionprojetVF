# 🚀 Guide de Mise en Production avec Supabase

## ✅ **Étapes de déploiement**

### 1. **Créer un projet Supabase**

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un compte ou connectez-vous
3. Cliquez sur **"New Project"**
4. Configurez votre projet :
   - **Nom** : `gestion-projets-prod`
   - **Région** : Choisissez la plus proche de vos utilisateurs
   - **Mot de passe** : Créez un mot de passe sécurisé

### 2. **Exécuter les migrations SQL**

Dans l'ordre, exécutez ces fichiers dans le **SQL Editor** de Supabase :

1. `supabase/migrations/create_departments.sql`
2. `supabase/migrations/create_users.sql`
3. `supabase/migrations/create_projects.sql`
4. `supabase/migrations/create_tasks.sql`
5. `supabase/migrations/create_comments_and_attachments.sql`
6. `supabase/migrations/create_storage_policies.sql`
7. `supabase/migrations/create_budget_tables.sql`

### 3. **Configurer l'authentification**

1. Allez dans **Authentication** > **Settings**
2. Dans **Site URL**, ajoutez votre domaine de production
3. Dans **Redirect URLs**, ajoutez les mêmes URLs
4. Désactivez **"Enable email confirmations"** (optionnel)

### 4. **Récupérer les clés API**

1. Allez dans **Settings** > **API**
2. Copiez :
   - **Project URL** : `https://votre-projet.supabase.co`
   - **anon public key** : La longue clé JWT

### 5. **Déployer l'application**

#### **Option A : Netlify**
```bash
npm run build
# Déployez le dossier dist/ sur Netlify
```

#### **Option B : Vercel**
```bash
npm run build
# Déployez avec Vercel CLI ou interface web
```

### 6. **Configurer les variables d'environnement**

Sur votre plateforme de déploiement, ajoutez :
- `VITE_SUPABASE_URL` = votre URL Supabase
- `VITE_SUPABASE_ANON_KEY` = votre clé anonyme

### 7. **Créer le premier Super Admin**

1. Allez sur votre application en production
2. Créez un compte avec votre email
3. Dans Supabase SQL Editor, exécutez :

```sql
UPDATE users 
SET role = 'SUPER_ADMIN' 
WHERE email = 'votre-email@example.com';
```

### 8. **Tests de production**

Vérifiez que tout fonctionne :
- [ ] Connexion/inscription
- [ ] Création de départements
- [ ] Création de membres
- [ ] Création de projets
- [ ] Création de tâches
- [ ] Upload de fichiers
- [ ] Commentaires
- [ ] Export Excel/PDF

## 🎉 **Félicitations !**

Votre application est maintenant en production avec Supabase !

## 📞 **Support**

En cas de problème :
- Consultez les logs Supabase
- Vérifiez la console du navigateur
- Vérifiez que RLS est activé sur toutes les tables