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

// app.use(cors({ origin: 'https://frontend.example' }));
// Security headers
app.use(helmet());
// Rate limiting: 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);
// Compress responses (prefer JSON)
app.use(
  compression({
    threshold: 0, // compress everything
  })
);
app.use(cors());
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
