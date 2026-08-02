import { z } from "zod";
import { createRouter, publicProcedure, adminProcedure } from "../middleware";
import { getDb } from "../queries/connection";
import { projects, projectFields } from "@db/schema";
import { eq, like, desc, sql, and } from "drizzle-orm";
import { computeProjectStats } from "../lib/stats";

export const projectRouter = createRouter({
  list: publicProcedure
    .input(
      z.object({
        status: z.string().optional(),
        department: z.string().optional(),
        applicant: z.string().optional(),
        warning: z.string().optional(),
        search: z.string().optional(),
        page: z.number().default(1),
        pageSize: z.number().default(10),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const filters = [];
      if (input?.status && input.status !== "all") {
        filters.push(eq(projects.status, input.status as "ok" | "failed" | "in_progress" | "pending"));
      }
      if (input?.department && input.department !== "all") {
        filters.push(eq(projects.department, input.department));
      }
      if (input?.applicant && input.applicant !== "all") {
        filters.push(eq(projects.applicant, input.applicant));
      }
      if (input?.warning && input.warning !== "all") {
        filters.push(eq(projects.warning, input.warning as "normal" | "7days" | "15days" | "30days"));
      }
      if (input?.search) {
        filters.push(like(projects.name, `%${input.search}%`));
      }

      const where = filters.length > 0 ? and(...filters) : undefined;
      const page = input?.page || 1;
      const pageSize = input?.pageSize || 10;
      const offset = (page - 1) * pageSize;

      const [list, countResult] = await Promise.all([
        db.select().from(projects).where(where).orderBy(desc(projects.createdAt)).limit(pageSize).offset(offset),
        db.select({ count: sql<number>`count(*)` }).from(projects).where(where),
      ]);

      const allProjects = await db.select().from(projects);
      const departments = [...new Set(allProjects.map((p) => p.department).filter(Boolean))];
      const applicants = [...new Set(allProjects.map((p) => p.applicant).filter(Boolean))];

      return {
        list,
        total: countResult[0]?.count || 0,
        departments,
        applicants,
      };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db.select().from(projects).where(eq(projects.id, input.id)).limit(1);
      return result[0] || null;
    }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        deadline: z.string().nullable().optional(),
        department: z.string().nullable().optional(),
        applyAmount: z.string().nullable().optional(),
        receiveAmount: z.string().nullable().optional(),
        status: z.enum(["ok", "failed", "in_progress", "pending"]).default("pending"),
        applicant: z.string().nullable().optional(),
        applyDate: z.string().nullable().optional(),
        receiveDate: z.string().nullable().optional(),
        noticeUrl: z.string().nullable().optional(),
        publicUrl: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
        warning: z.enum(["normal", "7days", "15days", "30days"]).default("normal"),
        customData: z.record(z.string(), z.any()).default({}),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(projects).values({
        name: input.name,
        deadline: input.deadline ? new Date(input.deadline) : null,
        department: input.department || null,
        applyAmount: input.applyAmount || null,
        receiveAmount: input.receiveAmount || null,
        status: input.status,
        applicant: input.applicant || null,
        applyDate: input.applyDate ? new Date(input.applyDate) : null,
        receiveDate: input.receiveDate ? new Date(input.receiveDate) : null,
        noticeUrl: input.noticeUrl || null,
        publicUrl: input.publicUrl || null,
        notes: input.notes || null,
        warning: input.warning,
        customData: input.customData,
      });
      return result;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1),
        deadline: z.string().nullable().optional(),
        department: z.string().nullable().optional(),
        applyAmount: z.string().nullable().optional(),
        receiveAmount: z.string().nullable().optional(),
        status: z.enum(["ok", "failed", "in_progress", "pending"]),
        applicant: z.string().nullable().optional(),
        applyDate: z.string().nullable().optional(),
        receiveDate: z.string().nullable().optional(),
        noticeUrl: z.string().nullable().optional(),
        publicUrl: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
        warning: z.enum(["normal", "7days", "15days", "30days"]).default("normal"),
        customData: z.record(z.string(), z.any()).default({}),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(projects).set({
        ...data,
        deadline: data.deadline ? new Date(data.deadline) : null,
        applyDate: data.applyDate ? new Date(data.applyDate) : null,
        receiveDate: data.receiveDate ? new Date(data.receiveDate) : null,
        updatedAt: new Date(),
      }).where(eq(projects.id, id));
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(projects).where(eq(projects.id, input.id));
      return { success: true };
    }),

  stats: publicProcedure.query(async () => {
    const db = getDb();
    const allProjects = await db.select().from(projects);
    return computeProjectStats(allProjects);
  }),

  // Custom field management
  fields: createRouter({
    list: publicProcedure.query(async () => {
      const db = getDb();
      return db.select().from(projectFields).orderBy(projectFields.order);
    }),

    create: adminProcedure
      .input(
        z.object({
          key: z.string().min(1),
          label: z.string().min(1),
          fieldType: z.enum(["text", "number", "date", "select", "textarea"]).default("text"),
          options: z.array(z.string()).default([]),
          required: z.boolean().default(false),
          order: z.number().default(0),
          isVisible: z.boolean().default(true),
        })
      )
      .mutation(async ({ input }) => {
        const db = getDb();
        const result = await db.insert(projectFields).values({
          key: input.key,
          label: input.label,
          fieldType: input.fieldType,
          options: input.options,
          required: input.required,
          order: input.order,
          isVisible: input.isVisible,
        });
        return result;
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          label: z.string().min(1).optional(),
          fieldType: z.enum(["text", "number", "date", "select", "textarea"]).optional(),
          options: z.array(z.string()).optional(),
          required: z.boolean().optional(),
          order: z.number().optional(),
          isVisible: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = getDb();
        const { id, ...data } = input;
        await db.update(projectFields).set(data).where(eq(projectFields.id, id));
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = getDb();
        await db.delete(projectFields).where(eq(projectFields.id, input.id));
        return { success: true };
      }),
  }),
});
