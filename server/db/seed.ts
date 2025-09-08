import { db, isDbEnabled } from "./client";
import { campaigns, leads, users } from "./schema";
import { count, eq } from "drizzle-orm";

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
const statuses = ["new", "contacted", "responded", "qualified", "lost"] as const;

const campaignNames = [
  "Startup Founders Outreach",
  "SaaS CTO Drip",
  "Product-Led Growth Trial",
  "Cold Outreach A/B",
  "Re-engagement Q2",
  "Beta Invite Wave",
  "Newsletter Cross-Promo",
  "Conference Follow-ups",
];

function pick<T>(seed: () => number, arr: readonly T[]) {
  return arr[Math.floor(seed() * arr.length)];
}

export async function seedIfEmpty() {
  if (!isDbEnabled || !db) return;

  const [{ count: leadsCount }] = await db.select({ count: count() }).from(leads);
  const [{ count: campaignsCount }] = await db.select({ count: count() }).from(campaigns);

  if (leadsCount > 0 || campaignsCount > 0) return;

  const userEmail = "demo@linkbird.ai";
  const [user] = await db
    .insert(users)
    .values({ email: userEmail, name: "Demo User", image: "" })
    .onConflictDoNothing()
    .returning();

  // Create campaigns
  const seedC = mulberry32(1337);
  const campaignRows = Array.from({ length: 32 }, (_, i) => {
    const name = `${campaignNames[i % campaignNames.length]} #${i + 1}`;
    const leadsNum = 200 + ((i * 37) % 800);
    const sent = Math.floor(leadsNum * 0.9);
    const opened = Math.floor(sent * (0.4 + ((i * 7) % 20) / 100));
    const replied = Math.floor(opened * (0.1 + ((i * 5) % 10) / 100));
    const status = i % 7 === 0 ? ("paused" as const) : i % 5 === 0 ? ("completed" as const) : ("running" as const);
    const createdAt = new Date(Date.now() - i * 86400000);
    return {
      name,
      status,
      createdAt,
      ownerId: user?.id,
      leads: leadsNum,
      sent,
      opened,
      replied,
    };
  });

  const insertedCampaigns = await db.insert(campaigns).values(campaignRows).returning();

  // Create leads
  const seedL = mulberry32(1337);
  const leadRows = Array.from({ length: 400 }, (_, i) => {
    const first = ["Alex", "Sam", "Jordan", "Taylor", "Casey", "Drew", "Riley", "Jamie"][Math.floor(seedL() * 8)];
    const last = ["Lee", "Patel", "Kim", "Garcia", "Nguyen", "Chen", "Singh", "Diaz"][Math.floor(seedL() * 8)];
    const name = `${first} ${last}`;
    const company = pick(seedL, companies);
    const role = pick(seedL, roles);
    const status = pick(seedL, statuses);
    const email = `${first.toLowerCase()}.${last.toLowerCase()}@${company.toLowerCase().replace(/\s+/g, "")}.com`;
    const location = pick(seedL, locations);
    const score = Math.floor(seedL() * 100);
    const daysAgo = Math.floor(seedL() * 60);
    const lastActivity = new Date(Date.now() - daysAgo * 24 * 3600 * 1000);
    const notes = `${name} from ${company} (${role}) located in ${location}. Status: ${status}.`;
    const campaignId = insertedCampaigns[i % insertedCampaigns.length]?.id;
    return {
      name,
      company,
      role,
      email,
      location,
      status: status as any,
      score,
      lastActivity,
      notes,
      ownerId: user?.id,
      campaignId,
      createdAt: new Date(),
    };
  });

  await db.insert(leads).values(leadRows);
}
