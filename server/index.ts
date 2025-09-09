import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { getLeads, getLeadById, updateLeadStatus } from "./routes/leads";
import { getCampaigns, getCampaignById } from "./routes/campaigns";
import { auth } from "./auth";
import { toNodeHandler, fromNodeHeaders } from "better-auth/node";
import { seedIfEmpty } from "./db/seed";
import { isDbEnabled } from "./db/client";

export function createServer() {
  const app = express();

  // CORS first
  app.use(cors());

  // Standard body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Session endpoint (explicit) before mounting Better Auth
  app.get("/api/auth/session", async (req, res) => {
    try {
      const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
      return res.json(session ?? { user: null });
    } catch {
      return res.json({ user: null });
    }
  });

  // Better Auth handler mounted at /api/auth (handles all subpaths)
  app.use("/api/auth", toNodeHandler(auth));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Leads endpoints
  app.get("/api/leads", getLeads);
  app.get("/api/leads/:id", getLeadById);
  app.post("/api/leads/:id/status", updateLeadStatus);

  // Campaigns endpoints
  app.get("/api/campaigns", getCampaigns);
  app.get("/api/campaigns/:id", getCampaignById);

  // Seed database on cold start if empty
  if (isDbEnabled) {
    seedIfEmpty().catch((e) => console.error("DB seed failed:", e));
  }

  return app;
}
