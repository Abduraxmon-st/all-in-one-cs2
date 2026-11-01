export type UserRole = "USER" | "MODERATOR" | "ADMIN";

export interface UserProfile {
  id: string;
  steamId: string;
  username: string;
  avatarUrl: string | null;
  profileUrl: string | null;
  tradeUrl: string | null;
  role: UserRole;
  createdAt: string;
}

export interface PublicUserSummary {
  userId: string;
  steamId: string;
  username: string;
  avatarUrl: string | null;
}

export interface AuthToken {
  accessToken: string;
  tokenType: "Bearer";
  expiresInMs: number;
  user: UserProfile;
}

export interface DevLoginRequest {
  steamId: string;
  username: string;
  role: UserRole;
}

export interface RegisterRequest {
  username: string;
  email?: string;
  password: string;
}

export interface PasswordLoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface UpdateProfileRequest {
  username?: string;
  avatarUrl?: string;
  tradeUrl?: string;
}
