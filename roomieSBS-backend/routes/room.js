// backend/routes/room.js
const express = require("express");
const router = express.Router();
const supabase = require("../supabaseClient");

// ✅ Public GET single room (no auth required)
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from("listings_table")
      .select("*")
      .eq("room_id", id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Listing not found" });

    res.json({ room: data });
  } catch (err) {
    console.error("Error fetching room:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Public GET all rooms (homepage listings)
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
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
