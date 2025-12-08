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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
