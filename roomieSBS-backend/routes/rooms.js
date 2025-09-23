const express = require("express");
const router = express.Router();
const supabase = require("../supabaseClient.js");
const authMiddleware = require("../middleware/authMiddleware.js");

// ============================
// CREATE (UploadRoom)
// ============================
router.post("/", authMiddleware.verifyAuth, async (req, res) => {
  console.log("Received data:", req.body);

  try {
    const {
      room_name,
      description,
      price,
      deposit,
      image_urls, // array of URLs
      address,
      contact, // JSON string or object { facebook, zalo, viber }
      transfer_contract, // boolean
      remaining_contract, // number / null
    } = req.body;

    // Ensure remaining_contract is only set if transfer_contract is true
    const remaining_contract_value =
      transfer_contract === true || transfer_contract === "true"
        ? remaining_contract || null
        : null;

    const { data, error } = await supabase
      .from("listings_table")
      .insert([
        {
          room_name,
          description,
          price,
          price_num: price ? parseInt(price.toString().replace(/,/g, ""), 10) : null,
          deposit,
          image_urls,
          address,
          contact: typeof contact === "object" ? JSON.stringify(contact) : contact,
          owner_id: req.user.id,
          transfer_contract,
          remaining_contract: remaining_contract_value,
        },
      ])
      .select();

    if (error) throw error;
    res.status(201).json({ success: true, room: data[0] });
  } catch (err) {
    console.error("Error inserting room:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================
// READ room for room page
// ============================
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

    // Parse contact JSON string before sending to frontend
    let parsedContact = data.contact;
    try {
      parsedContact =
        typeof data.contact === "string" ? JSON.parse(data.contact) : data.contact;
    } catch {
      parsedContact = {};
    }

    res.json({ room: { ...data, contact: parsedContact } });
  } catch (err) {
    console.error("Error fetching room:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============================
// get all room (listing page)
// ============================
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

// ============================
// GET room for editing (only owner)
// ============================
router.get("/edit/:id", authMiddleware.verifyAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from("listings_table")
      .select("*")
      .eq("room_id", id)
      .eq("owner_id", req.user.id)
      .single();
    console.log("Fetched room for edit:", data);
    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Not found or not your listing" });

    // Parse contact JSON safely
    let parsedContact = data.contact;
    try {
      parsedContact =
        typeof data.contact === "string" ? JSON.parse(data.contact) : data.contact;
    } catch {
      parsedContact = {};
    }

    res.json({ room: { ...data, contact: parsedContact } });
  } catch (err) {
    console.error("Error fetching editable room:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============================
// UPDATE (EditRoom)
// ============================
router.put("/:id", authMiddleware.verifyAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const {
      room_name,
      description,
      price,
      deposit,
      image_urls,
      address,
      contact,
      transfer_contract,
      remaining_contract,
    } = req.body;

    const remaining_contract_value =
      transfer_contract === true || transfer_contract === "true"
        ? remaining_contract || null
        : null;

    const { data, error } = await supabase
      .from("listings_table")
      .update({
        room_name,
        description,
        price,
        deposit,
        image_urls,
        address,
        contact: typeof contact === "object" ? JSON.stringify(contact) : contact,
        transfer_contract,
        remaining_contract: remaining_contract_value,
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

// ============================
// DELETE
// ============================
router.delete("/:id", authMiddleware.verifyAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from("listings_table")
      .delete()
      .eq("room_id", id)
      .eq("owner_id", req.user.id)
      .select();

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
