import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { getLeads, getLeadById, updateLeadStatus } from "./routes/leads";
import { getCampaigns, getCampaignById } from "./routes/campaigns";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

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

  return app;
}
