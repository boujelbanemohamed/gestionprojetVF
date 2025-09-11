#!/bin/bash

# Script de déploiement pour le domaine www.gestionprojetsmt.online
echo "🚀 Déploiement de l'application sur www.gestionprojetsmt.online"

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: Veuillez exécuter ce script depuis la racine du projet"
    exit 1
fi

# Construire l'application
echo "📦 Construction de l'application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de la construction de l'application"
    exit 1
fi

# Vérifier que le build a réussi
if [ ! -d "dist" ]; then
    echo "❌ Erreur: Le dossier dist n'existe pas"
    exit 1
fi

echo "✅ Application construite avec succès"

# Déployer sur Vercel
echo "🌐 Déploiement sur Vercel..."
npx vercel --prod

if [ $? -eq 0 ]; then
    echo "✅ Déploiement réussi!"
    echo "🔗 Votre application est disponible sur: https://www.gestionprojetsmt.online"
    echo ""
    echo "📋 Prochaines étapes:"
    echo "1. Vérifiez que le domaine est correctement configuré dans Vercel"
    echo "2. Testez l'application sur le nouveau domaine"
    echo "3. Configurez les variables d'environnement si nécessaire"
    echo "4. Mettez à jour la configuration Supabase avec le nouveau domaine"
else
    echo "❌ Erreur lors du déploiement"
    exit 1
fi
