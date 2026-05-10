import { Hono } from "hono";

import type { AppBindings, AppVariables } from "../../types/hono";

import meApp from "./me";
import registerApp from "./register";
import loginApp from "./login";
import logoutApp from "./logout";
import deleteApp from "./delete";
import passwordApp from "./password";

const authApp = new Hono<{
  Bindings: AppBindings;
  Variables: AppVariables;
}>();

authApp.route("/", meApp);
authApp.route("/", registerApp);
authApp.route("/", loginApp);
authApp.route("/", logoutApp);
authApp.route("/", deleteApp);
authApp.route("/", passwordApp);

export default authApp;