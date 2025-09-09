import express from 'express';
import Joi from 'joi';
import { db } from '../config/database';
import { authenticateToken, AuthRequest, requireAdmin } from '../middleware/auth';
import { logger } from '../utils/logger';
import { io } from '../server';

const router = express.Router();

// Validation schemas
const createProjectSchema = Joi.object({
  nom: Joi.string().required().min(2).max(200),
  description: Joi.string().optional().max(2000),
  departement_id: Joi.string().uuid().optional()
});

const updateProjectSchema = Joi.object({
  nom: Joi.string().optional().min(2).max(200),
  description: Joi.string().optional().max(2000),
  departement_id: Joi.string().uuid().optional()
});

// Get all projects (with filtering for regular users)
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { page = 1, limit = 10, search, departement_id } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db('projets as p')
      .select([
        'p.*',
        'd.nom as departement_nom',
        db.raw('COUNT(DISTINCT t.id) as total_taches'),
        db.raw('COUNT(DISTINCT CASE WHEN t.etat = ? THEN t.id END) as taches_terminees', ['cloturee'])
      ])
      .leftJoin('departements as d', 'p.departement_id', 'd.id')
      .leftJoin('taches as t', 'p.id', 't.projet_id')
      .groupBy('p.id', 'd.nom');

    // Filter for regular users (only projects they're assigned to)
    if (req.user!.role === 'UTILISATEUR') {
      query = query
        .leftJoin('tache_utilisateurs as tu', 't.id', 'tu.tache_id')
        .where('tu.user_id', req.user!.id);
    }

    // Apply filters
    if (search) {
      query = query.where('p.nom', 'ilike', `%${search}%`);
    }

    if (departement_id) {
      query = query.where('p.departement_id', departement_id);
    }

    const projects = await query
      .orderBy('p.updated_at', 'desc')
      .limit(Number(limit))
      .offset(offset);

    // Get total count
    const totalQuery = db('projets as p');
    if (req.user!.role === 'UTILISATEUR') {
      totalQuery
        .leftJoin('taches as t', 'p.id', 't.projet_id')
        .leftJoin('tache_utilisateurs as tu', 't.id', 'tu.tache_id')
        .where('tu.user_id', req.user!.id);
    }
    
    const [{ count }] = await totalQuery.count('DISTINCT p.id as count');

    res.json({
      projects,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(count),
        pages: Math.ceil(Number(count) / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Get projects error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Get project by ID with tasks
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Get project
    const project = await db('projets as p')
      .select(['p.*', 'd.nom as departement_nom'])
      .leftJoin('departements as d', 'p.departement_id', 'd.id')
      .where('p.id', id)
      .first();

    if (!project) {
      return res.status(404).json({ error: 'Projet non trouvé' });
    }

    // Check permissions for regular users
    if (req.user!.role === 'UTILISATEUR') {
      const hasAccess = await db('taches as t')
        .leftJoin('tache_utilisateurs as tu', 't.id', 'tu.tache_id')
        .where('t.projet_id', id)
        .where('tu.user_id', req.user!.id)
        .first();

      if (!hasAccess) {
        return res.status(403).json({ error: 'Accès non autorisé à ce projet' });
      }
    }

    // Get tasks with users
    const tasks = await db('taches as t')
      .select([
        't.*',
        db.raw('COALESCE(json_agg(DISTINCT jsonb_build_object(\'id\', u.id, \'nom\', u.nom, \'prenom\', u.prenom, \'email\', u.email, \'fonction\', u.fonction)) FILTER (WHERE u.id IS NOT NULL), \'[]\') as utilisateurs'),
        db.raw('COUNT(DISTINCT c.id) as commentaires_count')
      ])
      .leftJoin('tache_utilisateurs as tu', 't.id', 'tu.tache_id')
      .leftJoin('users as u', 'tu.user_id', 'u.id')
      .leftJoin('commentaires as c', 't.id', 'c.tache_id')
      .where('t.projet_id', id)
      .groupBy('t.id')
      .orderBy('t.created_at', 'desc');

    // Get project attachments
    const attachments = await db('projet_attachments as pa')
      .select(['pa.*', 'u.nom', 'u.prenom'])
      .leftJoin('users as u', 'pa.uploaded_by', 'u.id')
      .where('pa.projet_id', id)
      .orderBy('pa.uploaded_at', 'desc');

    res.json({
      ...project,
      taches: tasks,
      attachments
    });
  } catch (error) {
    logger.error('Get project error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Create project (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { error, value } = createProjectSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { nom, description, departement_id } = value;

    const [project] = await db('projets')
      .insert({
        nom,
        description,
        departement_id,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');

    logger.info(`Project created: ${nom} by ${req.user!.email}`);

    // Emit real-time event
    io.emit('project:created', project);

    res.status(201).json({
      message: 'Projet créé avec succès',
      project
    });
  } catch (error) {
    logger.error('Create project error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Update project (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updateProjectSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const updateData = {
      ...value,
      updated_at: new Date()
    };

    const [project] = await db('projets')
      .where('id', id)
      .update(updateData)
      .returning('*');

    if (!project) {
      return res.status(404).json({ error: 'Projet non trouvé' });
    }

    logger.info(`Project updated: ${id} by ${req.user!.email}`);

    // Emit real-time event
    io.emit('project:updated', project);

    res.json({
      message: 'Projet mis à jour avec succès',
      project
    });
  } catch (error) {
    logger.error('Update project error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Delete project (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const project = await db('projets').where('id', id).first();
    if (!project) {
      return res.status(404).json({ error: 'Projet non trouvé' });
    }

    await db('projets').where('id', id).del();

    logger.info(`Project deleted: ${id} by ${req.user!.email}`);

    // Emit real-time event
    io.emit('project:deleted', { id });

    res.json({ message: 'Projet supprimé avec succès' });
  } catch (error) {
    logger.error('Delete project error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Get project statistics
router.get('/:id/stats', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const stats = await db('taches')
      .select([
        db.raw('COUNT(*) as total_taches'),
        db.raw('COUNT(CASE WHEN etat = ? THEN 1 END) as non_debutees', ['non_debutee']),
        db.raw('COUNT(CASE WHEN etat = ? THEN 1 END) as en_cours', ['en_cours']),
        db.raw('COUNT(CASE WHEN etat = ? THEN 1 END) as terminees', ['cloturee']),
        db.raw('COUNT(DISTINCT tu.user_id) as membres_assignes')
      ])
      .leftJoin('tache_utilisateurs as tu', 'taches.id', 'tu.tache_id')
      .where('projet_id', id)
      .first();

    const percentage = stats.total_taches > 0 
      ? Math.round((stats.terminees / stats.total_taches) * 100)
      : 0;

    res.json({
      ...stats,
      percentage
    });
  } catch (error) {
    logger.error('Get project stats error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

export default router;