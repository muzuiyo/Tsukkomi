import { SessionRow } from "../types/db";

export class SessionService {
  private db: D1Database;
  constructor(db: D1Database) {
    this.db = db;
  }

  async setSession(
    sessionId: string,
    userId: string,
    expiresAt: string,
  ): Promise<void> {
    return this.db
      .prepare(
        "INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)",
      )
      .bind(sessionId, userId, expiresAt)
      .run()
      .then(() => {});
  }

  async getSessionById(sessionId: string) {
    return this.db
      .prepare("SELECT id, user_id, expires_at FROM sessions WHERE id = ?")
      .bind(sessionId)
      .first<SessionRow>();
  }

  // 删除所有与用户相关的会话
  async deleteSessionByUserId(userId: string): Promise<void> {
    await this.db
      .prepare("DELETE FROM sessions WHERE user_id = ?")
      .bind(userId)
      .run()
      .then(() => {});
  }

  // 根据 sessionId 删除会话
  async deleteSessionBySessionId(sessionId: string): Promise<void> {
    await this.db
      .prepare("DELETE FROM sessions WHERE id = ?")
      .bind(sessionId)
      .run()
      .then(() => {});
  }
}
