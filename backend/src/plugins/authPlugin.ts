import Elysia, { Context } from "elysia";
import { auth } from "../libs/auth";
import { getConnectedAccounts } from '../data/user';


export default new Elysia()
  .resolve(async ({ request }) => {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return {};
    }
    let accounts = { rows: [] };
    try {
      accounts = await getConnectedAccounts(session.user.id) as any;
    }
    catch (err) {
      console.error("Failed to fetch connected accounts from the database: ", err);
    }

    return {
      user: session.user,
      session: session.session,
      connectedAccounts: accounts.rows
    };
  })
  .all("/auth/*", async ({ request, error }) => {
    console.log("Auth Controller");
    const BETTER_AUTH_ACCEPT_METHODS = ["POST", "GET"];
    if (BETTER_AUTH_ACCEPT_METHODS.includes(request.method)) {
      const res = await auth.handler(request);
      console.log("Auth Response: ", request.url, res);
      return res;
    }
    else {
      return error(405);
    }
  })
  .onBeforeHandle(async ({ path, set, user, session }) => {
    console.log("API Auth check: ", path, user, session);
    if (path.startsWith("/api/swagger")) {
      return;
    }
    if (!user || !session) {
      set.status = 401;
      return { success: 'error', message: "Unauthorized Access: Token is missing" };
    }
  })
  .as("plugin");

