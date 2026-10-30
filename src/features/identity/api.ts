/** Identity endpoint paths. HTTP calls and token handling are added during integration. */
export const identityPaths = {
  devLogin: "/api/v1/auth/dev-login",
  steamLogin: "/api/v1/auth/steam/login",
  steamCallback: "/api/v1/auth/steam/callback",
  currentUser: "/api/v1/users/me",
  publicUser: (userId: string) => `/api/v1/users/${encodeURIComponent(userId)}`,
} as const;
