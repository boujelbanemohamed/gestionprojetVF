import { supabase } from './supabase';
import { AuthUser } from '../types';
import { withErrorHandling } from '../utils/errorHandler';
import { TABLES } from '../constants/tables';
import { UserService } from './UserService';

export class AuthService {
  /**
   * Inscription complète d'un nouvel utilisateur (Auth + Users table)
   * Garantit la cohérence entre auth.users et public.users
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
  ): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    return withErrorHandling('AuthService.signUp', async () => {
      // Nettoyer l'email (trim seulement, pas de normalisation de casse)
      const cleanEmail = email.trim();
      
      console.log('[AuthService.signUp] Début inscription pour:', cleanEmail);

      // 1) Vérifier si l'utilisateur existe déjà dans la table users (avec les deux casse)
      const userExistsOriginal = await UserService.checkUserExists(cleanEmail);
      const userExistsNormalized = await UserService.checkUserExists(cleanEmail.toLowerCase());
      
      if (userExistsOriginal || userExistsNormalized) {
        console.log('[AuthService.signUp] Utilisateur existe déjà dans table users');
        return { 
          success: false, 
          error: 'Un utilisateur avec cet email existe déjà' 
        };
      }

      let authUserId: string | null = null;

      try {
        // 2) Créer l'utilisateur dans Supabase Auth avec l'email original
        console.log('[AuthService.signUp] Création dans Supabase Auth...');
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: userData
          }
        });

        if (authError) {
          console.error('[AuthService.signUp] Erreur Auth:', authError);
          if (authError.message?.includes('already registered') || authError.message?.includes('User already registered')) {
            return { 
              success: false, 
              error: 'Un utilisateur avec cet email existe déjà dans le système d\'authentification' 
            };
          }
          throw authError;
        }

        if (!authData.user) {
          throw new Error('Aucun utilisateur créé dans Auth');
        }

        authUserId = authData.user.id;
        console.log('[AuthService.signUp] Utilisateur Auth créé avec ID:', authUserId);

        // 3) NE PAS créer de profil côté table users ici.
        //    La création d'un membre/profil applicatif est réservée à la page Members.

        // 4) Retourner un utilisateur basé sur les métadonnées Auth uniquement
        const authUser: AuthUser = {
          id: authData.user.id,
          nom: (authData.user.user_metadata as any)?.nom || userData.nom || 'Utilisateur',
          prenom: (authData.user.user_metadata as any)?.prenom || userData.prenom || 'Anonyme',
          email: authData.user.email || cleanEmail,
          fonction: (authData.user.user_metadata as any)?.fonction || userData.fonction || 'Non défini',
          departement: 'Non assigné',
          role: (userData.role || 'UTILISATEUR'),
          created_at: new Date(authData.user.created_at)
        };

        console.log('[AuthService.signUp] Inscription réussie (sans création users):', authUser);
        return { success: true, user: authUser };

      } catch (profileError) {
        // Dans ce flux, nous ne créons plus le profil users. Toute erreur ici est inattendue.
        console.error('[AuthService.signUp] Erreur inattendue après création Auth:', profileError);
        return { 
          success: false, 
          error: profileError instanceof Error ? profileError.message : 'Erreur inconnue lors de l\'inscription'
        };
      }
    });
  }

  /**
   * Connexion d'un utilisateur avec récupération du profil complet
   */
  static async signIn(email: string, password: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    return withErrorHandling('AuthService.signIn', async () => {
      // Nettoyer l'email (trim seulement, pas de normalisation de casse)
      const cleanEmail = email.trim();
      
      console.log('[AuthService.signIn] Début connexion pour:', cleanEmail);

      // Note: vérification d'existence Auth côté client supprimée (admin API non disponible)

      // Essayer d'abord avec l'email tel quel
      let { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password
      });

      // Si échec, essayer avec l'email en lowercase
      if (error && error.message?.includes('Invalid login credentials')) {
        console.log('[AuthService.signIn] Tentative avec email en lowercase...');
        const normalizedEmail = cleanEmail.toLowerCase();
        const retryResult = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password
        });
        
        if (!retryResult.error) {
          data = retryResult.data;
          error = null;
          console.log('[AuthService.signIn] Connexion réussie avec email normalisé');
        }
      }

