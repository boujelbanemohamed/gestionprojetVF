import { supabase } from './supabase';
import { AuthUser } from '../types';
import { handleError, withErrorHandling } from '../utils/errorHandler';
import { mapDateFields } from '../utils/dateMapper';
import { TABLES } from '../constants/tables';

export class AuthService {
  /**
   * Inscription d'un nouvel utilisateur
   */
  static async signUp(
    email: string, 
    password: string, 
    userData: {
      nom: string;
      prenom: string;
      fonction?: string;
      departement?: string;
      role?: 'SUPER_ADMIN' | 'ADMIN' | 'UTILISATEUR';
    }
  ) {
    return withErrorHandling('AuthService.signUp', async () => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });

      if (error) {
        if (error.message?.includes('already registered') || error.message?.includes('User already registered')) {
          throw new Error('Un utilisateur avec cet email existe déjà dans le système d\'authentification. Veuillez utiliser un email différent ou contacter l\'administrateur.');
        }
        throw error;
      }

      return data;
    });
  }

  /**
   * Connexion d'un utilisateur
   */
  static async signIn(email: string, password: string) {
    return withErrorHandling('AuthService.signIn', async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      return data;
    });
  }

  /**
   * Déconnexion d'un utilisateur
   */
  static async signOut(): Promise<boolean> {
    return withErrorHandling('AuthService.signOut', async () => {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      // Retourner true pour indiquer le succès
      return true;
    });
  }

  /**
   * Récupération de l'utilisateur actuel
   */
  static async getCurrentUser(): Promise<AuthUser | null> {
    return withErrorHandling('AuthService.getCurrentUser', async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      try {
        const { data: profile, error } = await supabase
          .from(TABLES.USERS)
          .select(`
            *,
            departements(nom)
          `)
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Erreur lors de la récupération du profil utilisateur:', error);
          // Retourner un utilisateur basique si le profil n'existe pas
          return {
            id: user.id,
            nom: user.user_metadata?.nom || 'Utilisateur',
            prenom: user.user_metadata?.prenom || 'Anonyme',
            email: user.email || '',
            fonction: user.user_metadata?.fonction || 'Non défini',
            departement: 'Non assigné',
            role: 'UTILISATEUR',
            created_at: new Date(user.created_at)
          };
        }

        return {
          id: profile.id,
          nom: profile.nom,
          prenom: profile.prenom,
          email: profile.email,
          fonction: profile.fonction,
          departement: profile.departements?.nom || 'Non assigné',
          role: profile.role,
          created_at: new Date(profile.created_at)
        };
      } catch (profileError) {
        console.error('Erreur lors de la récupération du profil utilisateur:', profileError);
        // Retourner un utilisateur basique en cas d'erreur
        return {
          id: user.id,
          nom: user.user_metadata?.nom || 'Utilisateur',
          prenom: user.user_metadata?.prenom || 'Anonyme',
          email: user.email || '',
          fonction: user.user_metadata?.fonction || 'Non défini',
          departement: 'Non assigné',
          role: 'UTILISATEUR',
          created_at: new Date(user.created_at)
        };
      }
    });
  }

  /**
   * Vérification de l'état d'authentification
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return user !== null;
    } catch {
      return false;
    }
  }
}
