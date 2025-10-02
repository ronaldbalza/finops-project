import { MiddlewareHandler } from 'hono';
import jwt from '@tsndr/cloudflare-worker-jwt';
import { Env } from '../types';

// User context interface
export interface UserContext {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  role: string;
  permissions?: string[];
}

// Role hierarchy for permission checking
const roleHierarchy: Record<string, number> = {
  OWNER: 5,
  ADMIN: 4,
  MANAGER: 3,
  ANALYST: 2,
  VIEWER: 1,
};

/**
 * Authentication middleware
 * Verifies JWT token and extracts user information
 */
export const authMiddleware: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  // Skip auth for public endpoints
  const publicPaths = [
    '/health',
    '/api/v1/auth/login',
    '/api/v1/auth/callback',
    '/api/v1/auth/refresh',
  ];

  if (publicPaths.some(path => c.req.path.startsWith(path))) {
    await next();
    return;
  }

  // Get token from Authorization header
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({
      error: 'Unauthorized',
      message: 'Missing or invalid authorization header',
    }, 401);
  }

  const token = authHeader.substring(7);

  try {
    // Verify JWT token
    const isValid = await jwt.verify(token, c.env.JWT_SECRET || 'secret');
    if (!isValid) {
      return c.json({
        error: 'Unauthorized',
        message: 'Invalid token',
      }, 401);
    }

    // Decode token to get user information
    const { payload } = jwt.decode(token);

    // Check token expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return c.json({
        error: 'Unauthorized',
        message: 'Token expired',
      }, 401);
    }

    // Create user context
    const userContext: UserContext = {
      id: payload.sub as string,
      email: payload.email as string,
      name: payload.name as string,
      tenantId: payload.tenantId as string,
      role: payload.role as string,
      permissions: payload.permissions as string[] || [],
    };

    // Store user context for downstream handlers
    c.set('user', userContext);

    // Add user ID to response headers for debugging
    if (c.env.ENVIRONMENT === 'development') {
      c.header('X-User-ID', userContext.id);
      c.header('X-User-Role', userContext.role);
    }

    await next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return c.json({
      error: 'Unauthorized',
      message: 'Authentication failed',
    }, 401);
  }
};

/**
 * Helper to get user context from Hono context
 */
export function getUser(c: any): UserContext {
  const user = c.get('user') as UserContext;
  if (!user) {
    throw new Error('User context not found');
  }
  return user;
}

/**
 * Role-based access control middleware
 * Checks if user has required role level
 */
export function requireRole(minRole: keyof typeof roleHierarchy): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    const user = c.get('user') as UserContext;

    if (!user) {
      return c.json({
        error: 'Unauthorized',
        message: 'Authentication required',
      }, 401);
    }

    const userRoleLevel = roleHierarchy[user.role] || 0;
    const requiredRoleLevel = roleHierarchy[minRole] || 0;

    if (userRoleLevel < requiredRoleLevel) {
      return c.json({
        error: 'Forbidden',
        message: `Requires ${minRole} role or higher`,
      }, 403);
    }

    await next();
  };
}

/**
 * Permission-based access control middleware
 * Checks if user has specific permission
 */
export function requirePermission(permission: string): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    const user = c.get('user') as UserContext;

    if (!user) {
      return c.json({
        error: 'Unauthorized',
        message: 'Authentication required',
      }, 401);
    }

    // Owners and Admins have all permissions
    if (user.role === 'OWNER' || user.role === 'ADMIN') {
      await next();
      return;
    }

    // Check specific permission
    if (!user.permissions || !user.permissions.includes(permission)) {
      return c.json({
        error: 'Forbidden',
        message: `Requires permission: ${permission}`,
      }, 403);
    }

    await next();
  };
}

/**
 * Rate limiting middleware
 * Uses Durable Objects for distributed rate limiting
 */
export const rateLimitMiddleware: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  const user = c.get('user') as UserContext | undefined;
  const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';

  // Create rate limit key
  const rateLimitKey = user ? `user:${user.id}` : `ip:${ip}`;

  // Get rate limits based on user role
  const limits = getRateLimits(user?.role);

  // Check rate limit using KV (simplified version)
  const now = Date.now();
  const windowStart = now - limits.window;

  const rateLimitData = await c.env.CACHE.get(`ratelimit:${rateLimitKey}`);
  let requestCount = 0;
  let windowData: { count: number; resetAt: number } | null = null;

  if (rateLimitData) {
    windowData = JSON.parse(rateLimitData);
    if (windowData.resetAt > now) {
      requestCount = windowData.count;
    } else {
      // Window expired, reset
      windowData = null;
    }
  }

  if (requestCount >= limits.requests) {
    const resetIn = windowData ? Math.ceil((windowData.resetAt - now) / 1000) : limits.window / 1000;

    return c.json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded',
      retryAfter: resetIn,
    }, 429, {
      'Retry-After': String(resetIn),
      'X-RateLimit-Limit': String(limits.requests),
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': String(windowData?.resetAt || 0),
    });
  }

  // Update rate limit counter
  const newCount = requestCount + 1;
  const newWindowData = windowData || {
    count: 0,
    resetAt: now + limits.window,
  };
  newWindowData.count = newCount;

  await c.env.CACHE.put(
    `ratelimit:${rateLimitKey}`,
    JSON.stringify(newWindowData),
    {
      expirationTtl: Math.ceil(limits.window / 1000),
    }
  );

  // Add rate limit headers
  c.header('X-RateLimit-Limit', String(limits.requests));
  c.header('X-RateLimit-Remaining', String(limits.requests - newCount));
  c.header('X-RateLimit-Reset', String(newWindowData.resetAt));

  await next();
};

/**
 * Get rate limits based on user role
 */
function getRateLimits(role?: string): { requests: number; window: number } {
  const limits: Record<string, { requests: number; window: number }> = {
    OWNER: { requests: 1000, window: 60000 }, // 1000 requests per minute
    ADMIN: { requests: 500, window: 60000 },  // 500 requests per minute
    MANAGER: { requests: 300, window: 60000 }, // 300 requests per minute
    ANALYST: { requests: 200, window: 60000 }, // 200 requests per minute
    VIEWER: { requests: 100, window: 60000 },  // 100 requests per minute
    anonymous: { requests: 50, window: 60000 }, // 50 requests per minute
  };

  return limits[role || 'anonymous'] || limits.anonymous;
}