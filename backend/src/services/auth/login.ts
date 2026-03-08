import { UserRow } from "../../types/db";

export class AuthLoginService {
  private db: D1Database;
  constructor(db: D1Database) {
    this.db = db;
  }

  async getUserByEmail(
    email: string,
  ): Promise<UserRow | null> {
    // 邮箱检查时忽略大小写和前后空格
    return this.db
      .prepare("SELECT id, password_hash, username, role, is_deleted, created_at, deleted_at FROM users WHERE email = ?")
      .bind(email?.trim().toLowerCase())
      .first<UserRow>();
  }
}
