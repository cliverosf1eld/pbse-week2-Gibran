export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://pbse-week2.vercel.app/v1';

// Unset means mock mode: no sign-in, for use with the Prism mock server.
export const KEYCLOAK_URL = process.env.EXPO_PUBLIC_KEYCLOAK_URL;
