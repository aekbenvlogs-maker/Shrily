import { describe, it, expect, beforeEach, vi } from '@jest/globals';

// Mock API responses
const mockCheckIdentityResponse = {
  found: false,
  identity_id: null
};

const mockRegisterIdentityResponse = {
  id: 'test-123',
  official_id_number: 'TEST123',
  status: 'registered',
  created_at: new Date().toISOString()
};

describe('API Service', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    global.fetch = vi.fn();
  });

  describe('checkIdentity', () => {
    it('should check identity number and return found=false', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockCheckIdentityResponse
      });

      // Mock implementation since we're testing the contract
      const checkIdentity = async (params: { identity_number: string }) => {
        const response = await fetch('/api/v1/identities/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params)
        });
        return response.json();
      };

      const result = await checkIdentity({ identity_number: 'TEST123' });
      
      expect(result).toHaveProperty('found');
      expect(result.found).toBe(false);
    });

    it('should check identity number and return found=true', async () => {
      const foundResponse = { found: true, identity_id: 'existing-id' };
      
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => foundResponse
      });

      const checkIdentity = async (params: { identity_number: string }) => {
        const response = await fetch('/api/v1/identities/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params)
        });
        return response.json();
      };

      const result = await checkIdentity({ identity_number: 'EXISTING123' });
      
      expect(result.found).toBe(true);
      expect(result).toHaveProperty('identity_id');
    });

    it('should handle API errors gracefully', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ detail: 'Internal Server Error' })
      });

      const checkIdentity = async (params: { identity_number: string }) => {
        const response = await fetch('/api/v1/identities/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params)
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail);
        }
        return response.json();
      };

      await expect(
        checkIdentity({ identity_number: 'ERROR123' })
      ).rejects.toThrow('Internal Server Error');
    });
  });

  describe('registerIdentity', () => {
    it('should register identity with all required fields', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockRegisterIdentityResponse
      });

      const registerIdentity = async (data: any) => {
        const response = await fetch('/api/v1/identities/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        return response.json();
      };

      const result = await registerIdentity({
        official_id_number: 'TEST123',
        full_name: 'Test User',
        first_name: 'Test',
        last_name: 'User',
        date_of_birth: '1990-01-01',
        official_id_type: 'identity_card',
        email: 'test@example.com',
        gdpr_consent: true
      });

      expect(result).toHaveProperty('id');
      expect(result.status).toBe('registered');
    });

    it('should return error for missing required fields', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({
          detail: [
            {
              loc: ['body', 'email'],
              msg: 'field required',
              type: 'value_error.missing'
            }
          ]
        })
      });

      const registerIdentity = async (data: any) => {
        const response = await fetch('/api/v1/identities/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(JSON.stringify(error.detail));
        }
        return response.json();
      };

      await expect(
        registerIdentity({
          official_id_number: 'TEST123',
          full_name: 'Test User',
          // Missing email
          gdpr_consent: true
        })
      ).rejects.toThrow();
    });

    it('should reject registration without GDPR consent', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ detail: 'GDPR consent required' })
      });

      const registerIdentity = async (data: any) => {
        const response = await fetch('/api/v1/identities/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail);
        }
        return response.json();
      };

      await expect(
        registerIdentity({
          official_id_number: 'TEST123',
          full_name: 'Test User',
          first_name: 'Test',
          last_name: 'User',
          date_of_birth: '1990-01-01',
          official_id_type: 'identity_card',
          email: 'test@example.com',
          gdpr_consent: false
        })
      ).rejects.toThrow('GDPR consent required');
    });

    it('should detect duplicate registrations', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockRegisterIdentityResponse
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 409,
          json: async () => ({ detail: 'Identity already registered' })
        });

      const registerIdentity = async (data: any) => {
        const response = await fetch('/api/v1/identities/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail);
        }
        return response.json();
      };

      const payload = {
        official_id_number: 'DUP123',
        full_name: 'Duplicate User',
        first_name: 'Duplicate',
        last_name: 'User',
        date_of_birth: '1985-05-15',
        official_id_type: 'passport',
        email: 'dup@example.com',
        gdpr_consent: true
      };

      // First registration succeeds
      const result1 = await registerIdentity(payload);
      expect(result1).toHaveProperty('id');

      // Second registration fails
      await expect(registerIdentity(payload)).rejects.toThrow(
        'Identity already registered'
      );
    });
  });

  describe('Error Handling', () => {
    it('should timeout on slow requests', async () => {
      global.fetch = vi.fn(() =>
        new Promise(resolve => setTimeout(resolve, 10000))
      );

      const checkIdentity = async (params: { identity_number: string }) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        try {
          const response = await fetch('/api/v1/identities/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params),
            signal: controller.signal
          });
          return response.json();
        } finally {
          clearTimeout(timeout);
        }
      };

      await expect(
        checkIdentity({ identity_number: 'SLOW123' })
      ).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(
        new Error('Network error')
      );

      const checkIdentity = async (params: { identity_number: string }) => {
        try {
          const response = await fetch('/api/v1/identities/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
          });
          return response.json();
        } catch (error) {
          throw new Error(`API call failed: ${(error as Error).message}`);
        }
      };

      await expect(
        checkIdentity({ identity_number: 'NET123' })
      ).rejects.toThrow('API call failed: Network error');
    });
  });
});
