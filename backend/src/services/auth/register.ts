import { UserRow } from "../../types/db";
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
    // 邮箱检查时忽略大小写和前后空格
    email = email?.trim().toLowerCase();
    return this.db
      .prepare("SELECT COUNT(*) AS count FROM users WHERE email = ?")
      .bind(email)
      .first<UserRow>()
      .then((row: any) => row.count > 0);
  }

  async isUsernameExists(username: string): Promise<boolean> {
    // 用户名检查时忽略前后空格并转小写
    username = username?.trim().toLowerCase();
    // 小写值比较
    return this.db
      .prepare(
        "SELECT COUNT(*) AS count FROM users WHERE LOWER(username) = ?"
      )
      .bind(username)
      .first<UserRow>()
      .then((row: any) => row.count > 0);
  }

  async createUser(
    id: string,
    username: string,
    email: string,
    password: string,
  ): Promise<void> {
    // 邮箱和用户名存储时都忽略大小写和前后空格
    email = email?.trim().toLowerCase();
    username = username?.trim().toLocaleLowerCase();
    const hashedPassword = await bcrypt.hash(password, 10);
    await this.db
      .prepare(
        "INSERT INTO users (id, username, email, password_hash, role) VALUES (?, ?, ?, ?, 'user')",
      )
      .bind(id, username, email, hashedPassword)
      .run();
  }
}
