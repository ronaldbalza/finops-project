import { MiddlewareHandler } from 'hono';
import { Env } from '../types';

// Tenant context interface
export interface TenantContext {
  tenantId: string;
  subdomain?: string;
  customDomain?: string;
}

// Cache for tenant lookups (Workers KV is async, so we cache locally)
const tenantCache = new Map<string, TenantContext>();
const CACHE_TTL = 300000; // 5 minutes

/**
 * Multi-tenant middleware for subdomain and custom domain isolation
 * Extracts tenant information from:
 * 1. Custom domain (mapped in KV)
 * 2. Subdomain (e.g., acme.finops.app)
 * 3. X-Tenant-ID header (for API calls)
 * 4. JWT token claims
 */
export const tenantMiddleware: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  const url = new URL(c.req.url);
  const hostname = url.hostname;

  let tenantContext: TenantContext | null = null;

  // 1. Check X-Tenant-ID header (highest priority for API calls)
  const tenantHeader = c.req.header('X-Tenant-ID');
  if (tenantHeader) {
    tenantContext = {
      tenantId: tenantHeader,
    };
  }

  // 2. Check custom domain mapping
  if (!tenantContext && c.env.CACHE) {
    const cacheKey = `domain:${hostname}`;

    // Check local cache first
    if (tenantCache.has(cacheKey)) {
      const cached = tenantCache.get(cacheKey)!;
      tenantContext = cached;
    } else {
      // Check KV for custom domain mapping
      const mapping = await c.env.CACHE.get(cacheKey);
      if (mapping) {
        const parsed = JSON.parse(mapping);
        tenantContext = {
          tenantId: parsed.tenantId,
          customDomain: hostname,
        };

        // Cache locally
        tenantCache.set(cacheKey, tenantContext);
        setTimeout(() => tenantCache.delete(cacheKey), CACHE_TTL);
      }
    }
  }

  // 3. Check subdomain pattern (e.g., tenant.finops.app)
  if (!tenantContext) {
    const subdomainMatch = hostname.match(/^([a-z0-9-]+)\.finops\.(app|dev|local)/);
    if (subdomainMatch && subdomainMatch[1] !== 'www' && subdomainMatch[1] !== 'api') {
      const subdomain = subdomainMatch[1];

      // Look up tenant by subdomain
      if (c.env.CACHE) {
        const cacheKey = `subdomain:${subdomain}`;

        // Check local cache
        if (tenantCache.has(cacheKey)) {
          tenantContext = tenantCache.get(cacheKey)!;
        } else {
          // Check KV
          const tenantData = await c.env.CACHE.get(cacheKey);
          if (tenantData) {
            const parsed = JSON.parse(tenantData);
            tenantContext = {
              tenantId: parsed.tenantId,
              subdomain: subdomain,
            };

            // Cache locally
            tenantCache.set(cacheKey, tenantContext);
            setTimeout(() => tenantCache.delete(cacheKey), CACHE_TTL);
          }
        }
      }

      // If not found in cache, use subdomain as tenant ID (for development)
      if (!tenantContext) {
        tenantContext = {
          tenantId: subdomain,
          subdomain: subdomain,
        };
      }
    }
  }

  // 4. Check JWT token for tenant information
  if (!tenantContext) {
    const authHeader = c.req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        // Note: This is a simplified version. In production, properly verify the JWT
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.tenantId) {
          tenantContext = {
            tenantId: payload.tenantId,
          };
        }
      } catch (e) {
        // Invalid token format, ignore
      }
    }
  }

  // 5. Default tenant for development/demo
  if (!tenantContext && c.env.ENVIRONMENT === 'development') {
    tenantContext = {
      tenantId: 'demo',
      subdomain: 'demo',
    };
  }

  // Store tenant context for downstream handlers
  if (tenantContext) {
    c.set('tenant', tenantContext);

    // Add tenant ID to response headers for debugging
    c.header('X-Tenant-ID', tenantContext.tenantId);
  } else {
    // No tenant context found
    if (c.req.path.startsWith('/api/v1/auth/')) {
      // Allow auth endpoints without tenant context
      await next();
      return;
    }

    // Require tenant context for all other endpoints
    return c.json({
      error: 'Tenant context required',
      message: 'Unable to determine tenant from request',
    }, 400);
  }

  await next();
};

/**
 * Helper to get tenant context from Hono context
 */
export function getTenant(c: any): TenantContext {
  const tenant = c.get('tenant') as TenantContext;
  if (!tenant) {
    throw new Error('Tenant context not found');
  }
  return tenant;
}

/**
 * Middleware to validate tenant access
 * Ensures user belongs to the requested tenant
 */
export const validateTenantAccess: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  const tenant = c.get('tenant') as TenantContext;
  const user = c.get('user');

  if (user && tenant && user.tenantId !== tenant.tenantId) {
    return c.json({
      error: 'Access denied',
      message: 'User does not belong to this tenant',
    }, 403);
  }

  await next();
};

/**
 * Store tenant mapping in KV
 * Used when creating new tenants or updating domain mappings
 */
export async function storeTenantMapping(
  env: Env,
  type: 'subdomain' | 'domain',
  key: string,
  tenantId: string,
  additionalData?: any
): Promise<void> {
  const cacheKey = `${type}:${key}`;
  const data = {
    tenantId,
    createdAt: new Date().toISOString(),
    ...additionalData,
  };

  await env.CACHE.put(cacheKey, JSON.stringify(data), {
    expirationTtl: 86400, // 24 hours
  });

  // Clear local cache
  tenantCache.delete(cacheKey);
}

/**
 * Remove tenant mapping from KV
 */
export async function removeTenantMapping(
  env: Env,
  type: 'subdomain' | 'domain',
  key: string
): Promise<void> {
  const cacheKey = `${type}:${key}`;
  await env.CACHE.delete(cacheKey);

  // Clear local cache
  tenantCache.delete(cacheKey);
}