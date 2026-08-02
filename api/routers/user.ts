import { z } from "zod";
import { createRouter, publicProcedure, adminProcedure } from "../middleware.js";
import { getDb } from "../queries/connection.js";
import { users } from "../db/schema.js";
import { eq, like, desc, sql, and } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const userRouter = createRouter({
  list: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        page: z.number().default(1),
        pageSize: z.number().default(10),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const filters = [];
      if (input?.search) {
        filters.push(like(users.username, `%${input.search}%`));
      }

      const where = filters.length > 0 ? and(...filters) : undefined;
      const page = input?.page || 1;
      const pageSize = input?.pageSize || 10;
      const offset = (page - 1) * pageSize;

      const [list, countResult] = await Promise.all([
        db.select().from(users).where(where).orderBy(desc(users.createdAt)).limit(pageSize).offset(offset),
        db.select({ count: sql<number>`count(*)` }).from(users).where(where),
      ]);

      return {
        list,
        total: countResult[0]?.count || 0,
      };
    }),

  create: adminProcedure
    .input(
      z.object({
        username: z.string().min(1),
        password: z.string().min(1),
        realName: z.string().min(1),
        role: z.enum(["admin", "user", "visitor"]).default("user"),
        department: z.string().nullable().optional(),
        status: z.enum(["active", "disabled"]).default("active"),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const hashedPassword = await bcrypt.hash(input.password, 10);
      const result = await db.insert(users).values({
        username: input.username,
        password: hashedPassword,
        realName: input.realName,
        role: input.role,
        department: input.department || null,
        status: input.status,
      });
      return result;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        realName: z.string().optional(),
        role: z.enum(["admin", "user", "visitor"]).optional(),
        department: z.string().nullable().optional(),
        status: z.enum(["active", "disabled"]).optional(),
        password: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      const updateData: Record<string, unknown> = { ...data };
      if (data.password) {
        updateData.password = await bcrypt.hash(data.password, 10);
      }
      await db.update(users).set(updateData).where(eq(users.id, id));
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(users).where(eq(users.id, input.id));
      return { success: true };
    }),
});
