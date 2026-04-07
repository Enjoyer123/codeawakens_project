import { describe, it, expect, vi, beforeEach } from 'vitest';
import authCheck from '../../middleware/authCheck.js';
import { clerkClient } from '@clerk/express'; // Mock this

vi.mock('@clerk/express', () => ({
  clerkClient: {
    users: {
      getUser: vi.fn(),
    }
  }
}));

describe('Auth Middleware', () => {

  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      headers: {},
      auth: vi.fn(),
      sessionClaims: {}
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    mockNext = vi.fn();
    
    process.env.NODE_ENV = 'development';
  });

  it('should block unauthenticated requests without bypass headers', async () => {
    mockReq.auth.mockReturnValue({ userId: null });
    
    await authCheck(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Unauthorized: No Clerk Token provided'
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should allow requests with dev user bypass header if not in production', async () => {
    mockReq.headers['x-dev-user-id'] = 'test_dev_user';
    mockReq.auth.mockReturnValue({ userId: null });

    await authCheck(mockReq, mockRes, mockNext);

    expect(mockReq.user.id).toBe('test_dev_user');
    expect(mockNext).toHaveBeenCalled();
  });

  it('should allow valid Clerk authenticated requests', async () => {
    mockReq.auth.mockReturnValue({ userId: 'real_clerk_id' });
    clerkClient.users.getUser.mockResolvedValue({ id: 'real_clerk_id', name: 'John' });

    await authCheck(mockReq, mockRes, mockNext);

    expect(mockReq.user.id).toBe('real_clerk_id');
    expect(mockNext).toHaveBeenCalled();
  });

  it('should block developer bypass headers if NODE_ENV is production', async () => {
    process.env.NODE_ENV = 'production';
    mockReq.headers['x-dev-admin-id'] = 'test_dev_admin';
    mockReq.auth.mockReturnValue({ userId: null });

    await authCheck(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });
});
