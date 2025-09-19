// routes/rooms.js
const express = require("express");
const router = express.Router();
const supabase = require("../supabaseClient");

// GET all rooms
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("listings_table")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ rooms: data });
  } catch (err) {
    console.error("Error fetching rooms:", err);
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
});

module.exports = router;
