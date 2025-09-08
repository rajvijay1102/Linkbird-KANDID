import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

export const isDbEnabled = Boolean(process.env.DATABASE_URL);

export const sql = isDbEnabled
  ? postgres(process.env.DATABASE_URL as string, {
      prepare: false,
    })
  : null;

export const db = isDbEnabled && sql ? drizzle(sql) : null;
