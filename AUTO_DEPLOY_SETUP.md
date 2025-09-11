# Configuration du Déploiement Automatique - www.gestionprojetsmt.online

## 🚀 Déploiement Automatique Configuré

Votre application est maintenant configurée pour se déployer automatiquement sur `https://www.gestionprojetsmt.online/` à chaque push sur la branche `main`.

## 📋 Configuration Actuelle

### ✅ Ce qui est configuré :
- **GitHub Actions** : Workflow de déploiement automatique
- **Vercel** : Projet `gestion-projets-mt` créé
- **Scripts** : Scripts de déploiement automatisés
- **Domaine** : `www.gestionprojetsmt.online` (à configurer dans Vercel)

## 🔧 Configuration Vercel (À FAIRE)

### 1. Accédez à votre Dashboard Vercel
1. Allez sur [vercel.com/dashboard](https://vercel.com/dashboard)
2. Sélectionnez le projet `gestion-projets-mt`

### 2. Configurez le Domaine Personnalisé
1. Allez dans **Settings > Domains**
2. Ajoutez `www.gestionprojetsmt.online` comme domaine principal
3. Ajoutez `gestionprojetsmt.online` comme domaine secondaire (redirige vers www)

### 3. Configurez les Variables d'Environnement
Dans **Settings > Environment Variables**, ajoutez :

```bash
VITE_APP_NAME=Gestion Projets MT
VITE_APP_DOMAIN=www.gestionprojetsmt.online
VITE_APP_URL=https://www.gestionprojetsmt.online
VITE_SUPABASE_URL=https://gcrmagqcfdkouvxdmetq.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Configurez GitHub Integration
1. Allez dans **Settings > Git**
2. Connectez votre repository GitHub : `boujelbanemohamed/gestionprojetVF`
3. Activez le déploiement automatique sur la branche `main`

## 🔄 Comment ça fonctionne

### Déploiement Automatique :
1. **Push sur `main`** → GitHub détecte les changements
2. **GitHub Actions** → Lance le workflow de déploiement
3. **Vercel** → Déploie automatiquement l'application
4. **Domaine** → Application disponible sur `www.gestionprojetsmt.online`

### Déploiement Manuel :
```bash
# Option 1: Script automatique
./scripts/auto-deploy.sh

# Option 2: Commandes manuelles
git add .
git commit -m "Your changes"
git push origin main
```

## 📁 Fichiers de Configuration

### `.github/workflows/deploy.yml`
- Workflow GitHub Actions pour le déploiement automatique
- Se déclenche sur push vers `main`
- Build et déploie automatiquement

### `scripts/auto-deploy.sh`
- Script de déploiement manuel
- Build, commit, et push automatiques
- Utilisable pour les déploiements rapides

### `vercel.json`
- Configuration Vercel
- Headers de sécurité
- Redirections et réécritures

## 🧪 Test du Déploiement

### 1. Test Manuel
```bash
# Modifier un fichier
echo "// Test deployment" >> src/test.js

# Déployer
./scripts/auto-deploy.sh
```

### 2. Vérification
1. Attendez 1-2 minutes
2. Visitez `https://www.gestionprojetsmt.online`
3. Vérifiez que les changements sont visibles

## 🔍 Monitoring

### Vercel Dashboard
- **Deployments** : Historique des déploiements
- **Analytics** : Métriques de performance
- **Functions** : Logs des fonctions serverless

### GitHub Actions
- **Actions** : Historique des workflows
- **Logs** : Détails des déploiements
- **Status** : Succès/échec des déploiements

## 🚨 Dépannage

### Problème : Déploiement échoue
1. Vérifiez les logs GitHub Actions
2. Vérifiez les variables d'environnement Vercel
3. Vérifiez la configuration du domaine

### Problème : Domaine non accessible
1. Vérifiez la configuration DNS
2. Vérifiez les certificats SSL
3. Vérifiez la configuration du domaine dans Vercel

### Problème : Changements non visibles
1. Vérifiez que le push a réussi
2. Attendez 1-2 minutes pour le déploiement
3. Videz le cache du navigateur

## 📞 Support

En cas de problème :
1. Consultez les logs Vercel
2. Consultez les logs GitHub Actions
3. Vérifiez la configuration du domaine
4. Testez avec le script de déploiement manuel

---

**🎉 Votre application est maintenant configurée pour le déploiement automatique !**

Chaque modification poussée sur la branche `main` sera automatiquement déployée sur `https://www.gestionprojetsmt.online/`.
