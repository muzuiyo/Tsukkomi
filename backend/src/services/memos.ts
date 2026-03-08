import { MemoRow } from "../types/db";
import { nanoid } from "nanoid";
import { QueryParameters } from "../types/query";

export class MemosService {
  private db: D1Database;
  constructor(db: D1Database) {
    this.db = db;
  }

  async getMemoById(id: string) {
    const memo = await this.db
      .prepare("SELECT * FROM memos WHERE id = ?")
      .bind(id)
      .first<MemoRow>();
    return memo;
  }

  async getMemos(params: QueryParameters) {
    const {
      userId,
      page,
      pageSize = 20,
      keyword,
      visibility = "all",
      labels = [],
      startDate,
      endDate,
      currentUserId
    } = params;

    const offset = (page - 1) * pageSize;
    const sqlParams: any[] = [];

    // ---------- 可见性 ----------
    let visibilityCondition = "";

    if (!userId) {
      if (currentUserId) {
        if(visibility === "public") {
          visibilityCondition = `(m.is_public = 1)`;
        }
        else if(visibility === "private") {
          visibilityCondition = `(m.user_id = ? AND m.is_public = 0)`
          sqlParams.push(currentUserId);
        }
        else {
          visibilityCondition = `(m.user_id = ? OR m.is_public = 1)`;
          sqlParams.push(currentUserId);
        }
      } else {
        visibilityCondition = `m.is_public = 1`;
      }
    } else {
      if (visibility === "public") {
        visibilityCondition = `(m.user_id = ? AND m.is_public = 1)`;
        sqlParams.push(userId);
      } else if (visibility === "private") {
        if (!currentUserId || currentUserId !== userId) {
          return [];
        }
        visibilityCondition = `(m.user_id = ? AND m.is_public = 0)`;
        sqlParams.push(userId);
      } else {
        if (currentUserId && currentUserId === userId) {
          visibilityCondition = `(m.user_id = ?)`;
        } else {
          visibilityCondition = `(m.user_id = ? AND m.is_public = 1)`;
        }
        sqlParams.push(userId);
      }
    }

    // ---------- 时间 ----------
    const timeCondition: string[] = [];

    if (startDate) {
      timeCondition.push(`m.created_at >= ?`);
      sqlParams.push(startDate);
    }

    if (endDate) {
      timeCondition.push(`m.created_at < ?`);
      sqlParams.push(endDate);
    }


    // ---------- 关键词 ----------
    if (keyword) {
      timeCondition.push(`m.content LIKE ?`);
      sqlParams.push(`%${keyword}%`);
    }

    // ---------- 标签 ----------
    let labelJoin = "";
    let labelCondition = "";
    let labelHaving = "";
    
    if (labels.length > 0) {
      const placeholders = labels.map(() => "?").join(",");

      labelJoin = `
        JOIN memo_labels ml_filter ON ml_filter.memo_id = m.id
        JOIN labels l_filter ON l_filter.id = ml_filter.label_id
      `;

      labelCondition = `AND l_filter.name IN (${placeholders})`;
      labelHaving = `HAVING COUNT(DISTINCT l_filter.name) = ${labels.length}`;

      sqlParams.push(...labels);
    }

    // ---------- 获取 memo_id ----------
    const idSql = `
      SELECT m.id
      FROM memos m
      ${labelJoin}
      WHERE m.is_deleted = 0
        AND ${visibilityCondition}
        ${timeCondition.length ? "AND " + timeCondition.join(" AND ") : ""}
        ${labelCondition}
      GROUP BY m.id
      ${labelHaving}
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `;

    sqlParams.push(pageSize, offset);

    const idResult = await this.db
      .prepare(idSql)
      .bind(...sqlParams)
      .all<{ id: string }>();

    const memoIds = idResult.results?.map((r) => r.id) || [];

    if (memoIds.length === 0) return [];

    // ---------- 获取完整 memo ----------
    const memoSql = `
      SELECT 
        m.id,
        m.user_id,
        u.username,
        m.content,
        m.is_public,
        m.created_at,
        GROUP_CONCAT(l.name) as labels
      FROM memos m
      LEFT JOIN users u ON m.user_id = u.id
      LEFT JOIN memo_labels ml ON m.id = ml.memo_id
      LEFT JOIN labels l ON ml.label_id = l.id
      WHERE m.id IN (${memoIds.map(() => "?").join(",")})
      GROUP BY m.id
      ORDER BY m.created_at DESC
    `;

    const memosResult = await this.db
      .prepare(memoSql)
      .bind(...memoIds)
      .all<any>();

    return (
      memosResult.results?.map((row) => ({
        id: row.id,
        userId: row.user_id,
        username: row.username,
        content: row.content,
        isPublic: row.is_public,
        createdAt: row.created_at,
        labels: row.labels ? row.labels.split(",") : [],
      })) ?? []
    );
  }