      if (error) {
        console.error('[AuthService.signIn] Erreur Auth:', error);
        
        // Si c'est une erreur d'identifiants invalides, essayer de nettoyer la session UNE SEULE FOIS
        if (error.message?.includes('Invalid login credentials')) {
          console.log('[AuthService.signIn] Tentative de nettoyage de session...');
          const retryResult = await this.clearSessionAndRetry(cleanEmail, password, 0);
          if (retryResult.success) {
            return retryResult;
          }
          // Si le retry échoue aussi, retourner l'erreur originale
          return { success: false, error: 'Email ou mot de passe incorrect. Vérifiez vos identifiants.' };
        }
        
        return { success: false, error: error.message };
      }

      if (!data.user) {
        console.error('[AuthService.signIn] Aucun utilisateur retourné par Auth');
        return { success: false, error: 'Aucun utilisateur retourné par Auth' };
      }

      console.log('[AuthService.signIn] Connexion Auth réussie, ID:', data.user.id);

      // Récupérer le profil complet depuis la table users
      try {
        console.log('[AuthService.signIn] Récupération du profil depuis table users...');
        let { data: profile, error: profileError } = await supabase
          .from(TABLES.USERS)
          .select(`
            *,
            departements(nom)
          `)
          .eq('id', data.user.id)
          .single();

        // Fallback: si la ligne n'existe pas avec l'ID (mauvais schéma), tenter par email
        if (profileError && (profileError.code === 'PGRST116' || (profileError.message || '').includes('406'))) {
          console.warn('[AuthService.signIn] Profil non trouvé par id, tentative par email...');
          const retry = await supabase
            .from(TABLES.USERS)
            .select(`
              *,
              departements(nom)
            `)
            .eq('email', data.user.email || '')
            .single();
          profile = retry.data as any;
          profileError = retry.error as any;
        }

        if (profileError) {
          console.warn('[AuthService.signIn] Profil non trouvé dans table users, fallback sur Auth metadata:', profileError);
          // Retourner un utilisateur basique si le profil n'existe pas
          const authUser: AuthUser = {
            id: data.user.id,
            nom: data.user.user_metadata?.nom || 'Utilisateur',
            prenom: data.user.user_metadata?.prenom || 'Anonyme',
            email: data.user.email || '',
            fonction: data.user.user_metadata?.fonction || 'Non défini',
            departement: 'Non assigné',
            role: 'UTILISATEUR',
            created_at: new Date(data.user.created_at)
          };
          console.log('[AuthService.signIn] Utilisateur créé depuis Auth metadata:', authUser);
          return { success: true, user: authUser };
        }

        const authUser: AuthUser = {
          id: profile.id,
          nom: profile.nom,
          prenom: profile.prenom,
          email: profile.email,
          fonction: profile.fonction,
          departement: profile.departements?.nom || 'Non assigné',
          role: profile.role,
          created_at: new Date(profile.created_at)
        };

        console.log('[AuthService.signIn] Utilisateur récupéré depuis table users:', authUser);
        return { success: true, user: authUser };

      } catch (profileError) {
        console.error('[AuthService.signIn] Erreur lors de la récupération du profil utilisateur:', profileError);
        const authUser: AuthUser = {
          id: data.user.id,
          nom: data.user.user_metadata?.nom || 'Utilisateur',
          prenom: data.user.user_metadata?.prenom || 'Anonyme',
          email: data.user.email || '',
          fonction: data.user.user_metadata?.fonction || 'Non défini',
          departement: 'Non assigné',
          role: 'UTILISATEUR',
          created_at: new Date(data.user.created_at)
        };
        console.log('[AuthService.signIn] Utilisateur créé depuis Auth metadata (fallback):', authUser);
        return { success: true, user: authUser };
      }
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
   * Nettoyer les sessions obsolètes et forcer une reconnexion (avec limite de tentatives)
   */
  static async clearSessionAndRetry(email: string, password: string, retryCount: number = 0): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    return withErrorHandling('AuthService.clearSessionAndRetry', async () => {
      console.log('[AuthService.clearSessionAndRetry] Nettoyage de session pour:', email, 'tentative:', retryCount);
      
      // Limite de tentatives pour éviter les boucles infinies
      if (retryCount >= 2) {
        console.error('[AuthService.clearSessionAndRetry] Limite de tentatives atteinte, abandon');
        return { success: false, error: 'Trop de tentatives de connexion. Veuillez vérifier vos identifiants.' };
      }
      
      // 1) Se déconnecter complètement
      await supabase.auth.signOut();
      
      // 2) Attendre un peu pour que la déconnexion soit effective
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 3) Essayer de se reconnecter directement (sans récursion)
      console.log('[AuthService.clearSessionAndRetry] Tentative de reconnexion directe...');
      
      // Essayer d'abord avec l'email tel quel
      let { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      // Si échec, essayer avec l'email en lowercase
      if (error && error.message?.includes('Invalid login credentials')) {
        console.log('[AuthService.clearSessionAndRetry] Tentative avec email en lowercase...');
        const normalizedEmail = email.trim().toLowerCase();
        const retryResult = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password
        });
        
        if (!retryResult.error) {
          data = retryResult.data;
          error = null;
          console.log('[AuthService.clearSessionAndRetry] Connexion réussie avec email normalisé');
        }
      }

