const cors = require("cors");
const dotenv = require("dotenv");
const supabase = require("./supabaseClient.js");

dotenv.config();

const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const app = express();
const PORT = process.env.PORT || 5000;
app.disable("x-powered-by");
app.set("trust proxy", 1);

// CORS must run before other middlewares so all responses include headers
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Origin not allowed"));
    },
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Authorization", "Content-Type"],
    maxAge: 86400,
  }),
);
// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "same-site" },
  }),
);
// General abuse protection. Stricter write limits are applied below.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 300 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many requests. Try again later." },
});
app.use(limiter);
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 30 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => ["GET", "HEAD", "OPTIONS"].includes(req.method),
  message: { success: false, error: "Too many changes. Try again later." },
});
app.use(writeLimiter);
// Compress responses (prefer JSON)
app.use(
  compression({
    threshold: 0,
  }),
);
// Body size limits to protect against large payloads
app.use(express.json({ limit: "128kb", strict: true }));
app.use(express.urlencoded({ limit: "128kb", extended: false }));

// Room routes
const roomRoutes = require("./routes/rooms.js");
app.use("/rooms", roomRoutes);

// Roommate profile routes
const roommatesRouter = require("./routes/roommateProfiles");
app.use("/roommates", roommatesRouter);

// Exchange rate route
const exchangeRoutes = require("./routes/exchange.js");
app.use("/exchange", exchangeRoutes);

// Explicit health check for uptime monitors
app.get("/health", (req, res) => {
  res.status(200).json({ success: true, status: "ok" });
});

app.head("/health", (req, res) => {
  res.sendStatus(200);
});

// Dependency-aware readiness check for deploys and incident diagnosis.
app.get("/ready", async (req, res) => {
  try {
    const { error } = await supabase.from("exchange").select("rate").limit(1);
    if (error) throw error;
    res.status(200).json({ success: true, status: "ready" });
  } catch (error) {
    console.error("Readiness check failed:", error.message);
    res.status(503).json({ success: false, status: "dependency_unavailable" });
  }
});

// ============================
// Global Error Handling Middleware
// ============================
app.use((err, req, res, next) => {
  // Log full error with stack trace for debugging
  console.error("=== ERROR ===");
  console.error("Timestamp:", new Date().toISOString());
  console.error("Method:", req.method);
  console.error("URL:", req.url);
  console.error("Status:", err.status || 500);
  console.error("Message:", err.message);
  console.error("Stack:", err.stack);
  console.error("===============");

  // Send clean message to user (no internal details)
  const statusCode = err.message === "Origin not allowed" ? 403 : err.status || 500;
  const userMessage =
    statusCode === 500
      ? "Internal server error. Please try again later."
      : err.message || "An error occurred";

  res.status(statusCode).json({
    success: false,
    error: userMessage,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }), // Only expose stack in dev
  });
});

// 404 handler (must be after all routes)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
