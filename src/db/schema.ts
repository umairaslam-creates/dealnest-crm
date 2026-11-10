import {
  pgTable,
  text,
  timestamp,
  integer,
  doublePrecision,
  boolean,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

const id = () => text("id").primaryKey().$defaultFn(() => createId());

export const roleEnum = pgEnum("role", ["ADMIN", "MANAGER", "REP"]);
export const pipelineTypeEnum = pgEnum("pipeline_type", ["LEAD", "DEAL"]);
export const dealStatusEnum = pgEnum("deal_status", ["OPEN", "WON", "LOST"]);
export const activityTypeEnum = pgEnum("activity_type", ["CALL", "MEETING", "NOTE", "EMAIL"]);

// ---------- Users ----------

export const users = pgTable("users", {
  id: id(),
  name: text("name"),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  role: roleEnum("role").notNull().default("REP"),
  accountType: text("account_type").notNull().default("INDIVIDUAL"),
  department: text("department"),
  orgRole: text("org_role").default("REPRESENTATIVE"),
  status: text("status").notNull().default("ACTIVE"),
  companyDomain: text("company_domain"),
  phone: text("phone"),
  occupation: text("occupation"),
  designation: text("designation"),
  image: text("image"),
  purpose: text("purpose"),
  industry: text("industry"),
  themePreference: text("theme_preference").default("clinexa-blue"),
  fontPreference: text("font_preference").default("saas-modern"),
  permissions: text("permissions"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- Companies & people ----------

export const accounts = pgTable("accounts", {
  id: id(),
  name: text("name").notNull(),
  industry: text("industry"),
  region: text("region"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const contacts = pgTable("contacts", {
  id: id(),
  name: text("name").notNull(),
  title: text("title"),
  email: text("email"),
  phone: text("phone"),
  role: text("role"),
  accountId: text("account_id").references(() => accounts.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- Pipelines & stages (shared by leads and deals) ----------

export const pipelines = pgTable("pipelines", {
  id: id(),
  name: text("name").notNull(),
  type: pipelineTypeEnum("type").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const stages = pgTable(
  "stages",
  {
    id: id(),
    name: text("name").notNull(),
    color: text("color"),
    order: integer("order").notNull(),
    pipelineId: text("pipeline_id")
      .notNull()
      .references(() => pipelines.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pipelineOrderIdx: uniqueIndex("stage_pipeline_order_idx").on(t.pipelineId, t.order),
  })
);

// ---------- Leads ----------

export const leads = pgTable("leads", {
  id: id(),
  contactName: text("contact_name").notNull(),
  title: text("title"), // Job Title / Designation
  company: text("company"),
  website: text("website"), // Company Website
  email: text("email"),
  phone: text("phone"),
  source: text("source"),
  productInterest: text("product_interest"),
  region: text("region"),
  city: text("city"),
  value: doublePrecision("value"), // Estimated Deal/Lead Value
  score: text("score"), // hot / warm / cold
  pipelineId: text("pipeline_id").references(() => pipelines.id),
  stageId: text("stage_id").references(() => stages.id),
  ownerId: text("owner_id").references(() => users.id),
  accountId: text("account_id").references(() => accounts.id),
  contactId: text("contact_id").references(() => contacts.id),
  tags: text("tags"), // JSON array of tag objects or IDs
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  stageEnteredAt: timestamp("stage_entered_at").notNull().defaultNow(),
});

// ---------- Deals ----------

export const deals = pgTable("deals", {
  id: id(),
  title: text("title").notNull(),
  value: doublePrecision("value"),
  currency: text("currency").default("USD"),
  probability: integer("probability").default(0),
  status: dealStatusEnum("status").notNull().default("OPEN"),
  lossReason: text("loss_reason"),
  expectedClose: timestamp("expected_close"),
  pipelineId: text("pipeline_id")
    .notNull()
    .references(() => pipelines.id),
  stageId: text("stage_id")
    .notNull()
    .references(() => stages.id),
  accountId: text("account_id").references(() => accounts.id),
  ownerId: text("owner_id").references(() => users.id),
  productId: text("product_id").references(() => products.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  stageEnteredAt: timestamp("stage_entered_at").notNull().defaultNow(),
});

export const dealContacts = pgTable("deal_contacts", {
  id: id(),
  dealId: text("deal_id")
    .notNull()
    .references(() => deals.id, { onDelete: "cascade" }),
  contactId: text("contact_id")
    .notNull()
    .references(() => contacts.id, { onDelete: "cascade" }),
});

// ---------- Activities & tasks ----------

export const activities = pgTable("activities", {
  id: id(),
  type: activityTypeEnum("type").notNull(),
  notes: text("notes"),
  occurredAt: timestamp("occurred_at").notNull().defaultNow(),
  dealId: text("deal_id").references(() => deals.id),
  leadId: text("lead_id").references(() => leads.id),
  contactId: text("contact_id").references(() => contacts.id),
  userId: text("user_id").references(() => users.id),
});

export const tasks = pgTable("tasks", {
  id: id(),
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority").notNull().default("MEDIUM"), // HIGH, MEDIUM, LOW
  dueDate: timestamp("due_date"),
  done: boolean("done").notNull().default(false),
  dealId: text("deal_id").references(() => deals.id),
  leadId: text("lead_id").references(() => leads.id),
  ownerId: text("owner_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const feedback = pgTable("feedback", {
  id: id(),
  type: text("type").notNull().default("IMPROVEMENT"), // BUG, FEATURE, IMPROVEMENT
  message: text("message").notNull(),
  rating: integer("rating"),
  userId: text("user_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- AI suggestions (written only on-demand, never by a background job) ----------

export const aiSuggestions = pgTable("ai_suggestions", {
  id: id(),
  dealId: text("deal_id")
    .notNull()
    .references(() => deals.id, { onDelete: "cascade" }),
  suggestion: text("suggestion").notNull(),
  reasoning: text("reasoning"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// One Google account connected per user, for the Gmail send / Calendar
// create-event integrations. Populated by the OAuth callback in
// src/app/api/integrations/google/callback/route.ts, never by a background
// job — tokens are only used when a user explicitly clicks "Email" or
// "Schedule meeting" on a deal.
export const googleTokens = pgTable("google_tokens", {
  id: id(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  googleEmail: text("google_email"),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at").notNull(),
  scope: text("scope"),
  connectedAt: timestamp("connected_at").notNull().defaultNow(),
});

export const userIntegrations = pgTable(
  "user_integrations",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    encryptedSecret: text("encrypted_secret"),
    settings: text("settings"),
    connectedAt: timestamp("connected_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    userProviderIdx: uniqueIndex("user_integrations_user_provider_idx").on(t.userId, t.provider),
  })
);

// Every stage move (deal or lead) is logged here going forward, so real
// historical trend lines (pipeline value at a past point in time, not just
// "value of deals created that week") become possible once enough history
// accumulates. Written by moveDealStage/moveLeadStage and on creation, never
// by a background job.
export const stageHistory = pgTable("stage_history", {
  id: id(),
  dealId: text("deal_id").references(() => deals.id, { onDelete: "cascade" }),
  leadId: text("lead_id").references(() => leads.id, { onDelete: "cascade" }),
  fromStageId: text("from_stage_id").references(() => stages.id),
  toStageId: text("to_stage_id")
    .notNull()
    .references(() => stages.id),
  value: doublePrecision("value"), // deal value at the time of the move, for trend math
  changedAt: timestamp("changed_at").notNull().defaultNow(),
});

// Internal Agent Control command audit trail.
export const agentAuditLogs = pgTable("agent_audit_logs", {
  id: id(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  leadId: text("lead_id").references(() => leads.id, { onDelete: "cascade" }),
  actionType: text("action_type").notNull(),
  previousValue: text("previous_value"),
  newValue: text("new_value"),
  source: text("source").notNull().default("agent_control"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- Relations (for query ergonomics) ----------

export const pipelinesRelations = relations(pipelines, ({ many }) => ({
  stages: many(stages),
  deals: many(deals),
  leads: many(leads),
}));

export const stagesRelations = relations(stages, ({ one, many }) => ({
  pipeline: one(pipelines, { fields: [stages.pipelineId], references: [pipelines.id] }),
  deals: many(deals),
  leads: many(leads),
}));

export const dealsRelations = relations(deals, ({ one, many }) => ({
  pipeline: one(pipelines, { fields: [deals.pipelineId], references: [pipelines.id] }),
  stage: one(stages, { fields: [deals.stageId], references: [stages.id] }),
  account: one(accounts, { fields: [deals.accountId], references: [accounts.id] }),
  owner: one(users, { fields: [deals.ownerId], references: [users.id] }),
  activities: many(activities),
  tasks: many(tasks),
  dealContacts: many(dealContacts),
  product: one(products, { fields: [deals.productId], references: [products.id] }),
  stageHistory: many(stageHistory),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  pipeline: one(pipelines, { fields: [leads.pipelineId], references: [pipelines.id] }),
  stage: one(stages, { fields: [leads.stageId], references: [stages.id] }),
  owner: one(users, { fields: [leads.ownerId], references: [users.id] }),
  account: one(accounts, { fields: [leads.accountId], references: [accounts.id] }),
  contact: one(contacts, { fields: [leads.contactId], references: [contacts.id] }),
  activities: many(activities),
  tasks: many(tasks),
  stageHistory: many(stageHistory),
  agentAuditLogs: many(agentAuditLogs),
}));

export const accountsRelations = relations(accounts, ({ many }) => ({
  contacts: many(contacts),
  deals: many(deals),
  leads: many(leads),
}));

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  account: one(accounts, { fields: [contacts.accountId], references: [accounts.id] }),
  leads: many(leads),
  activities: many(activities),
  dealContacts: many(dealContacts),
}));

export const dealContactsRelations = relations(dealContacts, ({ one }) => ({
  deal: one(deals, { fields: [dealContacts.dealId], references: [deals.id] }),
  contact: one(contacts, { fields: [dealContacts.contactId], references: [contacts.id] }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  deal: one(deals, { fields: [activities.dealId], references: [deals.id] }),
  lead: one(leads, { fields: [activities.leadId], references: [leads.id] }),
  contact: one(contacts, { fields: [activities.contactId], references: [contacts.id] }),
  user: one(users, { fields: [activities.userId], references: [users.id] }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  deal: one(deals, { fields: [tasks.dealId], references: [deals.id] }),
  lead: one(leads, { fields: [tasks.leadId], references: [leads.id] }),
  owner: one(users, { fields: [tasks.ownerId], references: [users.id] }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  deals: many(deals),
  leads: many(leads),
  activities: many(activities),
  tasks: many(tasks),
  feedback: many(feedback),
  integrations: many(userIntegrations),
  agentAuditLogs: many(agentAuditLogs),
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
  user: one(users, { fields: [feedback.userId], references: [users.id] }),
}));

export const aiSuggestionsRelations = relations(aiSuggestions, ({ one }) => ({
  deal: one(deals, { fields: [aiSuggestions.dealId], references: [deals.id] }),
}));

export const googleTokensRelations = relations(googleTokens, ({ one }) => ({
  user: one(users, { fields: [googleTokens.userId], references: [users.id] }),
}));

export const userIntegrationsRelations = relations(userIntegrations, ({ one }) => ({
  user: one(users, { fields: [userIntegrations.userId], references: [users.id] }),
}));

export const stageHistoryRelations = relations(stageHistory, ({ one }) => ({
  deal: one(deals, { fields: [stageHistory.dealId], references: [deals.id] }),
  lead: one(leads, { fields: [stageHistory.leadId], references: [leads.id] }),
  fromStage: one(stages, { fields: [stageHistory.fromStageId], references: [stages.id] }),
  toStage: one(stages, { fields: [stageHistory.toStageId], references: [stages.id] }),
}));

export const agentAuditLogsRelations = relations(agentAuditLogs, ({ one }) => ({
  user: one(users, { fields: [agentAuditLogs.userId], references: [users.id] }),
  lead: one(leads, { fields: [agentAuditLogs.leadId], references: [leads.id] }),
}));

// ---------- Products & Solutions Catalog ----------

export const products = pgTable("products", {
  id: id(),
  name: text("name").notNull(),
  sku: text("sku").notNull().unique(),
  category: text("category").notNull(),
  description: text("description"),
  price: doublePrecision("price").notNull().default(0),
  currency: text("currency").notNull().default("SAR"),
  status: text("status").notNull().default("ACTIVE"), // ACTIVE, DRAFT, ARCHIVED
  features: text("features"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const productsRelations = relations(products, ({ many }) => ({
  deals: many(deals),
  documents: many(productDocuments),
}));

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

// ---------- Product Documents / Specifications ----------

export const productDocuments = pgTable("product_documents", {
  id: id(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  fileType: text("file_type").notNull(), // pdf, doc, spec, sheet, image, link, other
  fileUrl: text("file_url").notNull(),
  fileSize: text("file_size"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const productDocumentsRelations = relations(productDocuments, ({ one }) => ({
  product: one(products, { fields: [productDocuments.productId], references: [products.id] }),
}));

export type ProductDocument = typeof productDocuments.$inferSelect;
export type NewProductDocument = typeof productDocuments.$inferInsert;

// ---------- Meetings & Appointments ----------

export const meetings = pgTable("meetings", {
  id: id(),
  title: text("title").notNull(),
  description: text("description"),
  meetingType: text("meeting_type").notNull().default("DEMO"), // DEMO, DISCOVERY, NEGOTIATION, FOLLOW_UP, URGENT
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  contactId: text("contact_id").references(() => contacts.id),
  dealId: text("deal_id").references(() => deals.id),
  userId: text("user_id").references(() => users.id),
  googleEventId: text("google_event_id"),
  location: text("location").default("Google Meet"),
  status: text("status").notNull().default("SCHEDULED"), // SCHEDULED, COMPLETED, CANCELLED
  color: text("color").notNull().default("blue"), // blue, yellow, coral, green, purple
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const meetingsRelations = relations(meetings, ({ one }) => ({
  contact: one(contacts, { fields: [meetings.contactId], references: [contacts.id] }),
  deal: one(deals, { fields: [meetings.dealId], references: [deals.id] }),
  user: one(users, { fields: [meetings.userId], references: [users.id] }),
}));

export type Meeting = typeof meetings.$inferSelect;
export type NewMeeting = typeof meetings.$inferInsert;

// ---------- Targets & Goals ----------

export const targets = pgTable("targets", {
  id: id(),
  title: text("title").notNull(),
  type: text("type").notNull().default("REVENUE_QUOTA"), // REVENUE_QUOTA, DEMO_SCHEDULED, MEETING_SCHEDULED, DEALS_WON, LEADS_GENERATED
  targetValue: doublePrecision("target_value").notNull(),
  currency: text("currency").default("SAR"), // USD, SAR, EUR, AED
  period: text("period").notNull().default("MONTHLY"), // MONTHLY, QUARTERLY, ANNUAL, CUSTOM
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  userId: text("user_id").references(() => users.id), // Assignee: null = company-wide, or specific user
  assignedByUserId: text("assigned_by_user_id").references(() => users.id), // Team Lead / Creator
  pipelineId: text("pipeline_id").references(() => pipelines.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const targetsRelations = relations(targets, ({ one }) => ({
  user: one(users, { fields: [targets.userId], references: [users.id], relationName: "targetAssignee" }),
  assignedBy: one(users, { fields: [targets.assignedByUserId], references: [users.id], relationName: "targetCreator" }),
  pipeline: one(pipelines, { fields: [targets.pipelineId], references: [pipelines.id] }),
}));

export type Target = typeof targets.$inferSelect;
export type NewTarget = typeof targets.$inferInsert;
