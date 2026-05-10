import type { Context } from "hono";
import type { Env } from "./env";
import type { AuthUser } from "./user";

export type AppBindings = Env;

export interface AppVariables {
  user: AuthUser;
}

export type AppContext = Context<{
  Bindings: AppBindings;
  Variables: AppVariables;
}>;