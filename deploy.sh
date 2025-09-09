#!/bin/bash

# 🚀 Script de déploiement cloud rapide
# Usage: ./deploy.sh [netlify|vercel|github]

echo "🚀 Déploiement de votre application 100% cloud..."

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: Exécutez ce script depuis la racine du projet"
    exit 1
fi

# Build de production
print_status "Construction de l'application..."
npm run build

if [ $? -eq 0 ]; then
    print_success "Build réussi !"
else
    echo "❌ Erreur lors du build"
    exit 1
fi

# Vérifier que le dossier dist existe
if [ ! -d "dist" ]; then
    echo "❌ Erreur: Le dossier dist n'existe pas"
    exit 1
fi

print_success "Dossier dist créé avec succès !"

# Afficher les options de déploiement
echo ""
echo "🎯 Options de déploiement disponibles :"
echo "1. Netlify (Recommandé - Gratuit et simple)"
echo "2. Vercel (Alternative - Gratuit)"
echo "3. GitHub Pages (Gratuit avec GitHub)"
echo "4. Manuel (Upload du dossier dist/)"
echo ""

# Si un argument est fourni, utiliser cette option
if [ $# -eq 1 ]; then
    DEPLOY_OPTION=$1
else
    read -p "Choisissez une option (1-4): " DEPLOY_OPTION
fi

case $DEPLOY_OPTION in
    1|netlify)
        print_status "Déploiement sur Netlify..."
        echo ""
        echo "📋 Instructions pour Netlify :"
        echo "1. Allez sur https://netlify.com"
        echo "2. Créez un compte ou connectez-vous"
        echo "3. Glissez-déposez le dossier 'dist/' dans la zone de déploiement"
        echo "4. Ou connectez votre repo GitHub pour un déploiement automatique"
        echo ""
        echo "🔧 Variables d'environnement à ajouter dans Netlify :"
        echo "VITE_SUPABASE_URL=https://gcrmagqcfdkouvxdmetq.supabase.co"
        echo "VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdjcm1hZ3FjZmRrb3V2eGRtZXRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NzA0NzEsImV4cCI6MjA3MjI0NjQ3MX0.ldh_7ybh_yGyEB2h2wcroikF6bCOdpuNxwN1CI-l9Zo"
        ;;
    2|vercel)
        print_status "Déploiement sur Vercel..."
        echo ""
        echo "📋 Instructions pour Vercel :"
        echo "1. Installez Vercel CLI: npm i -g vercel"
        echo "2. Exécutez: vercel --prod"
        echo "3. Suivez les instructions à l'écran"
        echo ""
        echo "🔧 Variables d'environnement à ajouter dans Vercel :"
        echo "VITE_SUPABASE_URL=https://gcrmagqcfdkouvxdmetq.supabase.co"
        echo "VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdjcm1hZ3FjZmRrb3V2eGRtZXRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NzA0NzEsImV4cCI6MjA3MjI0NjQ3MX0.ldh_7ybh_yGyEB2h2wcroikF6bCOdpuNxwN1CI-l9Zo"
        ;;
    3|github)
        print_status "Déploiement sur GitHub Pages..."
        echo ""
        echo "📋 Instructions pour GitHub Pages :"
        echo "1. Créez un repo GitHub"
        echo "2. Uploadez le contenu du dossier 'dist/'"
        echo "3. Activez GitHub Pages dans les settings du repo"
        echo "4. Configurez les variables d'environnement si possible"
        ;;
    4|manuel)
        print_status "Déploiement manuel..."
        echo ""
        echo "📁 Le dossier 'dist/' est prêt pour upload :"
        echo "   - Taille: $(du -sh dist | cut -f1)"
        echo "   - Fichiers: $(find dist -type f | wc -l)"
        echo ""
        echo "🔧 N'oubliez pas de configurer les variables d'environnement :"
        echo "VITE_SUPABASE_URL=https://gcrmagqcfdkouvxdmetq.supabase.co"
        echo "VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdjcm1hZ3FjZmRrb3V2eGRtZXRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NzA0NzEsImV4cCI6MjA3MjI0NjQ3MX0.ldh_7ybh_yGyEB2h2wcroikF6bCOdpuNxwN1CI-l9Zo"
        ;;
    *)
        echo "❌ Option invalide"
        exit 1
        ;;
esac

echo ""
print_success "🎉 Votre application est prête pour le déploiement cloud !"
echo ""
echo "📊 Résumé de votre solution 100% cloud :"
echo "   ✅ Frontend: React + Vite (dossier dist/ prêt)"
echo "   ✅ Backend: Supabase (déjà configuré)"
echo "   ✅ Base de données: PostgreSQL (déjà configuré)"
echo "   ✅ Authentification: Supabase Auth (déjà configuré)"
echo "   ✅ Stockage: Supabase Storage (déjà configuré)"
echo "   ✅ API: REST auto-générée (déjà configuré)"
echo "   ✅ Temps réel: WebSockets (déjà configuré)"
echo ""
echo "🚀 Il ne vous reste plus qu'à déployer le frontend !"
