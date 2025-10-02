import jwt from '@tsndr/cloudflare-worker-jwt';
import { Env } from '../types/index';

interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scope: string;
}

interface UserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
  provider: 'google' | 'microsoft';
}

interface JWTPayload {
  sub: string;
  email: string;
  name: string;
  tenantId: string;
  role: string;
  exp: number;
  iat: number;
}

export class AuthService {
  private env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  // OAuth Configuration
  private getOAuthConfig(provider: 'google' | 'microsoft'): OAuthConfig {
    if (provider === 'google') {
      return {
        clientId: this.env.GOOGLE_CLIENT_ID || '',
        clientSecret: this.env.GOOGLE_CLIENT_SECRET || '',
        redirectUri: `${this.env.APP_URL}/auth/callback/google`,
        authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
        scope: 'openid email profile'
      };
    } else {
      return {
        clientId: this.env.MICROSOFT_CLIENT_ID || '',
        clientSecret: this.env.MICROSOFT_CLIENT_SECRET || '',
        redirectUri: `${this.env.APP_URL}/auth/callback/microsoft`,
        authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
        scope: 'openid email profile User.Read'
      };
    }
  }

  // Generate OAuth Authorization URL
  public getAuthorizationUrl(provider: 'google' | 'microsoft', state: string): string {
    const config = this.getOAuthConfig(provider);
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: config.scope,
      state: state,
      access_type: 'offline',
      prompt: 'select_account'
    });

    return `${config.authorizationUrl}?${params.toString()}`;
  }

  // Exchange authorization code for tokens
  public async exchangeCodeForTokens(
    provider: 'google' | 'microsoft',
    code: string
  ): Promise<{ access_token: string; refresh_token?: string }> {
    const config = this.getOAuthConfig(provider);

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: config.redirectUri,
      client_id: config.clientId,
      client_secret: config.clientSecret
    });

    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to exchange code: ${error}`);
    }

    return await response.json();
  }

  // Get user info from OAuth provider
  public async getUserInfo(
    provider: 'google' | 'microsoft',
    accessToken: string
  ): Promise<UserInfo> {
    const config = this.getOAuthConfig(provider);

    const response = await fetch(config.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    const data = await response.json();

    if (provider === 'google') {
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        picture: data.picture,
        provider: 'google'
      };
    } else {
      return {
        id: data.id,
        email: data.mail || data.userPrincipalName,
        name: data.displayName,
        picture: data.photo,
        provider: 'microsoft'
      };
    }
  }

  // Generate JWT token
  public async generateToken(
    userId: string,
    email: string,
    name: string,
    tenantId: string,
    role: string
  ): Promise<string> {
    const payload: JWTPayload = {
      sub: userId,
      email,
      name,
      tenantId,
      role,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
      iat: Math.floor(Date.now() / 1000)
    };

    return await jwt.sign(payload, this.env.JWT_SECRET || 'secret');
  }

  // Verify JWT token
  public async verifyToken(token: string): Promise<JWTPayload | null> {
    try {
      const isValid = await jwt.verify(token, this.env.JWT_SECRET || 'secret');
      if (!isValid) return null;

      const { payload } = jwt.decode(token);
      return payload as JWTPayload;
    } catch {
      return null;
    }
  }

  // Create session in KV
  public async createSession(
    sessionId: string,
    userId: string,
    token: string,
    refreshToken?: string
  ): Promise<void> {
    const session = {
      userId,
      token,
      refreshToken,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    await this.env.SESSIONS.put(
      `session:${sessionId}`,
      JSON.stringify(session),
      {
        expirationTtl: 24 * 60 * 60 // 24 hours
      }
    );
  }

  // Get session from KV
  public async getSession(sessionId: string): Promise<any | null> {
    const session = await this.env.SESSIONS.get(`session:${sessionId}`);
    return session ? JSON.parse(session) : null;
  }

  // Delete session from KV
  public async deleteSession(sessionId: string): Promise<void> {
    await this.env.SESSIONS.delete(`session:${sessionId}`);
  }

  // Generate PKCE challenge
  public generatePKCEChallenge(): { verifier: string; challenge: string } {
    const verifier = this.generateRandomString(128);
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hashBuffer = crypto.subtle.digest('SHA-256', data);

    // Note: This is a simplified version. In production, use proper base64url encoding
    const challenge = btoa(String.fromCharCode(...new Uint8Array(hashBuffer as any)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    return { verifier, challenge };
  }

  // Generate random string for state/nonce
  private generateRandomString(length: number): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    const randomValues = crypto.getRandomValues(new Uint8Array(length));

    for (let i = 0; i < length; i++) {
      result += charset[randomValues[i] % charset.length];
    }

    return result;
  }

  // Validate state parameter
  public async validateState(state: string, storedState: string): Promise<boolean> {
    return state === storedState;
  }
}