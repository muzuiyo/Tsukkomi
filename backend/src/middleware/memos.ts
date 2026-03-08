import type { Context, Next } from "hono";
import type { AppBindings, AppVariables } from "../types/hono";
import { MemosService } from "../services/memos";

type AppContext = Context<{
  Bindings: AppBindings;
  Variables: AppVariables;
}>;

// requireMemoOwner 中间件, 验证用户是否为 Memo 的所有者, 仅用于删除和更新 Memo
export async function requireMemoOwner(c: AppContext, next: Next) {
  const user = c.get("user");
  const memoId = c.req.param("id");

  if (!memoId) {
    return c.json({ success: false, error: "Memo ID is required", code: 400 }, 400);
  }

  if(typeof memoId !== "string") {
    return c.json({ success: false, error: "Invalid Memo ID", code: 400 }, 400);
  }

  const memosService = new MemosService(c.env.MEMO_DB);
  const memo = await memosService.getMemoById(memoId);

  if (!memo || memo.is_deleted === 1) {
    return c.json({ success: false, error: "Memo not found", code: 404 }, 404);
  }

  const isOwner = memo.user_id === user.id;
  const isAdmin = user.role === "admin";

  if (!isOwner && !isAdmin) {
    return c.json({ success: false, error: "Forbidden", code: 403 }, 403);
  }

  return await next();
}
