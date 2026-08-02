import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { verifyToken } from "./lib/auth";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: { id: number; username: string; role: string };
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const token = opts.req.headers.get("authorization")?.replace("Bearer ", "");
  let user;
  if (token) {
    try {
      user = await verifyToken(token);
    } catch {
      user = undefined;
    }
  }
  return { req: opts.req, resHeaders: opts.resHeaders, user };
}
