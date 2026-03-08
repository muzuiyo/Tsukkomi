export class AuthLogoutService {
  private db: D1Database;
  constructor(db: D1Database) {
    this.db = db;
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.db
      .prepare("DELETE FROM sessions WHERE id = ?")
      .bind(sessionId)
      .run()
      .then(() => {});
  }
}