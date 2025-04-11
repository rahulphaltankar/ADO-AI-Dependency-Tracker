import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  fullName: text("full_name").notNull(),
  organization: text("organization"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Azure DevOps connection settings
export const adoSettings = pgTable("ado_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  organization: text("organization").notNull(),
  project: text("project").notNull(),
  token: text("token"), // Legacy PAT token (optional now)
  accessToken: text("access_token"), // OAuth access token
  refreshToken: text("refresh_token"), // OAuth refresh token
  tokenExpiresAt: timestamp("token_expires_at"), // Expiration timestamp
  useOAuth: boolean("use_oauth").default(true), // Whether to use OAuth or PAT
});

export const insertAdoSettingsSchema = createInsertSchema(adoSettings).omit({
  id: true,
});

// Alert settings
export const alertSettings = pgTable("alert_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  slackWebhook: text("slack_webhook"),
  teamsWebhook: text("teams_webhook"),
  riskThreshold: integer("risk_threshold").default(60),
});

export const insertAlertSettingsSchema = createInsertSchema(alertSettings).omit({
  id: true,
});

// Work items from Azure DevOps
export const workItems = pgTable("work_items", {
  id: serial("id").primaryKey(),
  adoId: integer("ado_id").notNull().unique(),
  title: text("title").notNull(),
  type: text("type").notNull(),
  state: text("state").notNull(),
  assignedTo: text("assigned_to"),
  team: text("team"),
  sprint: text("sprint"),
  storyPoints: integer("story_points"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertWorkItemSchema = createInsertSchema(workItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Dependencies between work items
export const dependencies = pgTable("dependencies", {
  id: serial("id").primaryKey(),
  sourceId: integer("source_id").notNull().references(() => workItems.id),
  targetId: integer("target_id").notNull().references(() => workItems.id),
  dependencyType: text("dependency_type").notNull(), // "Blocks", "Depends on", "Related to", etc.
  aiDetected: boolean("ai_detected").default(false),
  detectionSource: text("detection_source"), // "NLP", "Manual", "ADO", etc.
  riskScore: integer("risk_score"),
  expectedDelay: integer("expected_delay"), // in days
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDependencySchema = createInsertSchema(dependencies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// AI analysis results
export const aiAnalysis = pgTable("ai_analysis", {
  id: serial("id").primaryKey(),
  inputText: text("input_text").notNull(),
  dependencyEntities: json("dependency_entities").notNull(),
  relatedWorkItemIds: json("related_work_item_ids"),
  riskAssessment: json("risk_assessment"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAiAnalysisSchema = createInsertSchema(aiAnalysis).omit({
  id: true,
  createdAt: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type AdoSettings = typeof adoSettings.$inferSelect;
export type InsertAdoSettings = z.infer<typeof insertAdoSettingsSchema>;

export type AlertSettings = typeof alertSettings.$inferSelect;
export type InsertAlertSettings = z.infer<typeof insertAlertSettingsSchema>;

export type WorkItem = typeof workItems.$inferSelect;
export type InsertWorkItem = z.infer<typeof insertWorkItemSchema>;

export type Dependency = typeof dependencies.$inferSelect;
export type InsertDependency = z.infer<typeof insertDependencySchema>;

export type AiAnalysis = typeof aiAnalysis.$inferSelect;
export type InsertAiAnalysis = z.infer<typeof insertAiAnalysisSchema>;
