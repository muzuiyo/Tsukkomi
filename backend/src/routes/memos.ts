import { Hono } from "hono";
import { optionalAuth, requireAuth } from "../middleware/auth";
import { requireMemoOwner } from "../middleware/memos";

import type { Env } from "../types/env";
import type { AuthUser, } from "../types/user";
import { MemosService } from "../services/memos";
import { LabelsService } from "../services/labels";
import { AuthMeService } from "../services/auth/me";
import { Memo } from "../types/memo";

type AppBindings = Env;
type AppVariables = {
  user: AuthUser;
};

const memosApp = new Hono<{
  Bindings: AppBindings;
  Variables: AppVariables;
}>();

// 新建 Memo
memosApp.post("/", requireAuth, async (c) => {
  const user = c.get("user");
  const body = await c.req.json<{
    content: string;
    isPublic?: number;
    labels?: string[];
  }>();

  const { content, isPublic, labels } = body;

  // 基础校验
  if(typeof content !== "string" || content.trim().length === 0) {
    return c.json(
      {
        success: false,
        error: "Content cannot be empty, and must be a string",
        code: 400,
      },
      400,
    );
  }

  if(isPublic !== undefined && isPublic !== 0 && isPublic !== 1) {
    return c.json(
      {
        success: false,
        error: "Invalid isPublic value",
        code: 400,
      },
      400,
    );
  }

  if (labels !== undefined) {
    if (!Array.isArray(labels) || !labels.every(item => { return typeof item === 'string' })) {
      return c.json({ success: false, error: "Labels must be an array of strings", code: 400 }, 400);
    }
  }

  const memosService = new MemosService(c.env.MEMO_DB);

  const memo = await memosService.createMemo(user.id, {
    content,
    isPublic: isPublic === 1 ? 1 : 0,
    labels,
  });
  
  return c.json(
    {
      success: true,
      data: memo,
      code: 201,
    },
    201,
  );
});

// 获取 Memo 列表
// Public Memo 列表不需要认证，Private Memo 列表需要认证
// 支持分页和搜索
memosApp.get("/", optionalAuth, async (c) => {
  const memosService = new MemosService(c.env.MEMO_DB);
  const meService = new AuthMeService(c.env.MEMO_DB);
  const user = c.get("user") as AuthUser | undefined;
  const page = Math.max(1, Number(c.req.query("page") ?? 1));
  const pageSize = Math.min(
    20,
    Math.max(1, Number(c.req.query("pageSize") ?? 20))
  );

  const keyword = c.req.query("keyword") || undefined;
  let visibility = (c.req.query("visibility") as "all" | "public" | "private") || "all";
  const searchUsername = c.req.query("username") || undefined;
  let searchUserId: string | undefined = undefined;

  if(searchUsername) {
    const searchUser = await meService.getUserByUsername(searchUsername);
    if(!searchUser || searchUser.is_deleted === 1) {
      return c.json({ success: false, error: "User not found", code: 404 }, 404);
    } else {
      searchUserId = searchUser.id;
    }
  }
  if(!user) {
    if(visibility === "private") {
      return c.json({ success: false, error: "Authentication required", code: 401 }, 401);
    }
  } else {
    if(visibility === "private" && user.role !== "admin" && searchUserId && user.id !== searchUserId) {
      return c.json({ success: false, error: "Authentication required", code: 401 }, 401);
    }
  }

  // label=work&label=life
  const labels = (c.req.queries("label") ?? []).map(l => l.trim()).filter(l => l.length > 0);;
  // ---------- 时间区间 ----------
  const startDate = c.req.query("startDate");
  const endDate = c.req.query("endDate");

  // 辅助函数：校验 UTC 时间格式
  function isValidUTC(dateStr: string): boolean {
    // 精确匹配 ISO 8601 UTC 时间格式：2025-01-01T10:00:00Z 或带毫秒 2025-01-01T10:00:00.000Z
    const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
    if (!regex.test(dateStr)) return false;

    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  }

  // 格式校验
  if (startDate && !isValidUTC(startDate)) {
    return c.json({
      success: false,
      error: "Invalid startDate format. Expected UTC ISO string (YYYY-MM-DDTHH:mm:ssZ).",
      code: 400
    }, 400);
  }

  if (endDate && !isValidUTC(endDate)) {
    return c.json({
      success: false,
      error: "Invalid endDate format. Expected UTC ISO string (YYYY-MM-DDTHH:mm:ssZ).",
      code: 400
    }, 400);
  }

  if (startDate && endDate && startDate >= endDate) {
    return c.json({
      success: false,
      error: "Invalid date range.",
      code: 400
    }, 400);
  }
  
  const memos = await memosService.getMemos({
    userId: searchUserId,
    page,
    pageSize,
    keyword,
    visibility,
    labels,
    startDate: startDate?.replace("T", " ").replace("Z", "") || undefined,
    endDate: endDate?.replace("T", " ").replace("Z", "") || undefined,
    currentUserId: user?.id || undefined
  });

  const memosInfo: Memo[] = [];
  for(const memo of memos) {
    memosInfo.push({
      id: memo.id,
      userId: memo.userId,
      username: memo.username,
      content: memo.content,
      isPublic: memo.isPublic,
      createdAt: memo.createdAt,
      labels: memo.labels,
    });
  }

  return c.json({
    success: true,
    data: memosInfo,
    code: 200,
  });
});

