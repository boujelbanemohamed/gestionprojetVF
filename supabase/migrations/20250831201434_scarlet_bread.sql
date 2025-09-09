/*
  # Schema complet pour la gestion de projets

  1. Tables principales
    - `departements` - Départements de l'entreprise
    - `users` - Profils utilisateurs étendus (liés à auth.users)
    - `projets` - Projets avec informations complètes
    - `taches` - Tâches assignables avec détails
    - `tache_utilisateurs` - Liaison many-to-many tâches/utilisateurs
    - `commentaires` - Commentaires sur les tâches
    - `*_attachments` - Pièces jointes pour projets, tâches et commentaires
    - `tache_history` - Historique des modifications
    - `meeting_minutes` - PV de réunions
    - `project_expenses` - Dépenses des projets
    - `budget_categories` - Catégories budgétaires

  2. Sécurité
    - RLS activé sur toutes les tables
    - Politiques basées sur les rôles utilisateurs
    - Accès filtré selon les permissions

  3. Fonctionnalités
    - Système de rôles complet (SUPER_ADMIN, ADMIN, UTILISATEUR)
    - Gestion budgétaire avec devises
    - Historique des modifications
    - Pièces jointes sécurisées
*/

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des départements
CREATE TABLE IF NOT EXISTS departements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE departements ENABLE ROW LEVEL SECURITY;

-- Politiques pour les départements
CREATE POLICY "Départements visibles par tous les utilisateurs authentifiés"
    ON departements FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Seuls les admins peuvent modifier les départements"
    ON departements FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (auth.users.raw_user_meta_data->>'role' IN ('ADMIN', 'SUPER_ADMIN')
                 OR auth.users.user_metadata->>'role' IN ('ADMIN', 'SUPER_ADMIN'))
        )
    );

-- Table des utilisateurs étendus
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    fonction VARCHAR(100),
    departement_id UUID REFERENCES departements(id) ON DELETE SET NULL,
    departement VARCHAR(100), -- Nom du département pour compatibilité
    role VARCHAR(20) CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'UTILISATEUR')) DEFAULT 'UTILISATEUR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Politiques pour les utilisateurs
CREATE POLICY "Les utilisateurs peuvent voir leur propre profil"
    ON users FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Les admins peuvent voir tous les utilisateurs"
    ON users FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('ADMIN', 'SUPER_ADMIN')
        )
    );

CREATE POLICY "Les utilisateurs peuvent modifier leur propre profil"
    ON users FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Les admins peuvent modifier les utilisateurs"
    ON users FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('ADMIN', 'SUPER_ADMIN')
        )
    );

-- Table des projets
CREATE TABLE IF NOT EXISTS projets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(200) NOT NULL,
    type_projet VARCHAR(100),
    description TEXT,
    responsable_id UUID REFERENCES users(id) ON DELETE SET NULL,
    budget_initial DECIMAL(15,2),
    devise VARCHAR(3),
    prestataire_externe VARCHAR(200),
    nouvelles_fonctionnalites TEXT,
    avantages TEXT,
    departement_id UUID REFERENCES departements(id) ON DELETE SET NULL,
    departement VARCHAR(100), -- Nom du département pour compatibilité
    date_debut DATE,
    date_fin DATE,
    statut VARCHAR(20) CHECK (statut IN ('actif', 'cloture')) DEFAULT 'actif',
    date_cloture TIMESTAMP WITH TIME ZONE,
    cloture_par UUID REFERENCES users(id) ON DELETE SET NULL,
    date_reouverture TIMESTAMP WITH TIME ZONE,
    reouvert_par UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE projets ENABLE ROW LEVEL SECURITY;

-- Politiques pour les projets
CREATE POLICY "Admins peuvent tout faire sur les projets"
    ON projets FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('ADMIN', 'SUPER_ADMIN')
        )
    );

CREATE POLICY "Utilisateurs peuvent voir leurs projets assignés"
    ON projets FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM taches t
            JOIN tache_utilisateurs tu ON t.id = tu.tache_id
            WHERE t.projet_id = projets.id
            AND tu.user_id = auth.uid()
        )
        OR responsable_id = auth.uid()
    );

