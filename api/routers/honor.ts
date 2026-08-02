import { z } from "zod";
import { createRouter, publicProcedure, adminProcedure } from "../middleware.js";
import { getDb } from "../queries/connection.js";
import { honors, honorRenewals } from "../db/schema.js";
import { eq, desc, and, like } from "drizzle-orm";

function computeHonorStatus(expiryDate: Date | null): "valid" | "expiring" | "expired" {
  if (!expiryDate) return "valid";
  const now = new Date();
  const daysLeft = Math.ceil((new Date(expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return "expired";
  if (daysLeft <= 90) return "expiring";
  return "valid";
}

export const honorRouter = createRouter({
  list: publicProcedure
    .input(
      z.object({
        status: z.enum(["valid", "expiring", "expired", "all"]).default("all"),
        type: z.string().optional(),
        search: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const filters = [];
      if (input?.status && input.status !== "all") {
        filters.push(eq(honors.status, input.status));
      }
      if (input?.type && input.type !== "all") {
        filters.push(eq(honors.type, input.type as "honor" | "qualification" | "certification" | "other"));
      }
      if (input?.search) {
        filters.push(like(honors.title, `%${input.search}%`));
      }
      const where = filters.length > 0 ? and(...filters) : undefined;

      const list = await db.select().from(honors).where(where).orderBy(desc(honors.createdAt));

      // Recompute statuses
      const updatedList = list.map((h) => ({
        ...h,
        status: computeHonorStatus(h.expiryDate),
      }));

      return updatedList;
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db.select().from(honors).where(eq(honors.id, input.id)).limit(1);
      if (result.length === 0) return null;
      return { ...result[0], status: computeHonorStatus(result[0].expiryDate) };
    }),

  create: adminProcedure
    .input(
      z.object({
        title: z.string().min(1),
        type: z.enum(["honor", "qualification", "certification", "other"]).default("honor"),
        level: z.enum(["national", "provincial", "city", "district", "other"]).default("other"),
        issuingAuthority: z.string().nullable().optional(),
        issueDate: z.string().nullable().optional(),
        expiryDate: z.string().nullable().optional(),
        reviewCycleMonths: z.number().nullable().optional(),
        attachmentUrl: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
        projectId: z.number().nullable().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const expiryDate = input.expiryDate ? new Date(input.expiryDate) : null;
      const result = await db.insert(honors).values({
        title: input.title,
        type: input.type,
        level: input.level,
        issuingAuthority: input.issuingAuthority || null,
        issueDate: input.issueDate ? new Date(input.issueDate) : null,
        expiryDate,
        reviewCycleMonths: input.reviewCycleMonths ?? null,
        status: computeHonorStatus(expiryDate),
        attachmentUrl: input.attachmentUrl || null,
        notes: input.notes || null,
        projectId: input.projectId ?? null,
      });
      return result;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        type: z.enum(["honor", "qualification", "certification", "other"]).optional(),
        level: z.enum(["national", "provincial", "city", "district", "other"]).optional(),
        issuingAuthority: z.string().nullable().optional(),
        issueDate: z.string().nullable().optional(),
        expiryDate: z.string().nullable().optional(),
        reviewCycleMonths: z.number().nullable().optional(),
        attachmentUrl: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
        projectId: z.number().nullable().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      const updateData: Record<string, unknown> = { ...data };
      if (data.issueDate) updateData.issueDate = new Date(data.issueDate);
      if (data.expiryDate !== undefined) {
        updateData.expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;
        updateData.status = computeHonorStatus(updateData.expiryDate as Date | null);
      }
      updateData.updatedAt = new Date();
      await db.update(honors).set(updateData).where(eq(honors.id, id));
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(honorRenewals).where(eq(honorRenewals.honorId, input.id));
      await db.delete(honors).where(eq(honors.id, input.id));
      return { success: true };
    }),

  stats: publicProcedure.query(async () => {
    const db = getDb();
    const allHonors = await db.select().from(honors);
    const total = allHonors.length;
    const valid = allHonors.filter((h) => computeHonorStatus(h.expiryDate) === "valid").length;
    const expiring = allHonors.filter((h) => computeHonorStatus(h.expiryDate) === "expiring").length;
    const expired = allHonors.filter((h) => computeHonorStatus(h.expiryDate) === "expired").length;
    return { total, valid, expiring, expired };
  }),

  renewals: createRouter({
    list: publicProcedure
      .input(z.object({ honorId: z.number() }))
      .query(async ({ input }) => {
        const db = getDb();
        return db.select().from(honorRenewals).where(eq(honorRenewals.honorId, input.honorId)).orderBy(desc(honorRenewals.plannedDate));
      }),

    create: adminProcedure
      .input(
        z.object({
          honorId: z.number(),
          plannedDate: z.string().nullable().optional(),
          actualDate: z.string().nullable().optional(),
          status: z.enum(["planned", "in_progress", "completed", "overdue"]).default("planned"),
          cost: z.string().nullable().optional(),
          notes: z.string().nullable().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = getDb();
        const result = await db.insert(honorRenewals).values({
          honorId: input.honorId,
          plannedDate: input.plannedDate ? new Date(input.plannedDate) : null,
          actualDate: input.actualDate ? new Date(input.actualDate) : null,
          status: input.status,
          cost: input.cost || null,
          notes: input.notes || null,
        });
        return result;
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          plannedDate: z.string().nullable().optional(),
          actualDate: z.string().nullable().optional(),
          status: z.enum(["planned", "in_progress", "completed", "overdue"]).optional(),
          cost: z.string().nullable().optional(),
          notes: z.string().nullable().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = getDb();
        const { id, ...data } = input;
        const updateData: Record<string, unknown> = { ...data };
        if (data.plannedDate !== undefined) updateData.plannedDate = data.plannedDate ? new Date(data.plannedDate) : null;
        if (data.actualDate !== undefined) updateData.actualDate = data.actualDate ? new Date(data.actualDate) : null;
        await db.update(honorRenewals).set(updateData).where(eq(honorRenewals.id, id));
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = getDb();
        await db.delete(honorRenewals).where(eq(honorRenewals.id, input.id));
        return { success: true };
      }),
  }),
});