// 获取单个 Memo 详情
// Public Memo 列表不需要认证，Private Memo 列表需要认证
memosApp.get("/:id", optionalAuth, async (c) => {
  const memosService = new MemosService(c.env.MEMO_DB);
  const memoId = c.req.param("id");
  const user = c.get("user") as AuthUser | undefined;
  if(!memoId) {
    return c.json({ success: false, error: "Memo ID is required", code: 400 }, 400);
  }
  const memo = await memosService.getMemoById(memoId);
  if(!memo || memo.is_deleted === 1) {
    return c.json({ success: false, error: "Memo not found", code: 404 }, 404);
  }
  const labelsService = new LabelsService(c.env.MEMO_DB);
  const authMeService = new AuthMeService(c.env.MEMO_DB);
  const labels = await labelsService.getLabelsByMemoId(memoId) || [];
  const memoUsername = await authMeService.getUserByUserId(memo.user_id);
  const memoInfo: Memo = {
    id: memo.id,
    userId: memo.user_id,
    username: memoUsername?.username || "unknown user",
    content: memo.content,
    isPublic: memo.is_public,
    createdAt: memo.created_at,
    labels: labels.map((l) => l.name) as string[],
  }
  if(memo.is_public === 1) {
    return c.json({
      success: true,
      data: memoInfo,
      code: 200,
    });
  }
  if(!user) {
    return c.json({ success: false, error: "Authentication required", code: 401 }, 401);
  }
  if(memo.user_id !== user.id && user.role !== "admin") {
    return c.json({ success: false, error: "Forbidden", code: 403 }, 403);
  }
  return c.json({
    success: true,
    data: memoInfo,
    code: 200,
  });
});

// 更新 Memo
memosApp.patch("/:id", requireAuth, requireMemoOwner, async (c) => {
  const memosService = new MemosService(c.env.MEMO_DB);
  const memoId = c.req.param("id");
  const user = c.get("user");
  const body = await c.req.json();
  const { content, isPublic, labels } = body;
  // 基础校验
  if (typeof content !== "string" || content.trim().length === 0) {
    return c.json(
      {
        success: false,
        error: "Content cannot be empty, and must be a string",
        code: 400,
      },
      400,
    );
  }

  if (isPublic !== undefined && isPublic !== 0 && isPublic !== 1) {
    return c.json(
      {
        success: false,
        error: "Invalid isPublic value",
        code: 400,
      },
      400,
    );
  }

  if (labels !== undefined) {
    if (!Array.isArray(labels) || !labels.every(item => { return typeof item === 'string' })) {
      return c.json({ success: false, error: "Labels must be an array of strings", code: 400 }, 400);
    }
  }

  const updatedMemos = await memosService.updateMemoById(memoId, user.id, {
    content: content,
    isPublic: isPublic,
    labels: labels,
  });
  return c.json({
    success: true,
    data: updatedMemos,
    code: 200,
  });
});

// 删除 Memo
memosApp.delete("/:id", requireAuth, requireMemoOwner, async (c) => {
  const memosService = new MemosService(c.env.MEMO_DB);
  await memosService.deleteMemoById(c.req.param("id"));
  return c.json({
    success: true,
    message: "Memo deleted successfully",
    code: 200,
  });
});

