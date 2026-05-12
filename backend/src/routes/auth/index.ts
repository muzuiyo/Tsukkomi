import { Hono } from "hono";

import type { Env } from "../../types/env";
import type { AuthUser } from "../../types/user";

import meApp from "./me";
import registerApp from "./register";
import LoginApp from "./login";
import logoutApp from "./logout";
import deleteApp from "./delete";
import passwordApp from "./password";

type AppBindings = Env;
type AppVariables = {
  user: AuthUser;
};

const authApp = new Hono<{
  Bindings: AppBindings;
  Variables: AppVariables;
}>();

authApp.route("/", meApp);
authApp.route("/", registerApp);
authApp.route("/", LoginApp);
authApp.route("/", logoutApp);
authApp.route("/", deleteApp);
authApp.route("/", passwordApp);

export default authApp;