import { SessionService } from "../session";

export class AuthDeleteService {
  private db: D1Database;
  constructor(db: D1Database) {
    this.db = db;
  }

  // 软删除用户，并删除所有与用户相关的会话
  async deleteUserById(userId: string): Promise<void> {
    const now = new Date().toISOString();
    const sessionService = new SessionService(this.db);
    await this.db
      .prepare(
        "UPDATE users SET is_deleted = 1, updated_at = ?, deleted_at = ? WHERE id = ?",
      )
      .bind(now, now, userId)
      .run()
      .then(() => {});
    await sessionService.deleteSessionByUserId(userId);
  }
}
