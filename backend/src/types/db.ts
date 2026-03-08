export type Role = "user" | "admin";

export interface UserRow {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  is_deleted: 0 | 1;
  role: Role;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface MemoRow {
  id: string;
  user_id: string;
  content: string;
  is_public: 0 | 1;
  is_deleted: 0 | 1;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface LabelRow {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface MemoLabelRow {
  memo_id: string;
  label_id: string;
}

export interface SessionRow {
  id: string;
  user_id: string;
  expires_at: string;
  created_at: string;
}

export interface PasswordResetTokenRow {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}
