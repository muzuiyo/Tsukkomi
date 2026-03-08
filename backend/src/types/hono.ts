import type { Env } from "./env";
import type { AuthUser } from "./user";

export type AppBindings = Env;

export interface AppVariables {
  user: AuthUser;
}