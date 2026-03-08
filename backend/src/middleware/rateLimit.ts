import type { Context, Next } from "hono";

interface RateLimitOptions {
  /** 时间窗口，毫秒 */
  windowMs?: number;
  /** 窗口内最大请求次数 */
  max?: number;
  /** 生成限流 key 的函数（默认使用客户端 IP + UA） */
  keyGenerator?: (c: Context<any>) => string;
}

/**
 * Hono KV 限流中间件
 */
export function rateLimit(options: RateLimitOptions = {}) {
  return async (c: Context<any>, next: Next) => {
    const windowMs = options.windowMs ?? 60_000; // 默认 1 分钟
    const max = !c.env.IS_PRODUCTION
      ? 1_000_000
      : options.max ?? Number(c.env?.RATE_LIMIT_MAX ?? 200);

    const kv = c.env.MEMO_KV;

    // 生成 key
    const key = options.keyGenerator
      ? options.keyGenerator(c)
      : `${c.req.header("CF-Connecting-IP") || "unknown"}:${
          c.req.header("User-Agent") || ""
        }`;

    const nowMs = Date.now(); // 当前时间毫秒
    const nowSec = Math.floor(nowMs / 1000); // 当前时间秒

    let data = (await kv.get(key, "json")) as { count: number; resetAt: number } | null;

    if (!data || nowMs > data.resetAt) {
      data = { count: 0, resetAt: nowMs + windowMs }; // 新窗口
    }

    data.count += 1;

    // 转秒并确保 KV expiration 至少比现在晚 60 秒
    let expirationSec = Math.floor(data.resetAt / 1000);
    if (expirationSec - nowSec < 60) {
      expirationSec = nowSec + 60;
    }

    await kv.put(key, JSON.stringify(data), { expiration: expirationSec });

    // 超过限制
    if (data.count > max) {
      return c.json(
        { success: false, error: "Too many requests", code: 429 },
        429
      );
    }

    // 响应头
    c.header("X-RateLimit-Limit", max.toString());
    c.header("X-RateLimit-Remaining", (max - data.count).toString());
    c.header("X-RateLimit-Reset", expirationSec.toString());

    return next();
  };
}