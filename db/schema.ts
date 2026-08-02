import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["admin", "user", "visitor"]);
export const userStatusEnum = pgEnum("user_status", ["active", "disabled"]);
export const projectStatusEnum = pgEnum("project_status", ["ok", "failed", "in_progress", "pending"]);
export const warningEnum = pgEnum("warning", ["normal", "7days", "15days", "30days"]);
export const onOffEnum = pgEnum("on_off", ["on", "off"]);
export const fieldTypeEnum = pgEnum("field_type", ["text", "number", "date", "select", "textarea"]);
export const widgetTypeEnum = pgEnum("widget_type", [
  "total",
  "inProgress",
  "completed",
  "failed",
  "pending",
  "totalAmount",
  "successRate",
  "activeProjects",
]);
export const honorTypeEnum = pgEnum("honor_type", ["honor", "qualification", "certification", "other"]);
export const honorLevelEnum = pgEnum("honor_level", ["national", "provincial", "city", "district", "other"]);
export const honorStatusEnum = pgEnum("honor_status", ["valid", "expiring", "expired"]);
export const renewalStatusEnum = pgEnum("renewal_status", ["planned", "in_progress", "completed", "overdue"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  realName: varchar("real_name", { length: 100 }).notNull(),
  role: roleEnum("role").notNull().default("user"),
  department: varchar("department", { length: 100 }),
  status: userStatusEnum("status").notNull().default("active"),
  lastLogin: timestamp("last_login", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  deadline: timestamp("deadline", { withTimezone: true }),
  department: varchar("department", { length: 100 }),
  applyAmount: varchar("apply_amount", { length: 50 }),
  receiveAmount: varchar("receive_amount", { length: 50 }),
  status: projectStatusEnum("status").notNull().default("pending"),
  applicant: varchar("applicant", { length: 100 }),
  applyDate: timestamp("apply_date", { withTimezone: true }),
  receiveDate: timestamp("receive_date", { withTimezone: true }),
  noticeUrl: varchar("notice_url", { length: 500 }),
  publicUrl: varchar("public_url", { length: 500 }),
  notes: text("notes"),
  warning: warningEnum("warning").default("normal"),
  customData: jsonb("custom_data").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const projectFields = pgTable("project_fields", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  label: varchar("label", { length: 100 }).notNull(),
  fieldType: fieldTypeEnum("field_type").notNull().default("text"),
  options: jsonb("options").default([]).notNull(),
  required: boolean("required").notNull().default(false),
  order: integer("order").notNull().default(0),
  isVisible: boolean("is_visible").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  systemName: varchar("system_name", { length: 255 }).default("政府项目申报管理系统"),
  timezone: varchar("timezone", { length: 50 }).default("Asia/Shanghai"),
  emailNotification: onOffEnum("email_notification").default("on"),
  expiryReminder: onOffEnum("expiry_reminder").default("on"),
  reminderDays: integer("reminder_days").default(7),
  passwordComplexity: onOffEnum("password_complexity").default("on"),
  loginLock: onOffEnum("login_lock").default("on"),
  sessionTimeout: integer("session_timeout").default(30),
  autoBackup: onOffEnum("auto_backup").default("off"),
  backupFrequency: varchar("backup_frequency", { length: 50 }).default("daily"),
  backupRetention: integer("backup_retention").default(30),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const dashboardWidgets = pgTable("dashboard_widgets", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 100 }).notNull(),
  type: widgetTypeEnum("type").notNull(),
  icon: varchar("icon", { length: 50 }).notNull().default("FolderOpen"),
  color: varchar("color", { length: 50 }).notNull().default("blue"),
  order: integer("order").notNull().default(0),
  isVisible: boolean("is_visible").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const analyticsCards = pgTable("analytics_cards", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 100 }).notNull(),
  type: widgetTypeEnum("type").notNull(),
  icon: varchar("icon", { length: 50 }).notNull().default("TrendingUp"),
  color: varchar("color", { length: 50 }).notNull().default("indigo"),
  order: integer("order").notNull().default(0),
  isVisible: boolean("is_visible").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const honors = pgTable("honors", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  type: honorTypeEnum("type").notNull().default("honor"),
  level: honorLevelEnum("level").default("other"),
  issuingAuthority: varchar("issuing_authority", { length: 200 }),
  issueDate: timestamp("issue_date", { withTimezone: true }),
  expiryDate: timestamp("expiry_date", { withTimezone: true }),
  reviewCycleMonths: integer("review_cycle_months"),
  status: honorStatusEnum("status").default("valid"),
  attachmentUrl: varchar("attachment_url", { length: 500 }),
  notes: text("notes"),
  projectId: integer("project_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const honorRenewals = pgTable("honor_renewals", {
  id: serial("id").primaryKey(),
  honorId: integer("honor_id").notNull(),
  plannedDate: timestamp("planned_date", { withTimezone: true }),
  actualDate: timestamp("actual_date", { withTimezone: true }),
  status: renewalStatusEnum("status").default("planned"),
  cost: varchar("cost", { length: 50 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
