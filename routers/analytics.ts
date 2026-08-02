import { z } from "zod";
import { createRouter, publicProcedure, adminProcedure } from "../middleware";
import { getDb } from "../queries/connection";
import { projects, analyticsCards } from "@db/schema";
import { eq } from "drizzle-orm";
import { computeProjectStats } from "../lib/stats";

export const analyticsRouter = createRouter({
  overview: publicProcedure.query(async () => {
    const db = getDb();
    const allProjects = await db.select().from(projects);
    const stats = computeProjectStats(allProjects);
    return {
      totalApplyAmount: stats.totalApply,
      totalReceiveAmount: stats.totalReceive,
      successRate: stats.successRate,
      activeProjects: stats.activeProjects,
      totalProjects: stats.total,
      completedProjects: stats.completed,
      failedProjects: stats.failed,
    };
  }),

  monthlyTrend: publicProcedure.query(async () => {
    const db = getDb();
    const allProjects = await db.select().from(projects);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

    return months.map((month, idx) => {
      const monthProjects = allProjects.filter((p) => {
        if (!p.applyDate) return false;
        const d = new Date(p.applyDate);
        return d.getMonth() + 1 === month;
      });
      const successProjects = monthProjects.filter((p) => p.status === "ok");
      return {
        month: monthNames[idx],
        applyCount: monthProjects.length,
        successCount: successProjects.length,
      };
    });
  }),

  departmentDistribution: publicProcedure.query(async () => {
    const db = getDb();
    const allProjects = await db.select().from(projects);
    const deptMap: Record<string, number> = {};
    allProjects.forEach((p) => {
      const dept = p.department || "未知";
      deptMap[dept] = (deptMap[dept] || 0) + 1;
    });
    return Object.entries(deptMap).map(([name, value]) => ({ name, value }));
  }),

  statusAnalysis: publicProcedure.query(async () => {
    const db = getDb();
    const allProjects = await db.select().from(projects);
    const statusMap: Record<string, number> = {};
    allProjects.forEach((p) => {
      const label = p.status === "ok" ? "已通过" : p.status === "failed" ? "未通过" : p.status === "in_progress" ? "进行中" : "待审核";
      statusMap[label] = (statusMap[label] || 0) + 1;
    });
    return Object.entries(statusMap).map(([name, value]) => ({ name, value }));
  }),

  applicantPerformance: publicProcedure.query(async () => {
    const db = getDb();
    const allProjects = await db.select().from(projects);
    const appMap: Record<string, { count: number; success: number }> = {};
    allProjects.forEach((p) => {
      const app = p.applicant || "未知";
      if (!appMap[app]) appMap[app] = { count: 0, success: 0 };
      appMap[app].count++;
      if (p.status === "ok") appMap[app].success++;
    });
    return Object.entries(appMap).map(([name, data]) => ({
      name,
      count: data.count,
      success: data.success,
    }));
  }),

  monthlyAmount: publicProcedure.query(async () => {
    const db = getDb();
    const allProjects = await db.select().from(projects);
    const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

    return Array.from({ length: 12 }, (_, i) => i + 1).map((month, idx) => {
      const monthProjects = allProjects.filter((p) => {
        if (!p.applyDate) return false;
        const d = new Date(p.applyDate);
        return d.getMonth() + 1 === month;
      });
      let amount = 0;
      monthProjects.forEach((p) => {
        if (p.applyAmount && !isNaN(parseFloat(p.applyAmount))) {
          amount += parseFloat(p.applyAmount);
        }
      });
      return { month: monthNames[idx], amount };
    });
  }),

  departmentSuccess: publicProcedure.query(async () => {
    const db = getDb();
    const allProjects = await db.select().from(projects);
    const deptMap: Record<string, { total: number; success: number }> = {};
    allProjects.forEach((p) => {
      const dept = p.department || "未知";
      if (!deptMap[dept]) deptMap[dept] = { total: 0, success: 0 };
      deptMap[dept].total++;
      if (p.status === "ok") deptMap[dept].success++;
    });
    return Object.entries(deptMap).map(([name, data]) => ({
      name,
      rate: data.total > 0 ? Math.round((data.success / data.total) * 100) : 0,
    }));
  }),

  // Analytics cards management
  cards: createRouter({
    list: publicProcedure.query(async () => {
      const db = getDb();
      return db.select().from(analyticsCards).orderBy(analyticsCards.order);
    }),

    create: adminProcedure
      .input(
        z.object({
          title: z.string().min(1),
          type: z.enum(["total", "inProgress", "completed", "failed", "pending", "totalAmount", "successRate", "activeProjects"]),
          icon: z.string().default("TrendingUp"),
          color: z.string().default("indigo"),
          order: z.number().default(0),
          isVisible: z.boolean().default(true),
        })
      )
      .mutation(async ({ input }) => {
        const db = getDb();
        const result = await db.insert(analyticsCards).values(input);
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
        await db.update(analyticsCards).set(data).where(eq(analyticsCards.id, id));
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = getDb();
        await db.delete(analyticsCards).where(eq(analyticsCards.id, input.id));
        return { success: true };
      }),
  }),
});
