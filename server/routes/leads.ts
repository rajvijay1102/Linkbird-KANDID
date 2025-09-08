import { RequestHandler } from "express";
import { Lead, LeadStatus, LeadsQuery, PaginatedResponse } from "@shared/api";
import { db, isDbEnabled } from "../db/client";
import { leads as leadsTable } from "../db/schema";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";

// Deterministic pseudo-random generator for stable mock data
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const roles = [
  "Founder",
  "CEO",
  "CTO",
  "Marketing Lead",
  "Product Manager",
  "Sales Manager",
  "Growth Lead",
  "Engineer",
];
const locations = ["SF, USA", "NY, USA", "Berlin, DE", "Bengaluru, IN", "Remote", "London, UK"];
const companies = [
  "Linkbird",
  "Acme Co",
  "Globex",
  "Initech",
  "Umbrella",
  "Hooli",
  "Stark Industries",
  "Wayne Enterprises",
];
const statuses: LeadStatus[] = ["new", "contacted", "responded", "qualified", "lost"];

const seed = mulberry32(1337);
function pick<T>(arr: T[]) {
  return arr[Math.floor(seed() * arr.length)];
}

const ALL_LEADS: Lead[] = Array.from({ length: 400 }, (_, i) => {
  const first = ["Alex", "Sam", "Jordan", "Taylor", "Casey", "Drew", "Riley", "Jamie"][Math.floor(seed() * 8)];
  const last = ["Lee", "Patel", "Kim", "Garcia", "Nguyen", "Chen", "Singh", "Diaz"][Math.floor(seed() * 8)];
  const name = `${first} ${last}`;
  const company = pick(companies);
  const role = pick(roles);
  const status = pick(statuses);
  const email = `${first.toLowerCase()}.${last.toLowerCase()}@${company.toLowerCase().replace(/\s+/g, "")}.com`;
  const location = pick(locations);
  const score = Math.floor(seed() * 100);
  const daysAgo = Math.floor(seed() * 60);
  const lastActivity = new Date(Date.now() - daysAgo * 24 * 3600 * 1000).toISOString();
  const notes = `${name} from ${company} (${role}) located in ${location}. Status: ${status}.`;
  return { id: String(i + 1), name, company, role, email, location, status, score, lastActivity, notes };
});

export const getLeads: RequestHandler = async (req, res) => {
  const { page = 1, limit = 20, q = "", status = "all" } = req.query as unknown as LeadsQuery;

  const search = (q || "").toString().toLowerCase().trim();
  const statusFilter = status as LeadsQuery["status"];

  if (isDbEnabled && db) {
    const pageNum = Math.max(1, Number(page));
    const perPage = Math.max(1, Math.min(100, Number(limit)));
    const start = (pageNum - 1) * perPage;

    const where = and(
      statusFilter && statusFilter !== "all" ? eq(leadsTable.status, statusFilter as any) : undefined,
      search
        ? or(
            ilike(leadsTable.name, `%${search}%`),
            ilike(leadsTable.company, `%${search}%`),
            ilike(leadsTable.role, `%${search}%`),
            ilike(leadsTable.email, `%${search}%`),
          )
        : undefined,
    );

    const itemsDb = await db
      .select()
      .from(leadsTable)
      .where(where)
      .orderBy(desc(leadsTable.createdAt))
      .limit(perPage)
      .offset(start);

    const [{ count: total }] = await db.select({ count: count() }).from(leadsTable).where(where);

    const items: Lead[] = itemsDb.map((l) => ({
      id: l.id,
      name: l.name,
      company: l.company,
      role: l.role ?? "",
      email: l.email,
      location: l.location ?? "",
      status: l.status as LeadStatus,
      score: l.score,
      lastActivity: l.lastActivity ? new Date(l.lastActivity).toISOString() : new Date().toISOString(),
      notes: l.notes ?? "",
    }));

    const end = start + perPage;
    const hasMore = end < Number(total);
    const response: PaginatedResponse<Lead> = { items, page: pageNum, hasMore, total: Number(total) };
    return res.json(response);
  }

  let filtered = ALL_LEADS;
  if (search) {
    filtered = filtered.filter(
      (l) =>
        l.name.toLowerCase().includes(search) ||
        l.company.toLowerCase().includes(search) ||
        l.role.toLowerCase().includes(search) ||
        l.email.toLowerCase().includes(search),
    );
  }
  if (statusFilter && statusFilter !== "all") {
    filtered = filtered.filter((l) => l.status === statusFilter);
  }

  const pageNum = Math.max(1, Number(page));
  const perPage = Math.max(1, Math.min(100, Number(limit)));
  const start = (pageNum - 1) * perPage;
  const end = start + perPage;
  const items = filtered.slice(start, end);
  const total = filtered.length;
  const hasMore = end < total;

  const response: PaginatedResponse<Lead> = { items, page: pageNum, hasMore, total };
  res.json(response);
};

export const getLeadById: RequestHandler = async (req, res) => {
  const id = req.params.id;

  if (isDbEnabled && db) {
    const [l] = await db.select().from(leadsTable).where(eq(leadsTable.id, id)).limit(1);
    if (!l) return res.status(404).json({ message: "Lead not found" });
    const lead: Lead = {
      id: l.id,
      name: l.name,
      company: l.company,
      role: l.role ?? "",
      email: l.email,
      location: l.location ?? "",
      status: l.status as LeadStatus,
      score: l.score,
      lastActivity: l.lastActivity ? new Date(l.lastActivity).toISOString() : new Date().toISOString(),
      notes: l.notes ?? "",
    };
    return res.json(lead);
  }

  const lead = ALL_LEADS.find((l) => l.id === id);
  if (!lead) return res.status(404).json({ message: "Lead not found" });
  res.json(lead);
};

export const updateLeadStatus: RequestHandler = async (req, res) => {
  const id = req.params.id;
  const { status } = req.body as { status: LeadStatus };

  if (isDbEnabled && db) {
    const updated = await db
      .update(leadsTable)
      .set({ status: status as any })
      .where(eq(leadsTable.id, id))
      .returning();
    const l = updated[0];
    if (!l) return res.status(404).json({ message: "Lead not found" });
    const lead: Lead = {
      id: l.id,
      name: l.name,
      company: l.company,
      role: l.role ?? "",
      email: l.email,
      location: l.location ?? "",
      status: l.status as LeadStatus,
      score: l.score,
      lastActivity: l.lastActivity ? new Date(l.lastActivity).toISOString() : new Date().toISOString(),
      notes: l.notes ?? "",
    };
    return res.json(lead);
  }

  const idx = ALL_LEADS.findIndex((l) => l.id === id);
  if (idx === -1) return res.status(404).json({ message: "Lead not found" });
  ALL_LEADS[idx] = { ...ALL_LEADS[idx], status };
  res.json(ALL_LEADS[idx]);
};
