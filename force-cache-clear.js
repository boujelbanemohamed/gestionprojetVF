// Script pour forcer le vidage du cache
console.log('🔄 Forçage du vidage du cache...');

// Vider le localStorage
localStorage.clear();

// Vider le sessionStorage
sessionStorage.clear();

// Vider le cache du service worker si présent
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister();
    });
  });
}

// Forcer le rechargement avec cache vidé
window.location.reload(true);