memosApp.delete("/batch", requireAuth, async (c) => {
  const memosService = new MemosService(c.env.MEMO_DB);
  const body = await c.req.json();
  const ids: string[] = body.ids;
  if(ids.length === 0) {
    return c.json({
      success: false,
      error: "IDs array cannot be empty",
      code: 400,
    }, 400);
  }
  if(!Array.isArray(ids) || ids.some((id) => typeof id !== "string")) {
    return c.json({
      success: false,
      error: "Invalid IDs format",
      code: 400,
    }, 400);
  }
  await memosService.deleteMemosByIds(ids);
  return c.json({
    success: true,
    message: "Memos deleted successfully",
    code: 200,
  });
});

// 只统计 public memos 数据
memosApp.get("/graph/heatmap", async (c) => {
  const memosService = new MemosService(c.env.MEMO_DB);
  const meService = new AuthMeService(c.env.MEMO_DB);

  const username = c.req.query("username");
  const offsetTime = c.req.query("offsetTime");
  
  // ---------- offsetTime 校验 ----------
  let offsetMs: number = 0; // 默认偏移 0 毫秒
  if (offsetTime !== undefined) {
    const parsed = Number(offsetTime);
    if (!Number.isNaN(parsed)) {
      if (parsed >= -12 * 3600 * 1000 && parsed <= 14 * 3600 * 1000) {
        offsetMs = parsed;
      } else {
        return c.json({
          success: false,
          error: "offsetTime out of reasonable range (-12h to +14h in ms).",
          code: 400,
        }, 400);
      }
    } else {
      return c.json({
        success: false,
        error: "Invalid offsetTime format. Must be a number representing milliseconds.",
        code: 400,
      }, 400);
    }
  }

  if(!username) {
    return c.json({
      success: false,
      error: "Username, startDate and endDate are required",
      code: 400
    })
  }

  // ---------- 时间区间 ----------
  let startDate = c.req.query("startDate");
  let endDate = c.req.query("endDate");

  // 辅助函数：校验 UTC 时间格式
  function isValidUTC(dateStr: string): boolean {
    // 精确匹配 ISO 8601 UTC 时间格式：2025-01-01T10:00:00Z 或带毫秒 2025-01-01T10:00:00.000Z
    const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
    if (!regex.test(dateStr)) return false;

    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  }


  if (!startDate && !endDate) {
    const today = new Date();

    // 设置 end 为明天的 UTC 零点
    const end = new Date(Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate() + 1,
      0, 0, 0, 0
    ));

    // 设置 start 为 12 个月前的 UTC 零点
    const start = new Date(Date.UTC(
      end.getUTCFullYear(),
      end.getUTCMonth() - 12,
      end.getUTCDate(),
      0, 0, 0, 0
    ));

    // 转成 ISO 字符串
    startDate = start.toISOString();
    endDate = end.toISOString();
  }

  if(!startDate || !endDate) {
    return c.json(
      {
        success: false,
        error: "startDate and endDate must be provided together",
        code: 400,
      },
      400
    );
  }

  // 格式校验
  if (startDate && !isValidUTC(startDate)) {
    return c.json({
      success: false,
      error: "Invalid startDate format. Expected UTC ISO string (YYYY-MM-DDTHH:mm:ssZ).",
      code: 400
    }, 400);
  }

  if (endDate && !isValidUTC(endDate)) {
    return c.json({
      success: false,
      error: "Invalid endDate format. Expected UTC ISO string (YYYY-MM-DDTHH:mm:ssZ).",
      code: 400
    }, 400);
  }

  if (startDate && endDate && startDate >= endDate) {
    return c.json({
      success: false,
      error: "Invalid date range.",
      code: 400
    }, 400);
  }
  

  const user = await meService.getUserByUsername(username);
  if(!user || user.is_deleted === 1) {
    return c.json({
      success: false,
      error: "User not found",
      code: 404
    }, 404);
  }

  const heatmap = await memosService.getUserMemosHeatmap(
    user.id, 
    startDate?.replace("T", " ").replace("Z", ""), 
    endDate?.replace("T", " ").replace("Z", ""),
    offsetMs
  );
  return c.json({
    success: true,
    data: heatmap ?? [],
    startDate: startDate,
    endDate: endDate,
    code: 200
  }, 200);
});

export default memosApp;
