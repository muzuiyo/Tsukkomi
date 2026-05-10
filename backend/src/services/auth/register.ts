import bcrypt from "bcryptjs";

export class AuthRegisterService {
  private db: D1Database;
  constructor(db: D1Database) {
    this.db = db;
  }

  isMissingFields(username: string, email: string, password: string): boolean {
    return !username || !email || !password;
  }

  async isEmailExists(email: string): Promise<boolean> {
    email = email?.trim().toLowerCase();
    return this.db
      .prepare("SELECT COUNT(*) AS count FROM users WHERE email = ?")
      .bind(email)
      .first<{ count: number }>()
      .then((row) => (row?.count ?? 0) > 0);
  }

  async isUsernameExists(username: string): Promise<boolean> {
    username = username?.trim().toLowerCase();
    return this.db
      .prepare(
        "SELECT COUNT(*) AS count FROM users WHERE LOWER(username) = ?"
      )
      .bind(username)
      .first<{ count: number }>()
      .then((row) => (row?.count ?? 0) > 0);
  }

  async createUser(
    id: string,
    username: string,
    email: string,
    password: string,
  ): Promise<void> {
    email = email?.trim().toLowerCase();
    username = username?.trim().toLowerCase();
    const hashedPassword = await bcrypt.hash(password, 10);
    await this.db
      .prepare(
        "INSERT INTO users (id, username, email, password_hash, role) VALUES (?, ?, ?, ?, 'user')",
      )
      .bind(id, username, email, hashedPassword)
      .run();
  }
}
