import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../../utils/auth';
import { mockUsers } from '../utils/testUtils';

describe('AuthService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('authenticates valid user', () => {
      const user = AuthService.login('marie@example.com', 'password123', mockUsers);
      expect(user).toBeTruthy();
      expect(user?.email).toBe('marie@example.com');
    });

    it('rejects invalid credentials', () => {
      const user = AuthService.login('invalid@example.com', 'wrong', mockUsers);
      expect(user).toBeNull();
    });

    it('rejects wrong password', () => {
      const user = AuthService.login('marie@example.com', 'wrong', mockUsers);
      expect(user).toBeNull();
    });

    it('stores user in localStorage on successful login', () => {
      AuthService.login('marie@example.com', 'password123', mockUsers);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'auth_user',
        expect.stringContaining('marie@example.com')
      );
    });
  });

  describe('logout', () => {
    it('removes user from localStorage', () => {
      AuthService.logout();
      expect(localStorage.removeItem).toHaveBeenCalledWith('auth_user');
    });
  });

  describe('getCurrentUser', () => {
    it('returns null when no user stored', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);
      expect(AuthService.getCurrentUser()).toBeNull();
    });

    it('returns user when stored', () => {
      const mockUserData = JSON.stringify({
        id: '1',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00.000Z'
      });
      vi.mocked(localStorage.getItem).mockReturnValue(mockUserData);
      
      const user = AuthService.getCurrentUser();
      expect(user).toBeTruthy();
      expect(user?.email).toBe('test@example.com');
    });
  });

  describe('isAuthenticated', () => {
    it('returns true when user is logged in', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify({ id: '1' }));
      expect(AuthService.isAuthenticated()).toBe(true);
    });

    it('returns false when no user logged in', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);
      expect(AuthService.isAuthenticated()).toBe(false);
    });
  });
});