      if (error) {
        console.error('[AuthService.clearSessionAndRetry] Erreur Auth après nettoyage:', error);
        return { success: false, error: error.message };
      }

      if (!data.user) {
        console.error('[AuthService.clearSessionAndRetry] Aucun utilisateur retourné par Auth');
        return { success: false, error: 'Aucun utilisateur retourné par Auth' };
      }

      console.log('[AuthService.clearSessionAndRetry] Connexion Auth réussie, ID:', data.user.id);

      // Récupérer le profil complet depuis la table users
      try {
        console.log('[AuthService.clearSessionAndRetry] Récupération du profil depuis table users...');
        const { data: profile, error: profileError } = await supabase
          .from(TABLES.USERS)
          .select(`
            *,
            departements(nom)
          `)
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.warn('[AuthService.clearSessionAndRetry] Profil non trouvé dans table users, fallback sur Auth metadata:', profileError);
          // Retourner un utilisateur basique si le profil n'existe pas
          const authUser: AuthUser = {
            id: data.user.id,
            nom: data.user.user_metadata?.nom || 'Utilisateur',
            prenom: data.user.user_metadata?.prenom || 'Anonyme',
            email: data.user.email || '',
            fonction: data.user.user_metadata?.fonction || 'Non défini',
            departement: 'Non assigné',
            role: 'UTILISATEUR',
            created_at: new Date(data.user.created_at)
          };
          console.log('[AuthService.clearSessionAndRetry] Utilisateur créé depuis Auth metadata:', authUser);
          return { success: true, user: authUser };
        }

        const authUser: AuthUser = {
          id: profile.id,
          nom: profile.nom,
          prenom: profile.prenom,
          email: profile.email,
          fonction: profile.fonction,
          departement: profile.departements?.nom || 'Non assigné',
          role: profile.role,
          created_at: new Date(profile.created_at)
        };

