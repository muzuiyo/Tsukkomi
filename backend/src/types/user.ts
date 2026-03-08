import type { Role } from "./db";

// 对外返回
export interface PublicUser {
  id: string;
  username: string;
  role: Role;
  createdAt: string;
}

// 内部使用
export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: Role;
  isDeleted: boolean;
  createdAt: string;
  deletedAt: string | null;
}
