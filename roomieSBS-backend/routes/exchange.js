// routes/exchange.js
const express = require("express");
const router = express.Router();
const supabase = require("../supabaseClient.js");

// GET latest exchange rate
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("exchange")
      .select("rate, last_update")
      .order("last_update", { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("Error fetching exchange rate:", err.message);
    res.status(500).json({ error: "Failed to fetch exchange rate" });
  }
});

module.exports = router;
