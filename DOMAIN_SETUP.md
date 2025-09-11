# Configuration du Domaine - www.gestionprojetsmt.online

## 🌐 Domaine Principal
- **URL de production** : https://www.gestionprojetsmt.online
- **Domaine alternatif** : https://gestionprojetsmt.online (redirige vers www)

## 📋 Configuration Vercel

### 1. Configuration du Projet
Le fichier `vercel.json` a été mis à jour avec :
- Nom du projet : `gestion-projets-mt`
- Alias de domaine : `www.gestionprojetsmt.online` et `gestionprojetsmt.online`
- Headers de sécurité configurés

### 2. Variables d'Environnement
Assurez-vous que les variables suivantes sont configurées dans Vercel :

```bash
VITE_APP_NAME=Gestion Projets MT
VITE_APP_DOMAIN=www.gestionprojetsmt.online
VITE_APP_URL=https://www.gestionprojetsmt.online
VITE_SUPABASE_URL=https://gcrmagqcfdkouvxdmetq.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🔧 Configuration Supabase

### 1. Mise à jour des URLs autorisées
Dans le dashboard Supabase, ajoutez les URLs suivantes :

**Authentication > URL Configuration:**
- Site URL: `https://www.gestionprojetsmt.online`
- Redirect URLs: 
  - `https://www.gestionprojetsmt.online/**`
  - `https://gestionprojetsmt.online/**`

**API > CORS:**
- `https://www.gestionprojetsmt.online`
- `https://gestionprojetsmt.online`

### 2. Configuration RLS
Vérifiez que les politiques RLS sont correctement configurées pour le nouveau domaine.

## 🚀 Déploiement

### Méthode 1: Script automatique
```bash
./scripts/deploy-domain.sh
```

### Méthode 2: Déploiement manuel
```bash
npm run build
npx vercel --prod
```

## 🔍 Vérifications Post-Déploiement

### 1. Test de l'Application
- [ ] L'application se charge correctement sur https://www.gestionprojetsmt.online
- [ ] La redirection fonctionne depuis gestionprojetsmt.online vers www.gestionprojetsmt.online
- [ ] L'authentification fonctionne
- [ ] Toutes les fonctionnalités sont opérationnelles

### 2. Test de Performance
- [ ] Temps de chargement acceptable
- [ ] Images et assets se chargent correctement
- [ ] Pas d'erreurs dans la console

### 3. Test de Sécurité
- [ ] HTTPS fonctionne correctement
- [ ] Headers de sécurité sont présents
- [ ] CORS est correctement configuré

## 📱 SEO et Métadonnées

### Métadonnées configurées :
- **Title** : Gestion Projets MT - Plateforme de Gestion de Projets
- **Description** : Plateforme de gestion de projets pour l'entreprise MT
- **Keywords** : gestion projets, management, MT, entreprise, tâches, budget, équipe
- **Open Graph** : Configuré pour les réseaux sociaux
- **Twitter Cards** : Configuré pour Twitter

### URLs canoniques :
- URL canonique : https://www.gestionprojetsmt.online/
- Redirection automatique depuis gestionprojetsmt.online

## 🛠️ Maintenance

### Mise à jour du domaine
Si vous devez changer de domaine, mettez à jour :
1. `vercel.json` - alias et nom du projet
2. `src/config/domain.ts` - configuration du domaine
3. `index.html` - métadonnées et URLs
4. `package.json` - homepage et description
5. Configuration Supabase - URLs autorisées

### Monitoring
- Surveillez les logs Vercel pour les erreurs
- Vérifiez les métriques de performance
- Testez régulièrement l'authentification

## 📞 Support

En cas de problème avec le domaine :
1. Vérifiez la configuration DNS
2. Vérifiez les variables d'environnement Vercel
3. Vérifiez la configuration Supabase
4. Consultez les logs de déploiement Vercel