-- Table des tâches
CREATE TABLE IF NOT EXISTS taches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(200) NOT NULL,
    description TEXT,
    scenario_execution TEXT,
    criteres_acceptation TEXT,
    etat VARCHAR(20) CHECK (etat IN ('non_debutee', 'en_cours', 'cloturee')) DEFAULT 'non_debutee',
    date_realisation DATE NOT NULL,
    projet_id UUID REFERENCES projets(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE taches ENABLE ROW LEVEL SECURITY;

-- Politiques pour les tâches
CREATE POLICY "Utilisateurs peuvent voir leurs tâches"
    ON taches FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM tache_utilisateurs tu
            WHERE tu.tache_id = taches.id
            AND tu.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('ADMIN', 'SUPER_ADMIN')
        )
        OR
        EXISTS (
            SELECT 1 FROM projets p
            WHERE p.id = taches.projet_id
            AND p.responsable_id = auth.uid()
        )
    );

CREATE POLICY "Utilisateurs peuvent modifier leurs tâches"
    ON taches FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM tache_utilisateurs tu
            WHERE tu.tache_id = taches.id
            AND tu.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('ADMIN', 'SUPER_ADMIN')
        )
    );

CREATE POLICY "Admins peuvent créer des tâches"
    ON taches FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('ADMIN', 'SUPER_ADMIN')
        )
    );

-- Table de liaison tâches-utilisateurs
CREATE TABLE IF NOT EXISTS tache_utilisateurs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tache_id UUID REFERENCES taches(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tache_id, user_id)
);

-- Activer RLS
ALTER TABLE tache_utilisateurs ENABLE ROW LEVEL SECURITY;

-- Politiques pour les assignations
CREATE POLICY "Utilisateurs peuvent voir leurs assignations"
    ON tache_utilisateurs FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('ADMIN', 'SUPER_ADMIN')
        )
    );

-- Table des commentaires
CREATE TABLE IF NOT EXISTS commentaires (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contenu TEXT NOT NULL,
    tache_id UUID REFERENCES taches(id) ON DELETE CASCADE,
    auteur_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE commentaires ENABLE ROW LEVEL SECURITY;

-- Politiques pour les commentaires
CREATE POLICY "Utilisateurs peuvent voir les commentaires de leurs tâches"
    ON commentaires FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM tache_utilisateurs tu
            WHERE tu.tache_id = commentaires.tache_id
            AND tu.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('ADMIN', 'SUPER_ADMIN')
        )
    );

CREATE POLICY "Utilisateurs peuvent créer des commentaires"
    ON commentaires FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM tache_utilisateurs tu
            WHERE tu.tache_id = commentaires.tache_id
            AND tu.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('ADMIN', 'SUPER_ADMIN')
        )
    );

