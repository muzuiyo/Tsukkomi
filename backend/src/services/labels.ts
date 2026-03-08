import { LabelRow } from "../types/db";

export class LabelsService {
  private db: D1Database;
  constructor(db: D1Database) {
    this.db = db;
  }

  async getLabelsByMemoId(memoId: string): Promise<LabelRow[]> {
    return this.db
      .prepare(
        `
          SELECT l.id, l.user_id, l.name, l.created_at
          FROM labels l
          JOIN memo_labels ml ON l.id = ml.label_id
          WHERE ml.memo_id = ?
        `,
      )
      .bind(memoId)
      .all<LabelRow>()
      .then((res) => res.results);
  }

  async getLabelCountByUserId(
    userId: string,
    onlyPublic = false
  ): Promise<{ name: string; count: number }[]> {

    const sql = `
      SELECT
        l.name AS name,
        COUNT(DISTINCT m.id) AS count
      FROM memos m
      JOIN memo_labels ml ON ml.memo_id = m.id
      JOIN labels l ON l.id = ml.label_id
      WHERE m.user_id = ?
        AND m.is_deleted = 0
        ${onlyPublic ? "AND m.is_public = 1" : ""}
      GROUP BY l.id
      ORDER BY count DESC
    `;

    const result = await this.db
      .prepare(sql)
      .bind(userId)
      .all<{ name: string; count: number }>();

    return result.results ?? [];
  }
}


