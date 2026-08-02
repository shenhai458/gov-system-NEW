import { getDb } from "../api/queries/connection";
import {
  users,
  projects,
  settings,
  projectFields,
  dashboardWidgets,
  analyticsCards,
  honors,
  honorRenewals,
} from "./schema";
import bcrypt from "bcryptjs";

async function seed() {
  const db = getDb();

  // Clear existing data
  await db.delete(honorRenewals);
  await db.delete(honors);
  await db.delete(projects);
  await db.delete(projectFields);
  await db.delete(dashboardWidgets);
  await db.delete(analyticsCards);
  await db.delete(users);
  await db.delete(settings);

  // Seed admin user
  const hashedPassword = await bcrypt.hash("admin123", 10);
  await db.insert(users).values([
    {
      username: "admin",
      password: hashedPassword,
      realName: "系统管理员",
      role: "admin" as const,
      department: "科技局",
      status: "active" as const,
      lastLogin: new Date(),
    },
    {
      username: "lianhaibin",
      password: await bcrypt.hash("123456", 10),
      realName: "连海滨",
      role: "user" as const,
      department: "发改委",
      status: "active" as const,
      lastLogin: new Date("2025-01-15T10:15:00"),
    },
    {
      username: "lufuxing",
      password: await bcrypt.hash("123456", 10),
      realName: "卢福星",
      role: "user" as const,
      department: "人社局",
      status: "active" as const,
      lastLogin: new Date("2025-01-14T16:20:00"),
    },
    {
      username: "linzhirong",
      password: await bcrypt.hash("123456", 10),
      realName: "林智荣",
      role: "user" as const,
      department: "商务局",
      status: "disabled" as const,
      lastLogin: new Date("2025-01-10T09:30:00"),
    },
  ]);

  // Seed default project custom fields
  await db.insert(projectFields).values([
    { key: "project_code", label: "项目编号", fieldType: "text" as const, order: 1 },
    { key: "contact_person", label: "联系人", fieldType: "text" as const, order: 2 },
    { key: "funding_source", label: "资金来源", fieldType: "select" as const, options: ["中央财政", "省级财政", "市级财政", "区级财政", "自筹"], order: 3 },
  ]);

  // Seed projects
  await db.insert(projects).values([
    {
      name: "2024年科技保险补贴",
      deadline: new Date("2025-05-30"),
      department: "厦门市科学技术局",
      applyAmount: "41800",
      receiveAmount: null,
      status: "ok" as const,
      applicant: "连海滨",
      applyDate: new Date("2024-12-01"),
      receiveDate: null,
      noticeUrl: "",
      publicUrl: "",
      notes: "",
      warning: "normal" as const,
      customData: { project_code: "KX-2024-001", contact_person: "张三", funding_source: "市级财政" },
    },
    {
      name: "未来产业典型应用场景征集",
      deadline: new Date("2025-01-10"),
      department: "发改委",
      applyAmount: "荣誉",
      receiveAmount: null,
      status: "failed" as const,
      applicant: "连海滨",
      applyDate: new Date("2024-11-15"),
      receiveDate: null,
      noticeUrl: "",
      publicUrl: "",
      notes: "",
      warning: "normal" as const,
      customData: { project_code: "FG-2024-002", contact_person: "李四", funding_source: "省级财政" },
    },
    {
      name: "创业带动就业补贴—俊为",
      deadline: new Date("2025-04-10"),
      department: "人社局",
      applyAmount: "19000",
      receiveAmount: "19000",
      status: "ok" as const,
      applicant: "连海滨",
      applyDate: new Date("2024-10-20"),
      receiveDate: new Date("2025-03-01"),
      noticeUrl: "",
      publicUrl: "",
      notes: "",
      warning: "normal" as const,
      customData: { project_code: "RS-2024-003", contact_person: "王五", funding_source: "区级财政" },
    },
    {
      name: "厦门市高质量人才基地申报",
      deadline: new Date("2025-01-15"),
      department: "商务局",
      applyAmount: "荣誉",
      receiveAmount: null,
      status: "failed" as const,
      applicant: "连海滨",
      applyDate: new Date("2024-09-01"),
      receiveDate: null,
      noticeUrl: "",
      publicUrl: "",
      notes: "",
      warning: "normal" as const,
      customData: { project_code: "SW-2024-004", contact_person: "赵六", funding_source: "自筹" },
    },
    {
      name: "2025年超长期国债申报",
      deadline: new Date("2025-02-20"),
      department: "发改委",
      applyAmount: "7960000",
      receiveAmount: "7960000",
      status: "ok" as const,
      applicant: "连海滨",
      applyDate: new Date("2024-08-15"),
      receiveDate: new Date("2025-02-01"),
      noticeUrl: "",
      publicUrl: "",
      notes: "",
      warning: "normal" as const,
      customData: { project_code: "FG-2024-005", contact_person: "孙七", funding_source: "中央财政" },
    },
  ]);

  // Seed default settings
  await db.insert(settings).values({
    systemName: "政府项目申报管理系统",
    timezone: "Asia/Shanghai",
    emailNotification: "on",
    expiryReminder: "on",
    reminderDays: 7,
    passwordComplexity: "on",
    loginLock: "on",
    sessionTimeout: 30,
    autoBackup: "off",
    backupFrequency: "daily",
    backupRetention: 30,
  });

  // Seed default dashboard widgets
  await db.insert(dashboardWidgets).values([
    { title: "总项目数", type: "total" as const, icon: "FolderOpen", color: "indigo", order: 1 },
    { title: "进行中项目", type: "inProgress" as const, icon: "Clock", color: "blue", order: 2 },
    { title: "已完成项目", type: "completed" as const, icon: "CheckCircle2", color: "emerald", order: 3 },
    { title: "总金额", type: "totalAmount" as const, icon: "CircleDollarSign", color: "amber", order: 4 },
  ]);

  // Seed default analytics cards
  await db.insert(analyticsCards).values([
    { title: "总申报金额", type: "totalAmount" as const, icon: "TrendingUp", color: "indigo", order: 1 },
    { title: "成功率", type: "successRate" as const, icon: "Trophy", color: "emerald", order: 2 },
    { title: "活跃项目", type: "activeProjects" as const, icon: "Zap", color: "blue", order: 3 },
    { title: "总项目数", type: "total" as const, icon: "FolderOpen", color: "amber", order: 4 },
  ]);

  // Seed honors
  await db.insert(honors).values([
    {
      title: "国家高新技术企业",
      type: "qualification" as const,
      level: "national" as const,
      issuingAuthority: "科技部火炬中心",
      issueDate: new Date("2023-01-15"),
      expiryDate: new Date("2026-01-15"),
      reviewCycleMonths: 36,
      status: "valid" as const,
      notes: "需按期复审",
    },
    {
      title: "福建省专精特新中小企业",
      type: "honor" as const,
      level: "provincial" as const,
      issuingAuthority: "福建省工信厅",
      issueDate: new Date("2024-06-01"),
      expiryDate: new Date("2027-06-01"),
      reviewCycleMonths: 36,
      status: "valid" as const,
      notes: "",
    },
    {
      title: "厦门市企业技术中心",
      type: "qualification" as const,
      level: "city" as const,
      issuingAuthority: "厦门市工信局",
      issueDate: new Date("2022-03-10"),
      expiryDate: new Date("2025-03-10"),
      reviewCycleMonths: 36,
      status: "expiring" as const,
      notes: "即将到期，需准备复审材料",
    },
  ]);

  console.log("Seed completed!");
}

seed().catch(console.error);
