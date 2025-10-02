import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { secureHeaders } from 'hono/secure-headers'
import authRoutes from './routes/auth.routes'
import { Env } from './types/index'
import { tenantMiddleware } from './middleware/tenant.middleware'
import { authMiddleware, rateLimitMiddleware } from './middleware/auth.middleware'

// Initialize Hono app with Cloudflare Workers type
const app = new Hono<{ Bindings: Env }>()

// Global middleware
app.use('*', logger())
app.use('*', secureHeaders())
app.use('*', prettyJSON())

// Apply rate limiting
app.use('*', rateLimitMiddleware)

// Apply multi-tenancy
app.use('*', tenantMiddleware)

// CORS configuration
app.use('*', cors({
  origin: (origin) => {
    // Allow requests from our frontend domains
    const allowedDomains = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://finops.app',
      'https://*.finops.app'
    ]

    if (!origin) return null

    if (allowedDomains.some(domain => {
      if (domain.includes('*')) {
        const regex = new RegExp(domain.replace('*', '.*'))
        return regex.test(origin)
      }
      return domain === origin
    })) {
      return origin
    }

    return null
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    environment: c.env.ENVIRONMENT || 'development',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

// API versioning
const v1 = new Hono<{ Bindings: Env }>()

// Apply authentication to all v1 routes except auth endpoints
v1.use('*', async (c, next) => {
  // Skip auth for auth routes
  if (c.req.path.startsWith('/api/v1/auth/')) {
    await next()
    return
  }
  // Apply auth middleware for other routes
  await authMiddleware(c, next)
})

// Core API routes placeholder
v1.get('/', (c) => {
  return c.json({
    message: 'FinOps Platform API v1',
    endpoints: {
      auth: '/api/v1/auth',
      costs: '/api/v1/costs',
      optimization: '/api/v1/optimization',
      governance: '/api/v1/governance',
      reports: '/api/v1/reports'
    }
  })
})

// Mount authentication routes
v1.route('/auth', authRoutes)

// Cost routes placeholder
v1.get('/costs/allocation', (c) => {
  return c.json({ message: 'Cost allocation endpoint - to be implemented' })
})

v1.get('/costs/anomalies', (c) => {
  return c.json({ message: 'Anomaly detection endpoint - to be implemented' })
})

// Mount v1 routes
app.route('/api/v1', v1)

// 404 handler
app.notFound((c) => {
  return c.json({
    error: 'Not Found',
    message: 'The requested resource was not found',
    path: c.req.path
  }, 404)
})

// Error handler
app.onError((err, c) => {
  console.error('Error:', err)

  if (err instanceof Error) {
    return c.json({
      error: 'Internal Server Error',
      message: c.env.ENVIRONMENT === 'development' ? err.message : 'An error occurred',
      ...(c.env.ENVIRONMENT === 'development' && { stack: err.stack })
    }, 500)
  }

  return c.json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred'
  }, 500)
})

// Export for Cloudflare Workers
export default app

// Durable Object for Rate Limiting
export class RateLimiter {
  state: DurableObjectState

  constructor(state: DurableObjectState) {
    this.state = state
  }

  async fetch(request: Request): Promise<Response> {
    // Rate limiting logic to be implemented
    return new Response('Rate limiter initialized', { status: 200 })
  }
}