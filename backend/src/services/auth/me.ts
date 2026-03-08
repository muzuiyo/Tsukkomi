import { UserRow } from "../../types/db";

export class AuthMeService {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  async getUserByUserId(id: string) {
    const user = await this.db
      .prepare(
        `SELECT id, email, username, role, is_deleted, created_at, deleted_at 
         FROM users 
         WHERE id = ?`
      )
      .bind(id)
      .first<UserRow>();

    return user;
  }

  async getUserByUsername(username: string) {
    const user = await this.db
      .prepare(
        `SELECT id, email, username, role, is_deleted, created_at, deleted_at 
         FROM users 
         WHERE username = ?`
      )
      .bind(username.trim().toLowerCase())
      .first<UserRow>();
    return user;
  }
}