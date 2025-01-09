import { Session, User } from "better-auth/types";
import { auth } from "../libs/auth";
import Elysia, { Context } from "elysia";


async function getSession(c: Context) {
  console.log("Derive");
  const session = await auth.api.getSession({ headers: c.request.headers });

  if (!session) {
    return {};
  }

  return {
    user: session.user,
    session: session.session
  };
}

export const session = new Elysia()
  .derive({ as: "global" }, getSession);


export function checkAuth(c: Context) {
  console.log("Context: ", c);

  if (c.request.url.split("/").slice(3).join("/").startsWith("api/auth")) {
    return;
  }

  if (!c.user) {
    c.set.status = 401;
    return { success: 'error', message: "Unauthorized Access: Token is missing" };
  }
};