-- Table des pièces jointes projets
CREATE TABLE IF NOT EXISTS projet_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(255) NOT NULL,
    taille BIGINT NOT NULL,
    type VARCHAR(100) NOT NULL,
    url VARCHAR(500) NOT NULL,
    projet_id UUID REFERENCES projets(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE projet_attachments ENABLE ROW LEVEL SECURITY;

-- Table des pièces jointes tâches
CREATE TABLE IF NOT EXISTS tache_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(255) NOT NULL,
    taille BIGINT NOT NULL,
    type VARCHAR(100) NOT NULL,
    url VARCHAR(500) NOT NULL,
    tache_id UUID REFERENCES taches(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE tache_attachments ENABLE ROW LEVEL SECURITY;

-- Table des pièces jointes commentaires
CREATE TABLE IF NOT EXISTS commentaire_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(255) NOT NULL,
    taille BIGINT NOT NULL,
    type VARCHAR(100) NOT NULL,
    url VARCHAR(500) NOT NULL,
    commentaire_id UUID REFERENCES commentaires(id) ON DELETE CASCADE,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE commentaire_attachments ENABLE ROW LEVEL SECURITY;

-- Table de l'historique des tâches
CREATE TABLE IF NOT EXISTS tache_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tache_id UUID REFERENCES taches(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    auteur_id UUID REFERENCES users(id) ON DELETE SET NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE tache_history ENABLE ROW LEVEL SECURITY;

-- Table des PV de réunions
CREATE TABLE IF NOT EXISTS meeting_minutes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titre VARCHAR(255) NOT NULL,
    date_reunion DATE NOT NULL,
    description TEXT,
    nom_fichier VARCHAR(255) NOT NULL,
    taille_fichier BIGINT NOT NULL,
    type_fichier VARCHAR(100) NOT NULL,
    url_fichier VARCHAR(500) NOT NULL,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE meeting_minutes ENABLE ROW LEVEL SECURITY;

-- Table de liaison PV-Projets
CREATE TABLE IF NOT EXISTS meeting_minute_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_minute_id UUID REFERENCES meeting_minutes(id) ON DELETE CASCADE,
    projet_id UUID REFERENCES projets(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(meeting_minute_id, projet_id)
);

-- Activer RLS
ALTER TABLE meeting_minute_projects ENABLE ROW LEVEL SECURITY;

-- Table des dépenses de projets
CREATE TABLE IF NOT EXISTS project_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    projet_id UUID REFERENCES projets(id) ON DELETE CASCADE,
    date_depense DATE NOT NULL,
    intitule VARCHAR(255) NOT NULL,
    montant DECIMAL(15,2) NOT NULL,
    devise VARCHAR(3) NOT NULL,
    taux_conversion DECIMAL(10,6),
    montant_converti DECIMAL(15,2),
    rubrique VARCHAR(100),
    piece_jointe_url VARCHAR(500),
    piece_jointe_nom VARCHAR(255),
    piece_jointe_type VARCHAR(100),
    piece_jointe_taille BIGINT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE project_expenses ENABLE ROW LEVEL SECURITY;

-- Table des catégories budgétaires
CREATE TABLE IF NOT EXISTS budget_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_departements_updated_at BEFORE UPDATE ON departements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projets_updated_at BEFORE UPDATE ON projets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_taches_updated_at BEFORE UPDATE ON taches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meeting_minutes_updated_at BEFORE UPDATE ON meeting_minutes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_expenses_updated_at BEFORE UPDATE ON project_expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budget_categories_updated_at BEFORE UPDATE ON budget_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_departement ON users(departement);
CREATE INDEX IF NOT EXISTS idx_projets_departement ON projets(departement);
CREATE INDEX IF NOT EXISTS idx_projets_statut ON projets(statut);
CREATE INDEX IF NOT EXISTS idx_taches_projet ON taches(projet_id);
CREATE INDEX IF NOT EXISTS idx_taches_etat ON taches(etat);
CREATE INDEX IF NOT EXISTS idx_taches_date ON taches(date_realisation);
CREATE INDEX IF NOT EXISTS idx_commentaires_tache ON commentaires(tache_id);
CREATE INDEX IF NOT EXISTS idx_tache_utilisateurs_tache ON tache_utilisateurs(tache_id);
CREATE INDEX IF NOT EXISTS idx_tache_utilisateurs_user ON tache_utilisateurs(user_id);
CREATE INDEX IF NOT EXISTS idx_tache_history_tache ON tache_history(tache_id);
CREATE INDEX IF NOT EXISTS idx_project_expenses_projet ON project_expenses(projet_id);

-- Insérer les départements par défaut
INSERT INTO departements (nom, description) VALUES 
('IT', 'Technologies de l''information'),
('Design', 'Design et expérience utilisateur'),
('Marketing', 'Marketing et communication'),
('Qualité', 'Assurance qualité'),
('RH', 'Ressources humaines')
ON CONFLICT (nom) DO NOTHING;

-- Insérer les catégories budgétaires par défaut
INSERT INTO budget_categories (id, nom, description, is_system) VALUES 
('rh', 'Ressources Humaines', 'Salaires, formations, consultants', true),
('materiel', 'Matériel', 'Équipements, fournitures', true),
('prestation', 'Prestations externes', 'Services externes, sous-traitance', true),
('logiciel', 'Logiciels', 'Licences, abonnements', true),
('deplacement', 'Déplacements', 'Voyages, hébergement, transport', false),
('communication', 'Communication', 'Marketing, publicité', false),
('formation', 'Formation', 'Formations, certifications', false),
('autre', 'Autres', 'Dépenses diverses', false)
ON CONFLICT (nom) DO NOTHING;