import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  isLoggedIn: boolean;
}

const sessionPassword = process.env.NODE_ENV !== "production"
  ? (process.env.SESSION_SECRET || "a-very-long-secret-at-least-32-chars-for-dev")
  : process.env.SESSION_SECRET;

if (!sessionPassword) {
  throw new Error("SESSION_SECRET environment variable is required in production");
}

export const sessionOptions: SessionOptions = {
  password: sessionPassword,
  cookieName: "erbao-blog-session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    const session = await getSession();
    return session.isLoggedIn === true;
  } catch {
    return false;
  }
}
