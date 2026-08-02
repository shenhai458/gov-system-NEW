import { z } from "zod";
import { createRouter, publicProcedure, adminProcedure } from "../middleware";
import { getDb } from "../queries/connection";
import { settings } from "@db/schema";
import { eq } from "drizzle-orm";

export const settingRouter = createRouter({
  get: publicProcedure.query(async () => {
    const db = getDb();
    const result = await db.select().from(settings).limit(1);
    if (result.length === 0) {
      await db.insert(settings).values({});
      const newSettings = await db.select().from(settings).limit(1);
      return newSettings[0];
    }
    return result[0];
  }),

  update: adminProcedure
    .input(
      z.object({
        systemName: z.string().optional(),
        timezone: z.string().optional(),
        emailNotification: z.enum(["on", "off"]).optional(),
        expiryReminder: z.enum(["on", "off"]).optional(),
        reminderDays: z.number().optional(),
        passwordComplexity: z.enum(["on", "off"]).optional(),
        loginLock: z.enum(["on", "off"]).optional(),
        sessionTimeout: z.number().optional(),
        autoBackup: z.enum(["on", "off"]).optional(),
        backupFrequency: z.string().optional(),
        backupRetention: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const existing = await db.select().from(settings).limit(1);
      if (existing.length === 0) {
        await db.insert(settings).values(input);
      } else {
        await db.update(settings).set(input).where(eq(settings.id, existing[0].id));
      }
      return { success: true };
    }),
});
