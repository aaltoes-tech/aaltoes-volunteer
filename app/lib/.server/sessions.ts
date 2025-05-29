import { createCookieSessionStorage } from "react-router";

interface SessionData {
  isAdminAuthenticated: boolean;
  userId: string;
}

interface SessionFlashData {
  error: string;
  success: string;
}

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage<SessionData, SessionFlashData>({
    cookie: {
      name: "__admin_session",
      httpOnly: true,
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
      sameSite: "lax",
      secrets: [
        process.env.SESSION_SECRET ?? "default-secret-change-in-production",
      ],
      secure: process.env.NODE_ENV === "production",
    },
  });

export { getSession, commitSession, destroySession };

export async function requireAdminAuth(request: Request) {
  const session = await getSession(request.headers.get("Cookie"));

  if (!session.get("isAdminAuthenticated")) {
    throw new Error("Unauthorized");
  }

  return session;
}

export async function getAdminUser(request: Request) {
  const session = await getSession(request.headers.get("Cookie"));
  return {
    isAuthenticated: session.get("isAdminAuthenticated") ?? false,
    userId: session.get("userId"),
  };
}
