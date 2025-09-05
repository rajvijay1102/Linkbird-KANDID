import { RequestHandler } from "express";
import { Campaign, PaginatedRequest, PaginatedResponse } from "@shared/api";

const CAMPAIGNS: Campaign[] = Array.from({ length: 32 }, (_, i) => {
  const names = [
    "Startup Founders Outreach",
    "SaaS CTO Drip",
    "Product-Led Growth Trial",
    "Cold Outreach A/B",
    "Re-engagement Q2",
    "Beta Invite Wave",
    "Newsletter Cross-Promo",
    "Conference Follow-ups",
  ];
  const name = `${names[i % names.length]} #${i + 1}`;
  const leads = 200 + ((i * 37) % 800);
  const sent = Math.floor(leads * 0.9);
  const opened = Math.floor(sent * (0.4 + ((i * 7) % 20) / 100));
  const replied = Math.floor(opened * (0.1 + ((i * 5) % 10) / 100));
  const status: Campaign["status"] = i % 7 === 0 ? "paused" : i % 5 === 0 ? "completed" : "running";
  const createdAt = new Date(Date.now() - i * 86400000).toISOString();
  return { id: String(i + 1), name, createdAt, leads, sent, opened, replied, status };
});

export const getCampaigns: RequestHandler = (req, res) => {
  const { page = 1, limit = 20 } = req.query as unknown as PaginatedRequest;
  const pageNum = Math.max(1, Number(page));
  const perPage = Math.max(1, Math.min(100, Number(limit)));
  const start = (pageNum - 1) * perPage;
  const end = start + perPage;
  const items = CAMPAIGNS.slice(start, end);
  const total = CAMPAIGNS.length;
  const hasMore = end < total;

  const response: PaginatedResponse<Campaign> = { items, page: pageNum, hasMore, total };
  res.json(response);
};

export const getCampaignById: RequestHandler = (req, res) => {
  const id = req.params.id;
  const campaign = CAMPAIGNS.find((c) => c.id === id);
  if (!campaign) return res.status(404).json({ message: "Campaign not found" });
  res.json(campaign);
};
