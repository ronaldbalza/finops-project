/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { prettyJSON } from 'hono/pretty-json';

interface Env {
	ALLOWED_ORIGINS?: string;
	NODE_ENV: string;
	JWT_SECRET: string;
	DATABASE_URL: string;
}

const app = new Hono<{ Bindings: Env }>();

// Simple JWT-like token creation using base64 encoding
function createToken(payload: any, secret: string): string {
	const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
	const body = btoa(JSON.stringify({ ...payload, exp: Date.now() + 3600000 })); // 1 hour
	return `${header}.${body}.${btoa(secret)}`;
}

function verifyToken(token: string, secret: string): any {
	try {
		const [header, payload, signature] = token.split('.');
		if (signature !== btoa(secret)) {
			throw new Error('Invalid signature');
		}
		const decoded = JSON.parse(atob(payload));
		if (decoded.exp < Date.now()) {
			throw new Error('Token expired');
		}
		return decoded;
	} catch {
		throw new Error('Invalid token');
	}
}

// Middleware
app.use('*', cors({
	origin: (origin) => {
		const allowedOrigins = [
			'http://localhost:3000',
			'http://localhost:5173',
			'https://421437ed.frontend-app-cav.pages.dev',
			'https://9f4178c8.frontend-app-cav.pages.dev',
			'https://master.frontend-app-cav.pages.dev'
		];
		
		return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
	},
	credentials: true,
	allowHeaders: ['Content-Type', 'Authorization'],
	allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use('*', prettyJSON());

// Auth middleware
async function authMiddleware(c: any, next: Function) {
	try {
		const token = c.req.header('Authorization')?.split(' ')[1] || 
					  c.req.header('Cookie')?.split('token=')[1]?.split(';')[0];
		
		if (!token) {
			return c.json({ error: 'No token provided' }, 401);
		}

		const payload = verifyToken(token, c.env.JWT_SECRET || 'fallback-secret');
		c.set('user', payload);
		await next();
	} catch (error) {
		return c.json({ error: 'Invalid token' }, 401);
	}
}

// Health check
app.get('/', (c) => c.text('✅ SaaS Backend Worker is live'));

// API routes
app.get('/api/health', (c) => c.json({ 
	status: 'ok',
	env: c.env.NODE_ENV,
	database: c.env.DATABASE_URL ? 'configured' : 'not configured'
}));

// Auth routes
app.post('/api/auth/login', async (c) => {
	const { email, password } = await c.req.json();

	// Input validation
	if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
		return c.json({ error: 'Invalid email format' }, 400);
	}
	if (!password || password.length < 8) {
		return c.json({ error: 'Password must be at least 8 characters' }, 400);
	}

	try {
		// For now, let's create a simple test user response
		// This will be replaced with actual database logic once we have the environment variables set up
		if (email === 'test@example.com' && password === 'password123') {
			const userPayload = {
				id: 'test-user-id',
				email: email,
				type: 'tenant-user',
				roles: ['Admin'],
				tenantId: 'test-tenant-id',
				tenantName: 'Test Tenant',
				theme: 'light',
				primaryColor: '#6366f1',
			};

			const token = createToken(userPayload, c.env.JWT_SECRET || 'fallback-secret');

			// Set cookie
			c.header('Set-Cookie', `token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=3600; Path=/`);

			return c.json({ ...userPayload, token });
		} else {
			return c.json({ error: 'Invalid credentials' }, 401);
		}
	} catch (error) {
		console.error('Login error:', error);
		return c.json({ error: 'Internal server error' }, 500);
	}
});

app.post('/api/auth/logout', (c) => {
	c.header('Set-Cookie', 'token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/');
	return c.json({ message: 'Logged out successfully' });
});

export default app;
