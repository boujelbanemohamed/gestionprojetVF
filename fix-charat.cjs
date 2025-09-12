const fs = require('fs');
const path = require('path');

// Liste des fichiers à corriger
const files = [
  'src/components/TaskModal.tsx',
  'src/components/TaskCard.tsx',
  'src/components/TaskDetailsModal.tsx',
  'src/components/KanbanTaskCard.tsx',
  'src/components/ProjectMembersManagementModal.tsx',
  'src/components/ProjectMembersModal.tsx',
  'src/components/MemberProjectsModal.tsx',
  'src/components/MembersManagement.tsx',
  'src/components/PermissionsSettings.tsx',
  'src/components/UserProfileModal.tsx',
  'src/components/DepartmentMembersModal.tsx',
  'src/components/MeetingMinutesPage.tsx',
  'src/components/TaskHistoryModal.tsx',
  'src/components/TaskCommentsModal.tsx'
];

// Fonction pour corriger un fichier
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Ajouter l'import si nécessaire
    if (!content.includes('getUserInitials') && content.includes('.charAt(')) {
      const importMatch = content.match(/import.*from.*['"]\.\.\/types['"];?/);
      if (importMatch) {
        content = content.replace(
          importMatch[0],
          importMatch[0] + '\nimport { getUserInitials } from \'../utils/stringUtils\';'
        );
      }
    }
    
    // Remplacer les patterns charAt
    content = content.replace(
      /(\w+)\.prenom\.charAt\(0\)(\w+)\.nom\.charAt\(0\)/g,
      'getUserInitials($1.prenom, $1.nom)'
    );
    
    content = content.replace(
      /(\w+)\.prenom\?\.charAt\(0\) \|\| 'U'(\w+)\.nom\?\.charAt\(0\) \|\| 'U'/g,
      'getUserInitials($1.prenom, $1.nom)'
    );
    
    content = content.replace(
      /(\w+)\.prenom\.charAt\(0\)(\w+)\.nom\.charAt\(0\)/g,
      'getUserInitials($1.prenom, $1.nom)'
    );
    
    // Remplacer les patterns simples
    content = content.replace(
      /(\w+)\.charAt\(0\)/g,
      'getFirstChar($1)'
    );
    
    // Ajouter l'import getFirstChar si nécessaire
    if (content.includes('getFirstChar') && !content.includes('getFirstChar')) {
      const importMatch = content.match(/import.*getUserInitials.*from.*['"]\.\.\/utils\/stringUtils['"];?/);
      if (importMatch) {
        content = content.replace(
          importMatch[0],
          importMatch[0].replace('getUserInitials', 'getUserInitials, getFirstChar')
        );
      }
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

// Corriger tous les fichiers
files.forEach(fixFile);
console.log('🎉 All files fixed!');
