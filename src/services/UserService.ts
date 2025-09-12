import { supabase } from './supabase';
import { User, AuthUser } from '../types';
import { handleError, withErrorHandling } from '../utils/errorHandler';
import { mapDateFields, mapDateFieldsArray } from '../utils/dateMapper';
import { TABLES } from '../constants/tables';

export class UserService {
  /**
   * Vérifier si un utilisateur existe déjà par email
   */
  static async checkUserExists(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select('id')
        .eq('email', email)
        .single();

      if (error) {
        // Si l'erreur est 406 (Not Acceptable) ou PGRST116 (no rows), l'utilisateur n'existe pas
        if (error.code === 'PGRST116' || error.status === 406) {
          return false;
        }
        // Pour les autres erreurs, on considère que l'utilisateur n'existe pas par sécurité
        console.warn('Erreur lors de la vérification de l\'utilisateur:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.warn('Erreur lors de la vérification de l\'utilisateur:', error);
      return false;
    }
  }

  /**
   * Récupérer tous les utilisateurs
   */
  static async getUsers(): Promise<User[]> {
    return withErrorHandling('UserService.getUsers', async () => {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select(`
          *,
          departements(nom)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return mapDateFieldsArray(data, ['created_at']).map(user => ({
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        fonction: user.fonction,
        departement: user.departements?.nom || 'Non assigné',
        role: user.role,
        created_at: user.created_at
      }));
    });
  }

  /**
   * Récupérer un utilisateur par ID
   */
  static async getUserById(id: string): Promise<User | null> {
    return withErrorHandling('UserService.getUserById', async () => {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select(`
          *,
          departements(nom)
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      const mappedUser = mapDateFields(data, ['created_at']);
      return {
        id: mappedUser.id,
        nom: mappedUser.nom,
        prenom: mappedUser.prenom,
        email: mappedUser.email,
        fonction: mappedUser.fonction,
        departement: mappedUser.departements?.nom || 'Non assigné',
        role: mappedUser.role,
        created_at: mappedUser.created_at
      };
    });
  }

  /**
   * Créer un profil utilisateur
   */
  static async createUserProfile(
    userId: string, 
    email: string, 
    userData: {
      nom: string;
      prenom: string;
      fonction?: string;
      departement?: string;
      role?: 'SUPER_ADMIN' | 'ADMIN' | 'UTILISATEUR';
    }
  ): Promise<User> {
    return withErrorHandling('UserService.createUserProfile', async () => {
      // Trouver l'ID du département si le nom est fourni
      let departement_id: string | undefined;
      if (userData.departement) {
        const { data: deptData } = await supabase
          .from(TABLES.DEPARTMENTS)
          .select('id')
          .eq('nom', userData.departement)
          .single();
        departement_id = deptData?.id;
      }

      // Créer ou mettre à jour l'utilisateur dans la table users
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .upsert({
          id: userId,
          nom: userData.nom,
          prenom: userData.prenom,
          email: email,
          fonction: userData.fonction || null,
          departement_id: departement_id || null,
          role: userData.role || 'UTILISATEUR'
        })
        .select(`
          *,
          departements(nom)
        `)
        .single();

      if (error) throw error;

      const mappedUser = mapDateFields(data, ['created_at']);
      return {
        id: mappedUser.id,
        nom: mappedUser.nom,
        prenom: mappedUser.prenom,
        email: mappedUser.email,
        fonction: mappedUser.fonction,
        departement: mappedUser.departements?.nom || 'Non assigné',
        role: mappedUser.role,
        created_at: mappedUser.created_at
      };
    });
  }

  /**
   * Mettre à jour un utilisateur
   */
  static async updateUser(
    id: string, 
    userData: {
      nom?: string;
      prenom?: string;
      email?: string;
      fonction?: string;
      departement_id?: string;
      role?: string;
    }
  ): Promise<User> {
    return withErrorHandling('UserService.updateUser', async () => {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .update(userData)
        .eq('id', id)
        .select(`
          *,
          departements(nom)
        `)
        .single();

      if (error) throw error;

      const mappedUser = mapDateFields(data, ['created_at']);
      return {
        id: mappedUser.id,
        nom: mappedUser.nom,
        prenom: mappedUser.prenom,
        email: mappedUser.email,
        fonction: mappedUser.fonction,
        departement: mappedUser.departements?.nom || 'Non assigné',
        role: mappedUser.role,
        created_at: mappedUser.created_at
      };
    });
  }

  /**
   * Supprimer un utilisateur
   */
  static async deleteUser(id: string): Promise<void> {
    return withErrorHandling('UserService.deleteUser', async () => {
      const { error } = await supabase
        .from(TABLES.USERS)
        .delete()
        .eq('id', id);

      if (error) throw error;
    });
  }

  /**
   * Rechercher des utilisateurs par nom ou email
   */
  static async searchUsers(query: string): Promise<User[]> {
    return withErrorHandling('UserService.searchUsers', async () => {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select(`
          *,
          departements(nom)
        `)
        .or(`nom.ilike.%${query}%,prenom.ilike.%${query}%,email.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return mapDateFieldsArray(data, ['created_at']).map(user => ({
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        fonction: user.fonction,
        departement: user.departements?.nom || 'Non assigné',
        role: user.role,
        created_at: user.created_at
      }));
    });
  }
}
