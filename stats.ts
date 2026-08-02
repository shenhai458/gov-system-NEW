import type { InferSelectModel } from "drizzle-orm";
import { projects } from "@db/schema";

type Project = InferSelectModel<typeof projects>;

export function computeProjectStats(allProjects: Project[]) {
  const total = allProjects.length;
  const inProgress = allProjects.filter((p) => p.status === "in_progress").length;
  const completed = allProjects.filter((p) => p.status === "ok").length;
  const failed = allProjects.filter((p) => p.status === "failed").length;
  const pending = allProjects.filter((p) => p.status === "pending").length;

  let totalAmount = 0;
  let totalApply = 0;
  let totalReceive = 0;

  allProjects.forEach((p) => {
    if (p.applyAmount && !isNaN(parseFloat(p.applyAmount))) {
      totalApply += parseFloat(p.applyAmount);
    }
    if (p.receiveAmount && !isNaN(parseFloat(p.receiveAmount))) {
      totalReceive += parseFloat(p.receiveAmount);
    }
  });

  totalAmount = totalApply;
  const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const now = new Date();
  const activeProjects = allProjects.filter((p) => {
    if (!p.deadline) return false;
    return new Date(p.deadline) > now;
  }).length;

  return {
    total,
    inProgress,
    completed,
    failed,
    pending,
    totalAmount,
    totalApply,
    totalReceive,
    successRate,
    activeProjects,
  };
}

export function formatAmountDisplay(amount: number): string {
  if (amount >= 10000) {
    return `${(amount / 10000).toFixed(1)}万`;
  }
  return `${amount}`;
}
