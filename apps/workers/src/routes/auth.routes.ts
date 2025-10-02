import { Hono } from 'hono';
import { AuthService } from '../services/auth.service';
import { Env } from '../types/index';

const authRoutes = new Hono<{ Bindings: Env }>();

// Initialize OAuth flow
authRoutes.get('/login/:provider', async (c) => {
  const provider = c.req.param('provider') as 'google' | 'microsoft';

  if (provider !== 'google' && provider !== 'microsoft') {
    return c.json({ error: 'Invalid provider' }, 400);
  }

  const authService = new AuthService(c.env);

  // Generate state for CSRF protection
  const state = crypto.randomUUID();

  // Store state in KV for validation (expires in 10 minutes)
  await c.env.SESSIONS.put(
    `state:${state}`,
    JSON.stringify({ provider, timestamp: Date.now() }),
    { expirationTtl: 600 }
  );

  const authUrl = authService.getAuthorizationUrl(provider, state);

  return c.json({ authUrl });
});

// Handle OAuth callback
authRoutes.get('/callback/:provider', async (c) => {
  const provider = c.req.param('provider') as 'google' | 'microsoft';
  const { code, state, error } = c.req.query();

  if (error) {
    return c.json({ error: `OAuth error: ${error}` }, 400);
  }

  if (!code || !state) {
    return c.json({ error: 'Missing code or state parameter' }, 400);
  }

  const authService = new AuthService(c.env);

  // Validate state
  const storedStateData = await c.env.SESSIONS.get(`state:${state}`);

  if (!storedStateData) {
    return c.json({ error: 'Invalid or expired state' }, 400);
  }

  const { provider: storedProvider } = JSON.parse(storedStateData);

  if (provider !== storedProvider) {
    return c.json({ error: 'Provider mismatch' }, 400);
  }

  // Clean up state
  await c.env.SESSIONS.delete(`state:${state}`);

  try {
    // Exchange code for tokens
    const tokens = await authService.exchangeCodeForTokens(provider, code);

    // Get user info
    const userInfo = await authService.getUserInfo(provider, tokens.access_token);

    // TODO: Check if user exists in database, create if not
    // For now, we'll use mock data
    const userId = userInfo.id;
    const tenantId = 'default-tenant'; // This should come from user's organization
    const role = 'member'; // Default role, should be fetched from database

    // Generate JWT
    const jwt = await authService.generateToken(
      userId,
      userInfo.email,
      userInfo.name,
      tenantId,
      role
    );

    // Create session
    const sessionId = crypto.randomUUID();
    await authService.createSession(
      sessionId,
      userId,
      jwt,
      tokens.refresh_token
    );

    // Return session info (in production, set as httpOnly cookie)
    return c.json({
      success: true,
      sessionId,
      token: jwt,
      user: {
        id: userId,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        tenantId,
        role
      }
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    return c.json({ error: 'Authentication failed' }, 500);
  }
});

// Verify token endpoint
authRoutes.get('/verify', async (c) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid authorization header' }, 401);
  }

  const token = authHeader.substring(7);
  const authService = new AuthService(c.env);

  const payload = await authService.verifyToken(token);

  if (!payload) {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }

  return c.json({
    valid: true,
    user: {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      tenantId: payload.tenantId,
      role: payload.role
    }
  });
});

// Logout endpoint
authRoutes.post('/logout', async (c) => {
  const { sessionId } = await c.req.json();

  if (!sessionId) {
    return c.json({ error: 'Missing session ID' }, 400);
  }

  const authService = new AuthService(c.env);
  await authService.deleteSession(sessionId);

  return c.json({ success: true });
});

// Refresh token endpoint
authRoutes.post('/refresh', async (c) => {
  const { sessionId } = await c.req.json();

  if (!sessionId) {
    return c.json({ error: 'Missing session ID' }, 400);
  }

  const authService = new AuthService(c.env);
  const session = await authService.getSession(sessionId);

  if (!session) {
    return c.json({ error: 'Session not found' }, 404);
  }

  // TODO: Implement token refresh logic with OAuth provider
  // For now, we'll just extend the session

  const newToken = await authService.generateToken(
    session.userId,
    session.email || 'user@example.com', // These should be stored in session
    session.name || 'User',
    session.tenantId || 'default-tenant',
    session.role || 'member'
  );

  await authService.createSession(
    sessionId,
    session.userId,
    newToken,
    session.refreshToken
  );

  return c.json({
    success: true,
    token: newToken
  });
});

export default authRoutes;