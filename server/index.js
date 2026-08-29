import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

const port = process.env.PORT || 3000;
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "visit_web";
let db;

async function getDb() {
  if (!uri) throw new Error("MONGODB_URI is not configured");
  if (!db) {
    const client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
  }
  return db;
}

app.get("/api/health", async (_req, res) => {
  try {
    const database = await getDb();
    await database.command({ ping: 1 });
    res.json({ ok: true, database: dbName });
  } catch (error) {
    res.status(503).json({ ok: false, error: error.message });
  }
});

const collections = new Set([
  "profiles", "user_roles", "orders", "packages", "coupons", "credit_coupons",
  "payments", "announcements", "site_settings", "payment_methods",
  "coupon_uses", "coupon_redemption_attempts", "credit_transactions", "free_trial_uses"
]);

app.get("/api/data/:collection", async (req, res) => {
  try {
    if (!collections.has(req.params.collection)) return res.status(404).json({ error: "Collection not found" });
    const database = await getDb();
    const data = await database.collection(req.params.collection).find({}).sort({ created_at: -1 }).limit(500).toArray();
    res.json({ data, error: null });
  } catch (error) {
    res.status(500).json({ data: null, error: error.message });
  }
});

app.listen(port, () => console.log(`Visit-web API listening on ${port}`));
