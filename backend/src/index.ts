import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import type { Env } from "./types/env";
import type { AuthUser } from "./types/user";

import authApp from "./routes/auth";
import memosApp from "./routes/memos";
import labelsApp from "./routes/labels";
import { rateLimit } from "./middleware/rateLimit";

// ==============================
// Hono 类型扩展
// ==============================

type AppBindings = Env;

type AppVariables = {
  user: AuthUser;
};

export const app = new Hono<{
  Bindings: AppBindings;
  Variables: AppVariables;
}>();

// ==============================
// 全局中间件
// ==============================

// 日志
app.use("*", logger());

// CORS
app.use(
  "*",
  cors({
    origin: ["http://127.0.0.1:3000", "http://localhost:3000", "https://tsukkomi.lain.today"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type"],
    credentials: true,
  }),
);

// 速率限制
app.use("*", rateLimit());
app.use("/auth/login", rateLimit({ max: 10 }));
app.use("/auth/register", rateLimit({ max: 10 }));
app.use("/auth/password/*", rateLimit({ max: 10 }));

// ==============================
// 运行检查
// ==============================
app.get("/", (c) => {
  return c.json({
    success: true,
    data: "API is running",
    code: 200,
  });
});

// 注册接口
app.route("/auth", authApp);
app.route("/memos", memosApp);
app.route("/labels", labelsApp);

// ==============================
// 404
// ==============================

app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: "Not Found",
      code: 404,
    },
    404
  );
});

// ==============================
// 全局错误捕获
// ==============================

app.onError((err, c) => {
  return c.json(
    {
      success: false,
      error: `Internal Server Error: ${err.message}`,
      code: 500,
    },
    500
  );
});

export default app;