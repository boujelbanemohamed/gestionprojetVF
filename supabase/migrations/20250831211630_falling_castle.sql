/*
  # Complete Supabase Schema for Project Management Platform

  1. New Tables
    - `departements` - Company departments
    - `users` - Extended user profiles linked to auth.users
    - `projets` - Projects with budget and timeline
    - `taches` - Tasks with assignments
    - `tache_utilisateurs` - Many-to-many task assignments
    - `commentaires` - Task comments
    - `*_attachments` - File attachments for projects, tasks, comments
    - `tache_history` - Task modification history
    - `budget_categories` - Budget expense categories
    - `project_expenses` - Project expenses tracking
    - `meeting_minutes` - Meeting minutes with project associations

  2. Security
    - Enable RLS on all tables
    - Role-based access policies
    - Storage bucket with secure policies

  3. Features
    - Multi-role system (SUPER_ADMIN, ADMIN, UTILISATEUR)
    - File attachments with size limits
    - Budget tracking with currency conversion
    - Task history and comments
    - Meeting minutes management
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create departments table
CREATE TABLE IF NOT EXISTS departements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE departements ENABLE ROW LEVEL SECURITY;

-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    fonction VARCHAR(100),
    departement_id UUID REFERENCES departements(id) ON DELETE SET NULL,
    role VARCHAR(20) CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'UTILISATEUR')) DEFAULT 'UTILISATEUR',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create projects table
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
    date_debut DATE,
    date_fin DATE,
    statut VARCHAR(20) CHECK (statut IN ('actif', 'cloture')) DEFAULT 'actif',
    date_cloture TIMESTAMPTZ,
    cloture_par UUID REFERENCES users(id),
    date_reouverture TIMESTAMPTZ,
    reouvert_par UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE projets ENABLE ROW LEVEL SECURITY;

-- Create tasks table
CREATE TABLE IF NOT EXISTS taches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(200) NOT NULL,
    description TEXT,
    scenario_execution TEXT,
    criteres_acceptation TEXT,
    etat VARCHAR(20) CHECK (etat IN ('non_debutee', 'en_cours', 'cloturee')) DEFAULT 'non_debutee',
    date_realisation DATE NOT NULL,
    projet_id UUID REFERENCES projets(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE taches ENABLE ROW LEVEL SECURITY;

-- Create task-user assignments
CREATE TABLE IF NOT EXISTS tache_utilisateurs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tache_id UUID REFERENCES taches(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tache_id, user_id)
);

ALTER TABLE tache_utilisateurs ENABLE ROW LEVEL SECURITY;

-- Create comments table
CREATE TABLE IF NOT EXISTS commentaires (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contenu TEXT NOT NULL,
    tache_id UUID REFERENCES taches(id) ON DELETE CASCADE,
    auteur_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE commentaires ENABLE ROW LEVEL SECURITY;

-- Create task history
CREATE TABLE IF NOT EXISTS tache_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tache_id UUID REFERENCES taches(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    auteur_id UUID REFERENCES users(id) ON DELETE SET NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tache_history ENABLE ROW LEVEL SECURITY;

-- Create attachments tables
CREATE TABLE IF NOT EXISTS projet_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(255) NOT NULL,
    taille BIGINT NOT NULL,
    type VARCHAR(100) NOT NULL,
    url VARCHAR(500) NOT NULL,
    projet_id UUID REFERENCES projets(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE projet_attachments ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS tache_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(255) NOT NULL,
    taille BIGINT NOT NULL,
    type VARCHAR(100) NOT NULL,
    url VARCHAR(500) NOT NULL,
    tache_id UUID REFERENCES taches(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tache_attachments ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS commentaire_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(255) NOT NULL,
    taille BIGINT NOT NULL,
    type VARCHAR(100) NOT NULL,
    url VARCHAR(500) NOT NULL,
    commentaire_id UUID REFERENCES commentaires(id) ON DELETE CASCADE,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE commentaire_attachments ENABLE ROW LEVEL SECURITY;

-- Create budget tables
CREATE TABLE IF NOT EXISTS budget_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS project_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    projet_id UUID REFERENCES projets(id) ON DELETE CASCADE,
    date_depense DATE NOT NULL,
    intitule VARCHAR(255) NOT NULL,
    montant DECIMAL(15,2) NOT NULL,
    devise VARCHAR(3) NOT NULL,
    taux_conversion DECIMAL(10,6),
    montant_converti DECIMAL(15,2),
    rubrique UUID REFERENCES budget_categories(id),
    piece_jointe_url VARCHAR(500),
    piece_jointe_nom VARCHAR(255),
    piece_jointe_type VARCHAR(100),
    piece_jointe_taille BIGINT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE project_expenses ENABLE ROW LEVEL SECURITY;

-- Create meeting minutes
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE meeting_minutes ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS meeting_minute_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_minute_id UUID REFERENCES meeting_minutes(id) ON DELETE CASCADE,
    projet_id UUID REFERENCES projets(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(meeting_minute_id, projet_id)
);

ALTER TABLE meeting_minute_projects ENABLE ROW LEVEL SECURITY;

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('attachments', 'attachments', true) ON CONFLICT DO NOTHING;

-- RLS Policies

-- Departments policies
CREATE POLICY "Departments visible to authenticated users" ON departements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admins can manage departments" ON departements FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('ADMIN', 'SUPER_ADMIN'))
);

-- Users policies
CREATE POLICY "Users can view their own profile" ON users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins can view all users" ON users FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('ADMIN', 'SUPER_ADMIN'))
);
CREATE POLICY "Admins can manage users" ON users FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('ADMIN', 'SUPER_ADMIN'))
);

-- Projects policies
CREATE POLICY "Admins can manage all projects" ON projets FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('ADMIN', 'SUPER_ADMIN'))
);
CREATE POLICY "Users can view assigned projects" ON projets FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM taches t
        JOIN tache_utilisateurs tu ON t.id = tu.tache_id
        WHERE t.projet_id = projets.id AND tu.user_id = auth.uid()
    ) OR responsable_id = auth.uid()
);

-- Tasks policies
CREATE POLICY "Users can view their tasks" ON taches FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM tache_utilisateurs tu WHERE tu.tache_id = taches.id AND tu.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('ADMIN', 'SUPER_ADMIN'))
);
CREATE POLICY "Users can manage their tasks" ON taches FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM tache_utilisateurs tu WHERE tu.tache_id = taches.id AND tu.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('ADMIN', 'SUPER_ADMIN'))
);

-- Task assignments policies
CREATE POLICY "Users can view task assignments" ON tache_utilisateurs FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('ADMIN', 'SUPER_ADMIN'))
);
CREATE POLICY "Admins can manage task assignments" ON tache_utilisateurs FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('ADMIN', 'SUPER_ADMIN'))
);

-- Comments policies
CREATE POLICY "Users can view comments on their tasks" ON commentaires FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM tache_utilisateurs tu WHERE tu.tache_id = commentaires.tache_id AND tu.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('ADMIN', 'SUPER_ADMIN'))
);
CREATE POLICY "Users can create comments" ON commentaires FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM tache_utilisateurs tu WHERE tu.tache_id = commentaires.tache_id AND tu.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('ADMIN', 'SUPER_ADMIN'))
);

-- Storage policies
CREATE POLICY "Authenticated users can upload files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'attachments');
CREATE POLICY "Authenticated users can view files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'attachments');
CREATE POLICY "Users can delete their own files" ON storage.objects FOR DELETE TO authenticated USING (
    bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Insert default departments
INSERT INTO departements (nom, description) VALUES 
('IT', 'Technologies de l''information'),
('Design', 'Design et expérience utilisateur'),
('Marketing', 'Marketing et communication'),
('Qualité', 'Assurance qualité'),
('RH', 'Ressources humaines')
ON CONFLICT (nom) DO NOTHING;

-- Insert default budget categories
INSERT INTO budget_categories (nom, description, is_system) VALUES 
('Ressources Humaines', 'Salaires, formations, consultants', true),
('Matériel', 'Équipements, fournitures', true),
('Prestations externes', 'Services externes, sous-traitance', true),
('Logiciels', 'Licences, abonnements', true),
('Déplacements', 'Voyages, hébergement, transport', false),
('Communication', 'Marketing, publicité', false),
('Formation', 'Formations, certifications', false),
('Autres', 'Dépenses diverses', false)
ON CONFLICT (nom) DO NOTHING;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_departements_updated_at BEFORE UPDATE ON departements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projets_updated_at BEFORE UPDATE ON projets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_taches_updated_at BEFORE UPDATE ON taches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();