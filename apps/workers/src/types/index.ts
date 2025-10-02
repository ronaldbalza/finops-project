// Type definitions for Cloudflare bindings
export interface Env {
  // KV Namespaces
  SESSIONS: KVNamespace
  CACHE: KVNamespace

  // R2 Bucket
  REPORTS: R2Bucket

  // D1 Database
  DB: D1Database

  // Durable Objects
  RATE_LIMITER: DurableObjectNamespace

  // Environment Variables
  ENVIRONMENT: string
  DATABASE_URL: string
  JWT_SECRET: string
  APP_URL: string

  // OAuth Credentials
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  MICROSOFT_CLIENT_ID: string
  MICROSOFT_CLIENT_SECRET: string

  // Stripe
  STRIPE_SECRET_KEY?: string
  STRIPE_WEBHOOK_SECRET?: string
}

// User types
export interface User {
  id: string
  email: string
  name: string
  picture?: string
  tenantId: string
  role: string
}

// Session types
export interface Session {
  userId: string
  token: string
  refreshToken?: string
  createdAt: string
  expiresAt: string
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// FinOps Metrics types
export interface CostMetrics {
  totalCost: number
  allocatedCost: number
  unallocatedCost: number
  allocationPercentage: number
  effectiveSavingsRate: number
  forecastVariance: number
}

export interface Optimization {
  id: string
  type: 'rightsizing' | 'reservation' | 'waste' | 'scheduling'
  resource: string
  currentCost: number
  optimizedCost: number
  savings: number
  confidence: 'high' | 'medium' | 'low'
  status: 'pending' | 'applied' | 'ignored'
}

export interface Anomaly {
  id: string
  service: string
  metric: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  detected: Date
  deviation: number
  message: string
}