  async createMemo(
    userId: string,
    payload: {
      content: string;
      isPublic?: 0 | 1;
      labels?: string[];
    },
  ) {
    const { content, isPublic = 0, labels } = payload;

    if (!content || content.trim().length === 0) {
      throw new Error("Content cannot be empty");
    }

    const memoId = nanoid();
    const statements: D1PreparedStatement[] = [];

    // 创建 memo
    statements.push(
      this.db
        .prepare(
          `
          INSERT INTO memos (id, user_id, content, is_public, created_at)
          VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        `,
        )
        .bind(memoId, userId, content.trim(), isPublic),
    );

    // 处理标签
    if (labels && labels.length > 0) {
      const normalized = Array.from(
        new Set(labels.map((l) => l.trim().toLowerCase()).filter((l) => l.length > 0)),
      );

      if (normalized.length > 0) {
        const placeholders = normalized.map(() => "?").join(",");

        // ---------- INSERT OR IGNORE 所有标签 ----------
        for (const name of normalized) {
          const labelId = nanoid();
          statements.push(
            this.db
              .prepare(
                `
                INSERT OR IGNORE INTO labels (id, user_id, name, created_at)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
              `,
              )
              .bind(labelId, userId, name),
          );
        }

        await this.db.batch(statements);

        // ---------- SELECT 拿到实际 labelId ----------
        const actualLabels = await this.db
          .prepare(
            `
              SELECT id, name 
              FROM labels 
              WHERE user_id = ? AND name IN (${placeholders})
            `,
          )
          .bind(userId, ...normalized)
          .all<{ id: string; name: string }>();

        const labelMap = new Map(
          actualLabels.results.map((l) => [l.name, l.id]),
        );

        // ---------- 建立 memo_labels 关系 ----------
        const memoLabelStatements: D1PreparedStatement[] = [];
        for (const name of normalized) {
          const labelId = labelMap.get(name)!;
          memoLabelStatements.push(
            this.db
              .prepare(
                `
                  INSERT INTO memo_labels (memo_id, label_id)
                  VALUES (?, ?)
                `,
              )
              .bind(memoId, labelId),
          );
        }

        await this.db.batch(memoLabelStatements);
      }
    } else {
      // 如果没有标签，直接执行 memo 的 INSERT
      await this.db.batch(statements);
    }
    // 返回 memos
    const memo = await this.db
      .prepare(
        `
        SELECT 
          m.id,
          m.content,
          m.is_public,
          m.created_at,
          m.updated_at,
          u.username
        FROM memos m
        JOIN users u ON m.user_id = u.id
        WHERE m.id = ?
      `,
      )
      .bind(memoId)
      .first<{
        id: string;
        content: string;
        is_public: 0 | 1;
        created_at: string;
        updated_at: string;
        username: string;
      }>();

    if (!memo) return null;

    const memoLabels = await this.db
      .prepare(
        `
        SELECT l.name
        FROM labels l
        JOIN memo_labels ml ON l.id = ml.label_id
        WHERE ml.memo_id = ?
      `,
      )
      .bind(memoId)
      .all<{ name: string }>();

    return {
      id: memo.id,
      content: memo.content,
      username: memo.username,
      isPublic: memo.is_public,
      createdAt: memo.created_at,
      updatedAt: memo.updated_at,
      labels: memoLabels.results.map((l) => l.name),
    };
  }

