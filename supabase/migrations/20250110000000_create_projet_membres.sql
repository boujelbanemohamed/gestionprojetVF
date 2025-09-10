-- Create projet_membres table
CREATE TABLE IF NOT EXISTS projet_membres (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    projet_id UUID NOT NULL REFERENCES projets(id) ON DELETE CASCADE,
    utilisateur_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'membre' CHECK (role IN ('membre', 'responsable', 'observateur')),
    assigne_le TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigne_par UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(projet_id, utilisateur_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projet_membres_projet_id ON projet_membres(projet_id);
CREATE INDEX IF NOT EXISTS idx_projet_membres_utilisateur_id ON projet_membres(utilisateur_id);

-- Create RLS policies
ALTER TABLE projet_membres ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view members of projects they are part of
CREATE POLICY "Users can view project members" ON projet_membres
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projet_membres pm 
            WHERE pm.projet_id = projet_membres.projet_id 
            AND pm.utilisateur_id = auth.uid()
        )
    );

-- Policy: Users can add members to projects they manage
CREATE POLICY "Users can add project members" ON projet_membres
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projets p 
            WHERE p.id = projet_id 
            AND p.responsable_id = auth.uid()
        )
    );

-- Policy: Users can update project members if they are project managers
CREATE POLICY "Users can update project members" ON projet_membres
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM projets p 
            WHERE p.id = projet_id 
            AND p.responsable_id = auth.uid()
        )
    );

-- Policy: Users can remove project members if they are project managers
CREATE POLICY "Users can remove project members" ON projet_membres
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM projets p 
            WHERE p.id = projet_id 
            AND p.responsable_id = auth.uid()
        )
    );

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_projet_membres_updated_at 
    BEFORE UPDATE ON projet_membres 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
