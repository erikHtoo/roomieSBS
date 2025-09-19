const express = require("express");
const router = express.Router();
const supabase = require("../supabaseClient");
const authMiddleware = require("../middleware/authMiddleware.js");

// GET single listing (for EditRoom prefill)
router.get("/:id", authMiddleware.verifyAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from("listings_table")
      .select("*")
      .eq("room_id", id)
      .eq("owner_id", req.user.id) // only fetch own listing
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Listing not found" });

    res.json({ room: data });
  } catch (err) {
    console.error("Error fetching room:", err);
    res.status(500).json({ error: err.message });
  }
});

// PUT update listing
router.put("/:id", authMiddleware.verifyAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const {
      room_name,
      description,
      price,
      price_num,
      image_urls,
      address,
      contact,
      preferred_gender,
      deposit,
      about
    } = req.body;

    const { data, error } = await supabase
      .from("listings_table")
      .update({
        room_name,
        description,
        price,
        price_num,
        image_urls,
        address,
        contact,
        preferred_gender,
        deposit,
        about
      })
      .eq("room_id", id)
      .eq("owner_id", req.user.id)
      .select();

    if (error) throw error;
    if (!data || !data.length) {
      return res.status(404).json({ success: false, error: "Not found or no permission" });
    }


    res.json({ success: true, room: data[0] });
  } catch (err) {
    console.error("Error updating room:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE listing
router.delete("/:id", authMiddleware.verifyAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from("listings_table")
      .delete()
      .eq("room_id", id)
      .eq("owner_id", req.user.id)
      .select(); // optional, returns deleted rows

    if (error) throw error;
    if (!data.length) {
      return res.status(404).json({ success: false, error: "Not found or no permission" });
    }

    res.json({ success: true, deleted: data[0] });
  } catch (err) {
    console.error("Error deleting room:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