  async updateMemoById(
    memoId: string,
    userId: string,
    updates: {
      content?: string;
      isPublic?: 0 | 1;
      labels?: string[];
    },
  ) {
    const { content, isPublic, labels } = updates;
    const statements: D1PreparedStatement[] = [];

    // ---------- 更新 memo 本体 ----------
    if (content !== undefined || isPublic !== undefined) {
      statements.push(
        this.db
          .prepare(
            `
              UPDATE memos
              SET
                content = COALESCE(?, content),
                is_public = COALESCE(?, is_public)
              WHERE id = ?
            `,
          )
          .bind(content ?? null, isPublic ?? null, memoId),
      );
    }

    // ---------- 更新标签 ----------
    if (labels !== undefined) {
      // 规范化 labels
      const normalized = Array.from(
        new Set(labels.map((l) => l.trim().toLowerCase()).filter((l) => l.length > 0)),
      );

      // 先删除旧标签关系
      statements.push(
        this.db
          .prepare(`DELETE FROM memo_labels WHERE memo_id = ?`)
          .bind(memoId),
      );

      await this.db.batch(statements);

      if (normalized.length > 0) {
        const placeholders = normalized.map(() => "?").join(",");

        // 插入或忽略标签
        const labelInsertStatements: D1PreparedStatement[] = [];
        for (const name of normalized) {
          const labelId = nanoid();
          labelInsertStatements.push(
            this.db
              .prepare(
                `
            INSERT OR IGNORE INTO labels (id, user_id, name, created_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
          `,
              )
              .bind(labelId, userId, name),
          );
        }
        await this.db.batch(labelInsertStatements);

        // 查询实际 label_id
        const actualLabels = await this.db
          .prepare(
            `
        SELECT id, name 
        FROM labels 
        WHERE user_id = ? AND name IN (${placeholders})
      `,
          )
          .bind(userId, ...normalized)
          .all<{ id: string; name: string }>();

        const labelMap = new Map(
          actualLabels.results.map((l) => [l.name, l.id]),
        );

        // 建立 memo_labels 关系
        const memoLabelStatements: D1PreparedStatement[] = [];
        for (const name of normalized) {
          const labelId = labelMap.get(name)!;
          memoLabelStatements.push(
            this.db
              .prepare(
                `
            INSERT INTO memo_labels (memo_id, label_id)
            VALUES (?, ?)
          `,
              )
              .bind(memoId, labelId),
          );
        }
        await this.db.batch(memoLabelStatements);
      }

      // 删除未使用标签
      await this.db
        .prepare(
          `
      DELETE FROM labels
      WHERE user_id = ?
      AND NOT EXISTS (
        SELECT 1
        FROM memo_labels ml
        WHERE ml.label_id = labels.id
      )
    `,
        )
        .bind(userId)
        .run();
    } else if (statements.length > 0) {
      // 如果只有内容或可见性更新，执行语句
      await this.db.batch(statements);
    }
    const memo = await this.db
      .prepare(
        `
        SELECT 
          m.id,
          m.content,
          m.is_public,
          m.created_at,
          m.updated_at,
          u.username
        FROM memos m
        JOIN users u ON m.user_id = u.id
        WHERE m.id = ?
      `,
      )
      .bind(memoId)
      .first<{
        id: string;
        content: string;
        is_public: 0 | 1;
        created_at: string;
        updated_at: string;
        username: string;
      }>();

    if (!memo) return null;

    const memoLabels = await this.db
      .prepare(
        `
        SELECT l.name
        FROM labels l
        JOIN memo_labels ml ON l.id = ml.label_id
        WHERE ml.memo_id = ?
      `,
      )
      .bind(memoId)
      .all<{ name: string }>();

    return {
      id: memo.id,
      content: memo.content,
      username: memo.username,
      isPublic: memo.is_public,
      createdAt: memo.created_at,
      updatedAt: memo.updated_at,
      labels: memoLabels.results.map((l) => l.name),
    };
  }

  async deleteMemoById(id: string): Promise<void> {
    await this.db
      .prepare(
        "UPDATE memos SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP, deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND is_deleted = 0",
      )
      .bind(id)
      .run()
      .then(() => {});
  }

  async deleteMemosByIds(ids: string[]): Promise<void> {
    const placeholders = ids.map(() => "?").join(",");
    await this.db
      .prepare(
        `UPDATE memos SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP, deleted_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders}) AND is_deleted = 0`,
      )
      .bind(...ids)
      .run()
      .then(() => {});
  }

  async getUserMemosHeatmap(
    userId: string,
    startDate: string,
    endDate: string,
    offsetMs: number
  ) {
    const sql = `
      SELECT created_at
      FROM memos
      WHERE user_id = ?
        AND is_deleted = 0
        AND is_public = 1
        AND created_at >= ?
        AND created_at < ?
      ORDER BY created_at ASC
    `;

    const result = await this.db
      .prepare(sql)
      .bind(userId, startDate, endDate)
      .all<{ created_at: string }>();

    const countsMap = new Map<string, number>();

    (result.results ?? []).forEach((row) => {
      const utcDate = new Date(row.created_at); // 数据库 UTC 时间
      const localDate = new Date(utcDate.getTime() + offsetMs);

      // 转成 YYYY-MM-DD
      const y = localDate.getFullYear();
      const m = String(localDate.getMonth() + 1).padStart(2, "0");
      const d = String(localDate.getDate()).padStart(2, "0");
      const dateKey = `${y}-${m}-${d}`;

      countsMap.set(dateKey, (countsMap.get(dateKey) ?? 0) + 1);
    });

    // 转成数组并按日期升序
    return Array.from(countsMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  }
}
