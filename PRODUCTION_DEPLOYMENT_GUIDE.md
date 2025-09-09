# 🚀 Guide de Déploiement en Production

## ✅ **Checklist de pré-déploiement**

Avant de commencer, assurez-vous que :
- [ ] Tous les tests passent (`npm test`)
- [ ] Le build fonctionne (`npm run build`)
- [ ] Vous avez un compte Supabase

---

## 📋 **Étape 1 : Configuration Supabase**

### A. Créer un projet Supabase

1. **Allez sur [supabase.com](https://supabase.com)**
2. **Créez un compte** ou connectez-vous
3. **Cliquez sur "New Project"**
4. **Configurez votre projet :**
   - Nom : `gestion-projets-prod`
   - Organisation : Votre organisation
   - Région : Choisissez la plus proche de vos utilisateurs
   - Mot de passe : Créez un mot de passe sécurisé

### B. Exécuter le script SQL

1. **Dans votre dashboard Supabase, allez dans "SQL Editor"**
2. **Copiez le contenu du fichier `supabase/migrations/create_complete_schema.sql`**
3. **Collez et exécutez le script**
4. **Vérifiez que toutes les tables sont créées sans erreur**

### C. Configurer l'authentification

1. **Allez dans "Authentication" > "Settings"**
2. **Dans "Site URL", ajoutez :**
   - Développement : `http://localhost:5173`
   - Production : `https://votre-domaine.com`
3. **Dans "Redirect URLs", ajoutez les mêmes URLs**
4. **Désactivez "Enable email confirmations"** (optionnel pour simplifier)

### D. Configurer le stockage

1. **Allez dans "Storage"**
2. **Créez un bucket appelé "attachments"**
3. **Configurez les politiques** (déjà incluses dans le script SQL)

---

## 🔑 **Étape 2 : Récupérer les clés**

1. **Dans votre dashboard Supabase, allez dans "Settings" > "API"**
2. **Copiez ces valeurs :**
   - **Project URL** : `https://votre-projet.supabase.co`
   - **anon public key** : La longue clé commençant par `eyJhbGciOiJIUzI1NiIs...`

---

## 🌐 **Étape 3 : Déploiement**

### Option A : Netlify (Recommandé)

#### 1. Build local
```bash
npm run build
```

#### 2. Déployer sur Netlify
- **Méthode 1 :** Glissez-déposez le dossier `dist/` sur [netlify.com](https://netlify.com)
- **Méthode 2 :** CLI Netlify
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod --dir=dist
```

#### 3. Configurer les variables d'environnement
1. **Dans votre dashboard Netlify :**
   - Site settings > Environment variables
2. **Ajoutez :**
   - `VITE_SUPABASE_URL` = votre URL Supabase
   - `VITE_SUPABASE_ANON_KEY` = votre clé anonyme
3. **Redéployez**

### Option B : Vercel

#### 1. Avec l'interface web
1. **Connectez votre repo GitHub à [vercel.com](https://vercel.com)**
2. **Dans Settings > Environment Variables, ajoutez :**
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. **Redéployez depuis l'onglet Deployments**

#### 2. Avec Vercel CLI
```bash
npm install -g vercel
vercel --prod
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
```

---

## 👤 **Étape 4 : Premier utilisateur**

### Créer le Super Admin

1. **Allez sur votre application en production**
2. **Créez un compte avec votre email**
3. **Dans Supabase SQL Editor, exécutez :**

```sql
-- Mettre à jour le rôle du premier utilisateur
UPDATE users 
SET role = 'SUPER_ADMIN' 
WHERE email = 'votre-email@example.com';
```

4. **Reconnectez-vous** pour que les permissions prennent effet

---

## 🧪 **Étape 5 : Tests de production**

### Tests essentiels à effectuer :

- [ ] **Connexion/inscription** fonctionne
- [ ] **Création de départements** (IT, Design, Marketing, etc.)
- [ ] **Création de membres** avec différents rôles
- [ ] **Création de projets** avec budget et dates
- [ ] **Création de tâches** et assignation
- [ ] **Commentaires** et pièces jointes
- [ ] **Export Excel/PDF** fonctionne
- [ ] **Gestion budgétaire** opérationnelle
- [ ] **PV de réunions** fonctionnel

---

## 🔒 **Étape 6 : Sécurité finale**

### Dans Supabase :
1. **Vérifiez que RLS est activé** sur toutes les tables
2. **Testez les permissions** avec différents rôles
3. **Configurez les domaines autorisés** dans Authentication

### Dans votre application :
1. **Vérifiez qu'aucune clé secrète** n'est exposée
2. **Testez sur différents navigateurs**
3. **Vérifiez la responsivité mobile**

---

## 🎉 **Félicitations !**

Votre application est maintenant en production !

### 📞 **Support**

Si vous rencontrez des problèmes :
- Consultez les logs Supabase dans le dashboard
- Vérifiez la console du navigateur
- Consultez `PRODUCTION_CHECKLIST.md` pour la checklist complète

---

**Temps estimé total : 30-45 minutes**

**URL de production :** `https://votre-app.netlify.app` ou `https://votre-app.vercel.app`