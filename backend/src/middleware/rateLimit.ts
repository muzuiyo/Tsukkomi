import type { Context, Next } from "hono";

interface RateLimitOptions {
  /* 时间窗口，毫秒 */
  windowMs?: number;
  /* 窗口内最大请求次数 */
  max?: number;
  /* 生成限流 key 的函数（默认使用客户端 IP/头） */
  keyGenerator?: (c: Context<any>) => string;
}

// kv 存储
export function rateLimit(options: RateLimitOptions = {}) {
  return async (c: Context<any>, next: Next) => {
    const windowMs = options.windowMs ?? 60000;
    const max = !c.env.IS_PRODUCTION ? 1000000 : (options.max ?? Number(c.env?.RATE_LIMIT_MAX ?? 200));
    const kv = c.env.MEMO_KV;

    const ip = c.req.header("CF-Connecting-IP") || c.req.header("x-real-ip") || "unknown";
    const ua = c.req.header("User-Agent") || "";
    const key = `${ip}:${ua}`;

    const nowMs = Date.now(); // 毫秒
    const nowSec = Math.floor(nowMs / 1000); // 秒

    let data = (await kv.get(key, "json")) as { count: number; resetAt: number } | null;

    if (!data || nowMs > data.resetAt) {
      data = { count: 0, resetAt: nowMs + windowMs }; // resetAt 仍然是毫秒
    }

    data.count += 1;

    // KV PUT 要求 expiration 单位秒，并且至少比现在晚 60 秒
    let expiration = Math.ceil(data.resetAt / 1000);
    expiration = Math.max(expiration, nowSec + 60);

    await kv.put(key, JSON.stringify(data), { expiration });

    if (data.count > max) {
      return c.json({ success: false, error: "Too many requests", code: 429 }, 429);
    }

    // 可选响应头
    c.header("X-RateLimit-Limit", max.toString());
    c.header("X-RateLimit-Remaining", (max - data.count).toString());
    c.header("X-RateLimit-Reset", Math.ceil(data.resetAt / 1000).toString());

    return next();
  };
}
