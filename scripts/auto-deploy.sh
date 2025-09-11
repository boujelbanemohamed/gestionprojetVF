#!/bin/bash

# Script de déploiement automatique pour www.gestionprojetsmt.online
echo "🚀 Déploiement automatique vers www.gestionprojetsmt.online"

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: Veuillez exécuter ce script depuis la racine du projet"
    exit 1
fi

# Vérifier que git est configuré
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "❌ Erreur: Aucun remote git configuré"
    exit 1
fi

# Construire l'application
echo "📦 Construction de l'application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de la construction de l'application"
    exit 1
fi

echo "✅ Application construite avec succès"

# Ajouter tous les fichiers
echo "📝 Ajout des fichiers au git..."
git add .

# Commit avec un message automatique
echo "💾 Commit des modifications..."
git commit -m "Auto-deploy: $(date '+%Y-%m-%d %H:%M:%S')"

# Push vers GitHub (déclenchera le déploiement Vercel)
echo "🌐 Push vers GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    echo "✅ Déploiement automatique lancé!"
    echo "🔗 Votre application sera disponible sur: https://www.gestionprojetsmt.online"
    echo ""
    echo "📋 Prochaines étapes:"
    echo "1. Vercel détectera automatiquement les changements"
    echo "2. Le déploiement se lancera automatiquement"
    echo "3. L'application sera mise à jour sur www.gestionprojetsmt.online"
    echo ""
    echo "⏱️  Le déploiement prend généralement 1-2 minutes"
else
    echo "❌ Erreur lors du push vers GitHub"
    exit 1
fi
