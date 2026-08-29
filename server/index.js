import express from "express";
import cors from "cors";
import crypto from "node:crypto";
import { MongoClient, ObjectId } from "mongodb";

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));
const port = process.env.PORT || 3000;
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "visit_web";
const authSecret = process.env.AUTH_SECRET || "change-me";
let db;

async function getDb() {
  if (!uri) throw new Error("MONGODB_URI is not configured");
  if (!db) { const client = new MongoClient(uri); await client.connect(); db = client.db(dbName); }
  return db;
}
const hash = (value) => crypto.createHash("sha256").update(`${authSecret}:${value}`).digest("hex");
const makeToken = (id) => Buffer.from(JSON.stringify({ id, exp: Date.now() + 604800000 })).toString("base64url");
const readToken = (value) => { const data = JSON.parse(Buffer.from(value, "base64url").toString()); if (!data.id || data.exp < Date.now()) throw new Error("expired"); return data.id; };

app.get("/api/health", async (_req, res) => {
  try { const database = await getDb(); await database.command({ ping: 1 }); res.json({ ok: true, database: dbName }); }
  catch (error) { res.status(503).json({ ok: false, error: error.message }); }
});

app.post("/api/auth/signup", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    if (!email || password.length < 6) return res.status(400).json({ error: "Email and 6+ character password required" });
    const database = await getDb();
    if (await database.collection("users").findOne({ email })) return res.status(409).json({ error: "User already exists" });
    const result = await database.collection("users").insertOne({ email, password_hash: hash(password), created_at: new Date(), updated_at: new Date() });
    const id = result.insertedId.toString();
    await database.collection("profiles").insertOne({ user_id: id, email, credit_balance: 0, is_banned: false, created_at: new Date(), updated_at: new Date() });
    await database.collection("user_roles").insertOne({ user_id: id, role: "user", created_at: new Date() });
    res.status(201).json({ user: { id, email }, session: { access_token: makeToken(id) } });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post("/api/auth/signin", async (req, res) => {
  try {
    const database = await getDb();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const user = await database.collection("users").findOne({ email });
    if (!user || hash(req.body?.password || "") !== user.password_hash) return res.status(401).json({ error: "Invalid email or password" });
    res.json({ user: { id: user._id.toString(), email }, session: { access_token: makeToken(user._id.toString()) } });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get("/api/auth/session", async (req, res) => {
  try {
    const raw = String(req.headers.authorization || "").replace(/^Bearer\\s+/i, "");
    const id = readToken(raw);
    const database = await getDb();
    const user = await database.collection("users").findOne({ _id: new ObjectId(id) });
    if (!user) return res.status(401).json({ error: "User not found" });
    res.json({ user: { id, email: user.email }, session: { access_token: raw } });
  } catch { res.status(401).json({ error: "Invalid session" }); }
});

app.post("/api/auth/signout", (_req, res) => res.json({ ok: true }));

const collections = new Set(["profiles", "user_roles", "orders", "packages", "coupons", "credit_coupons", "payments", "announcements", "site_settings", "payment_methods", "coupon_uses", "coupon_redemption_attempts", "credit_transactions", "free_trial_uses"]);

app.all("/api/data/:collection", async (req, res) => {
  try {
    if (!collections.has(req.params.collection)) return res.status(404).json({ error: "Collection not found" });
    const database = await getDb();
    const collection = database.collection(req.params.collection);
    const body = req.body || {};
    if (req.method === "GET") {
      const data = await collection.find(body.filter || {}).sort(body.sort || { created_at: -1 }).limit(Math.min(Number(body.limit) || 500, 1000)).toArray();
      return res.json({ data, error: null });
    }
    if (req.method === "POST") {
      const doc = { ...(body.data || {}), created_at: new Date(), updated_at: new Date() };
      const result = await collection.insertOne(doc);
      return res.status(201).json({ data: { ...doc, id: result.insertedId.toString() }, error: null });
    }
    if (req.method === "PATCH") {
      const selector = body.id && ObjectId.isValid(body.id) ? { _id: new ObjectId(body.id) } : (body.filter || {});
      const result = await collection.updateMany(selector, { $set: { ...(body.data || {}), updated_at: new Date() } });
      return res.json({ data: null, count: result.modifiedCount, error: null });
    }
    if (req.method === "DELETE") {
      const selector = body.id && ObjectId.isValid(body.id) ? { _id: new ObjectId(body.id) } : (body.filter || {});
      const result = await collection.deleteMany(selector);
      return res.json({ data: null, count: result.deletedCount, error: null });
    }
    res.status(405).json({ error: "Method not allowed" });
  } catch (error) { res.status(500).json({ data: null, error: error.message }); }
});

app.listen(port, () => console.log(`Visit-web MongoDB API listening on ${port}`));
