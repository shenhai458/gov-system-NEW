import { z } from "zod";
import { createRouter, publicProcedure, adminProcedure } from "../middleware";
import { getDb } from "../queries/connection";
import { dashboardWidgets, projects } from "@db/schema";
import { eq, desc } from "drizzle-orm";
import { computeProjectStats } from "../lib/stats";

export const dashboardRouter = createRouter({
  widgets: createRouter({
    list: publicProcedure.query(async () => {
      const db = getDb();
      return db.select().from(dashboardWidgets).orderBy(dashboardWidgets.order);
    }),

    create: adminProcedure
      .input(
        z.object({
          title: z.string().min(1),
          type: z.enum(["total", "inProgress", "completed", "failed", "pending", "totalAmount", "successRate", "activeProjects"]),
          icon: z.string().default("FolderOpen"),
          color: z.string().default("blue"),
          order: z.number().default(0),
          isVisible: z.boolean().default(true),
        })
      )
      .mutation(async ({ input }) => {
        const db = getDb();
        const result = await db.insert(dashboardWidgets).values(input);
        return result;
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().min(1).optional(),
          type: z.enum(["total", "inProgress", "completed", "failed", "pending", "totalAmount", "successRate", "activeProjects"]).optional(),
          icon: z.string().optional(),
          color: z.string().optional(),
          order: z.number().optional(),
          isVisible: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = getDb();
        const { id, ...data } = input;
        await db.update(dashboardWidgets).set(data).where(eq(dashboardWidgets.id, id));
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = getDb();
        await db.delete(dashboardWidgets).where(eq(dashboardWidgets.id, input.id));
        return { success: true };
      }),
  }),

  stats: publicProcedure.query(async () => {
    const db = getDb();
    const allProjects = await db.select().from(projects);
    return computeProjectStats(allProjects);
  }),

  recentProjects: publicProcedure.query(async () => {
    const db = getDb();
    return db.select().from(projects).orderBy(desc(projects.createdAt)).limit(5);
  }),

  expiringProjects: publicProcedure.query(async () => {
    const db = getDb();
    const now = new Date();
    const allProjects = await db.select().from(projects);
    return allProjects
      .filter((p) => p.deadline && new Date(p.deadline) > now)
      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
      .slice(0, 5);
  }),
});
