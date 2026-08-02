import { z } from "zod";
import { createRouter, publicProcedure } from "../middleware.js";
import { getDb } from "../queries/connection.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createToken } from "../lib/auth.js";
import { TRPCError } from "@trpc/server";

export const authRouter = createRouter({
  login: publicProcedure
    .input(
      z.object({
        username: z.string().min(1),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const user = await db.select().from(users).where(eq(users.username, input.username)).limit(1);
      if (user.length === 0) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "用户名或密码错误" });
      }
      const valid = await bcrypt.compare(input.password, user[0].password);
      if (!valid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "用户名或密码错误" });
      }
      if (user[0].status === "disabled") {
        throw new TRPCError({ code: "FORBIDDEN", message: "账户已被禁用" });
      }
      await db.update(users).set({ lastLogin: new Date() }).where(eq(users.id, user[0].id));
      const token = await createToken({
        id: user[0].id,
        username: user[0].username,
        role: user[0].role,
      });
      return {
        token,
        user: {
          id: user[0].id,
          username: user[0].username,
          realName: user[0].realName,
          role: user[0].role,
          department: user[0].department,
        },
      };
    }),

  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return null;
    const db = getDb();
    const user = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
    if (user.length === 0) return null;
    return {
      id: user[0].id,
      username: user[0].username,
      realName: user[0].realName,
      role: user[0].role,
      department: user[0].department,
      status: user[0].status,
    };
  }),
});
