// Drizzle ORM schema for Users, Leads, Campaigns
// This file provides the schema used for migrations and type-safety when integrating Drizzle.
// Install deps: pnpm add drizzle-orm drizzle-kit pg postgres
// Then configure your drizzle.config and migration scripts.

import { pgTable, serial, text, timestamp, integer, pgEnum, uuid, index } from "drizzle-orm/pg-core";

export const campaignStatus = pgEnum("campaign_status", ["draft", "running", "paused", "completed"]);
export const leadStatus = pgEnum("lead_status", ["new", "contacted", "responded", "qualified", "lost"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    name: text("name"),
    image: text("image"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ emailIdx: index("users_email_idx").on(t.email) }),
);

export const campaigns = pgTable(
  "campaigns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    status: campaignStatus("status").notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    ownerId: uuid("owner_id").references(() => users.id, { onDelete: "cascade" }),
    leads: integer("leads").notNull().default(0),
    sent: integer("sent").notNull().default(0),
    opened: integer("opened").notNull().default(0),
    replied: integer("replied").notNull().default(0),
  },
);

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    company: text("company").notNull(),
    role: text("role"),
    email: text("email").notNull(),
    location: text("location"),
    status: leadStatus("status").notNull().default("new"),
    score: integer("score").notNull().default(0),
    lastActivity: timestamp("last_activity", { withTimezone: true }).defaultNow(),
    notes: text("notes"),
    ownerId: uuid("owner_id").references(() => users.id, { onDelete: "set null" }),
    campaignId: uuid("campaign_id").references(() => campaigns.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ emailIdx: index("leads_email_idx").on(t.email) }),
);
