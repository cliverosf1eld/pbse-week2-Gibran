// Signing in from a native app (Meeting 9): the system browser, PKCE, no client secret.
// The access token stays in memory; only the refresh token goes to the secure store.
import {
  AuthRequest,
  exchangeCodeAsync,
  makeRedirectUri,
  Prompt,
  refreshAsync,
  ResponseType,
  revokeAsync,
  TokenError,
  type TokenResponse,
} from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import type { Auth, AuthStatus } from './auth';

const REALM = 'badminton-booking';
const CLIENT_ID = 'badminton-mobile';
const REFRESH_TOKEN_KEY = 'badminton.refreshToken';
const EXPIRY_MARGIN_MS = 30 * 1000;

// offline_access: the session must outlive the realm's 30-minute idle limit on a phone.
const SCOPES = ['openid', 'offline_access', 'courts:read', 'bookings:read', 'bookings:write'];

export class KeycloakAuth implements Auth {
  private current: AuthStatus = 'loading';
  private listeners = new Set<() => void>();
  private discovery: { authorizationEndpoint: string; tokenEndpoint: string; revocationEndpoint: string };
  private access: { token: string; expiresAt: number } | null = null;
  private refreshToken: string | null = null;
  private refreshing: Promise<string | null> | null = null;

  constructor(url: string) {
    const oidc = `${url}/realms/${REALM}/protocol/openid-connect`;
    this.discovery = {
      authorizationEndpoint: `${oidc}/auth`,
      tokenEndpoint: `${oidc}/token`,
      revocationEndpoint: `${oidc}/revoke`,
    };
    // No network here: a stored refresh token means signed in, even in airplane mode.
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY)
      .catch(() => null)
      .then(token => {
        this.refreshToken = token;
        this.set(token ? 'signedIn' : 'signedOut');
      });
  }

  private set(status: AuthStatus) {
    this.current = status;
    this.listeners.forEach(listener => listener());
  }

  status = () => this.current;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  signIn = async () => {
    const redirectUri = makeRedirectUri({ scheme: 'badmintonbooking', path: 'callback' });
    const request = new AuthRequest({
      clientId: CLIENT_ID,
      redirectUri,
      scopes: SCOPES,
      responseType: ResponseType.Code,
      usePKCE: true,
      prompt: Prompt.Login,                               // lets another member sign in after sign-out
    });
    const result = await request.promptAsync(this.discovery);
    if (result.type === 'cancel' || result.type === 'dismiss') return false;
    if (result.type !== 'success') throw new Error(`Sign-in failed (${result.type})`);

    const tokens = await exchangeCodeAsync({
      clientId: CLIENT_ID,
      redirectUri,
      code: result.params.code,
      extraParams: { code_verifier: request.codeVerifier ?? '' },
    }, this.discovery);
    await this.keep(tokens);
    this.set('signedIn');
    return true;
  };

  signOut = async () => {
    const token = this.refreshToken;
    await this.forget();
    if (token) {
      revokeAsync({ token, clientId: CLIENT_ID }, this.discovery).catch(() => {});
    }
  };

  // One refresh at a time: the realm revokes a refresh token once it is used, so two
  // requests refreshing together would make the server end the session.
  getToken = async () => {
    if (this.access && Date.now() < this.access.expiresAt) return this.access.token;
    this.refreshing ??= this.refresh().finally(() => { this.refreshing = null; });
    return this.refreshing;
  };

  private async refresh(): Promise<string | null> {
    if (!this.refreshToken) return null;
    try {
      const tokens = await refreshAsync(
        { clientId: CLIENT_ID, refreshToken: this.refreshToken }, this.discovery);
      await this.keep(tokens);
      return tokens.accessToken;
    } catch (e) {
      // Only the server saying the session is over signs the user out.
      // A refresh that fails for lack of a network keeps them signed in.
      if (e instanceof TokenError && e.code === 'invalid_grant') await this.forget();
      return null;
    }
  }

  private async keep(tokens: TokenResponse) {
    this.access = {
      token: tokens.accessToken,
      expiresAt: Date.now() + (tokens.expiresIn ?? 60) * 1000 - EXPIRY_MARGIN_MS,
    };
    if (tokens.refreshToken) {
      this.refreshToken = tokens.refreshToken;
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken);
    }
  }

  private async forget() {
    this.access = null;
    this.refreshToken = null;
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY).catch(() => {});
    this.set('signedOut');
  }
}
