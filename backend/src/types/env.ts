import { D1Database, KVNamespace } from "@cloudflare/workers-types";

export interface Env {
	MEMO_DB: D1Database;
  MEMO_KV: KVNamespace;
  ALLOW_REGISTER: boolean;
  IS_PRODUCTION: boolean;
  RATE_LIMIT_MAX: number;
  FRONT_URL: string;
  RESEND_API_KEY: string;
}