        console.log('[AuthService.clearSessionAndRetry] Utilisateur récupéré depuis table users:', authUser);
        return { success: true, user: authUser };

      } catch (profileError) {
        console.error('[AuthService.clearSessionAndRetry] Erreur lors de la récupération du profil utilisateur:', profileError);
        const authUser: AuthUser = {
          id: data.user.id,
          nom: data.user.user_metadata?.nom || 'Utilisateur',
          prenom: data.user.user_metadata?.prenom || 'Anonyme',
          email: data.user.email || '',
          fonction: data.user.user_metadata?.fonction || 'Non défini',
          departement: 'Non assigné',
          role: 'UTILISATEUR',
          created_at: new Date(data.user.created_at)
        };
        console.log('[AuthService.clearSessionAndRetry] Utilisateur créé depuis Auth metadata (fallback):', authUser);
        return { success: true, user: authUser };
      }
    });
  }

  /**
   * Forcer la reconnexion après un changement de mot de passe
   */
  static async forceReconnectAfterPasswordChange(email: string, newPassword: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    return withErrorHandling('AuthService.forceReconnectAfterPasswordChange', async () => {
      console.log('[AuthService.forceReconnectAfterPasswordChange] Reconnexion forcée pour:', email);
      
      // 1) Se déconnecter complètement
      await supabase.auth.signOut();
      
      // 2) Attendre un peu pour que la déconnexion soit effective
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 3) Se reconnecter directement avec le nouveau mot de passe (sans récursion)
      console.log('[AuthService.forceReconnectAfterPasswordChange] Reconnexion directe avec nouveau mot de passe...');
      
      const cleanEmail = email.trim();
      
      // Essayer d'abord avec l'email tel quel
      let { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: newPassword
      });

      // Si échec, essayer avec l'email en lowercase
      if (error && error.message?.includes('Invalid login credentials')) {
        console.log('[AuthService.forceReconnectAfterPasswordChange] Tentative avec email en lowercase...');
        const normalizedEmail = cleanEmail.toLowerCase();
        const retryResult = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password: newPassword
        });
        
        if (!retryResult.error) {
          data = retryResult.data;
          error = null;
          console.log('[AuthService.forceReconnectAfterPasswordChange] Connexion réussie avec email normalisé');
        }
      }

      if (error) {
        console.error('[AuthService.forceReconnectAfterPasswordChange] Erreur Auth:', error);
        return { success: false, error: error.message };
      }

      if (!data.user) {
        console.error('[AuthService.forceReconnectAfterPasswordChange] Aucun utilisateur retourné par Auth');
        return { success: false, error: 'Aucun utilisateur retourné par Auth' };
      }

      console.log('[AuthService.forceReconnectAfterPasswordChange] Connexion Auth réussie, ID:', data.user.id);

      // Récupérer le profil complet depuis la table users
      try {
        console.log('[AuthService.forceReconnectAfterPasswordChange] Récupération du profil depuis table users...');
        const { data: profile, error: profileError } = await supabase
          .from(TABLES.USERS)
          .select(`
            *,
            departements(nom)
          `)
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.warn('[AuthService.forceReconnectAfterPasswordChange] Profil non trouvé dans table users, fallback sur Auth metadata:', profileError);
          const authUser: AuthUser = {
            id: data.user.id,
            nom: data.user.user_metadata?.nom || 'Utilisateur',
            prenom: data.user.user_metadata?.prenom || 'Anonyme',
            email: data.user.email || '',
            fonction: data.user.user_metadata?.fonction || 'Non défini',
            departement: 'Non assigné',
            role: 'UTILISATEUR',
            created_at: new Date(data.user.created_at)
          };
          console.log('[AuthService.forceReconnectAfterPasswordChange] Utilisateur créé depuis Auth metadata:', authUser);
          return { success: true, user: authUser };
        }

        const authUser: AuthUser = {
          id: profile.id,
          nom: profile.nom,
          prenom: profile.prenom,
          email: profile.email,
          fonction: profile.fonction,
          departement: profile.departements?.nom || 'Non assigné',
          role: profile.role,
          created_at: new Date(profile.created_at)
        };

        console.log('[AuthService.forceReconnectAfterPasswordChange] Utilisateur récupéré depuis table users:', authUser);
        return { success: true, user: authUser };

      } catch (profileError) {
        console.error('[AuthService.forceReconnectAfterPasswordChange] Erreur lors de la récupération du profil utilisateur:', profileError);
        const authUser: AuthUser = {
          id: data.user.id,
          nom: data.user.user_metadata?.nom || 'Utilisateur',
          prenom: data.user.user_metadata?.prenom || 'Anonyme',
          email: data.user.email || '',
          fonction: data.user.user_metadata?.fonction || 'Non défini',
          departement: 'Non assigné',
          role: 'UTILISATEUR',
          created_at: new Date(data.user.created_at)
        };
        console.log('[AuthService.forceReconnectAfterPasswordChange] Utilisateur créé depuis Auth metadata (fallback):', authUser);
        return { success: true, user: authUser };
      }
    });
  }

  /**
   * Récupération de l'utilisateur actuel avec priorité sur la table users
   */
  static async getCurrentUser(): Promise<AuthUser | null> {
    return withErrorHandling('AuthService.getCurrentUser', async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      // Priorité 1: Récupérer depuis la table users (source de vérité)
      try {
        let { data: profile, error } = await supabase
          .from(TABLES.USERS)
          .select(`
            *,
            departements(nom)
          `)
          .eq('id', user.id)
          .single();

        // Fallback par email si la recherche par id ne renvoie rien
        if ((error && (error.code === 'PGRST116' || (error.message || '').includes('406'))) || (!error && !profile)) {
          const retry = await supabase
            .from(TABLES.USERS)
            .select(`
              *,
              departements(nom)
            `)
            .eq('email', user.email || '')
            .single();
          profile = retry.data as any;
          error = retry.error as any;
        }

        if (!error && profile) {
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
        }
      } catch (profileError) {
        console.warn('Profil utilisateur non trouvé dans la table users, utilisation des métadonnées Auth:', profileError);
      }

      // Priorité 2: Fallback sur les métadonnées Auth
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

  /**
   * Vérifier si un utilisateur existe dans Supabase Auth (pour diagnostic)
   */
  static async checkUserExistsInAuth(_email: string): Promise<{ exists: boolean; error?: string }> {
    // Côté client, l'API admin n'est pas disponible. On renvoie un résultat neutre.
    return { exists: false };
  }
}
