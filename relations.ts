import { relations } from "drizzle-orm";
import { honors, honorRenewals, projects } from "./schema";

export const honorsRelations = relations(honors, ({ many, one }) => ({
  renewals: many(honorRenewals),
  project: one(projects, {
    fields: [honors.projectId],
    references: [projects.id],
  }),
}));

export const honorRenewalsRelations = relations(honorRenewals, ({ one }) => ({
  honor: one(honors, {
    fields: [honorRenewals.honorId],
    references: [honors.id],
  }),
}));
