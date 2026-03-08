import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";

export class AuthPasswordService {
  private db: D1Database;
  private encoder = new TextEncoder();
  constructor(db: D1Database) {
    this.db = db;
  }

  /**
   * SHA256 hash (Web Crypto API)
   */
  private async sha256(input: string): Promise<string> {
    const data = this.encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    return hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  /**
   * 创建 password reset token
   */
  async createPasswordResetToken(email: string) {
    const user = await this.db
      .prepare(`
        SELECT id
        FROM users
        WHERE email = ? AND is_deleted = 0
      `)
      .bind(email.trim().toLowerCase())
      .first<{ id: string }>();

    if (!user) {
      return null;
    }

    const userId = user.id;

    // 删除旧 token
    await this.db
      .prepare(`
        DELETE FROM password_reset_tokens
        WHERE user_id = ?
      `)
      .bind(userId)
      .run();

    const token = nanoid(48);

    const tokenHash = await this.sha256(token);

    await this.db
      .prepare(`
        INSERT INTO password_reset_tokens
        (id, user_id, token_hash, expires_at)
        VALUES (?, ?, ?, datetime('now', '+5 minutes'))
      `)
      .bind(nanoid(), userId, tokenHash)
      .run();

    return token;
  }

  /**
   * 验证 reset token
   */
  async verifyPasswordResetToken(token: string) {
    const tokenHash = await this.sha256(token);
    const record = await this.db
      .prepare(`
        SELECT id, user_id, expires_at
        FROM password_reset_tokens
        WHERE token_hash = ? AND expires_at > CURRENT_TIMESTAMP
      `)
      .bind(tokenHash)
      .first<{
        id: string;
        user_id: string;
        expires_at: string;
      }>();

    if (!record) {
      return null;
    }

    return {
      tokenId: record.id,
      userId: record.user_id,
    };
  }

  /**
   * 重置密码
   */
  async resetPassword(token: string, newPassword: string) {
    const record = await this.verifyPasswordResetToken(token);
    if (!record) {
      throw new Error("Invalid or expired token");
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.db
      .prepare(`
        UPDATE users
        SET password_hash = ?
        WHERE id = ?
      `)
      .bind(passwordHash, record.userId)
      .run();

    // 删除 token
    await this.db
      .prepare(`
        DELETE FROM password_reset_tokens
        WHERE id = ?
      `)
      .bind(record.tokenId)
      .run();
  }
}