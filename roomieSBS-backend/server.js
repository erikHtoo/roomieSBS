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

// CORS must run before other middlewares so all responses include headers
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  })
);
// Security headers
app.use(helmet());
// Rate limiting: allow higher throughput for local dev, and ensure 429 includes CORS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // dev: raise limit to avoid accidental 429s
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);
// Compress responses (prefer JSON)
app.use(
  compression({
    threshold: 0,
  })
);
// Body size limits to protect against large payloads
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ limit: "1mb", extended: true }));

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
  const statusCode = err.status || 500;
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
