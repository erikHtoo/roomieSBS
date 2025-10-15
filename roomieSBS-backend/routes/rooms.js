const express = require("express");
const router = express.Router();
const supabase = require("../supabaseClient.js");
const authMiddleware = require("../middleware/authMiddleware.js");

// ============================
// CREATE (UploadRoom)
// ============================
router.post("/", authMiddleware.verifyAuth, async (req, res) => {
  try {
    const {
      description,
      rent,
      deposit,
      image_urls, // array of URLs
      address,
      contact, // object { facebook, zalo, viber }
      transfer_contract, // boolean
      remaining_contract, // number / null
      category,
      bedrooms,
      bathrooms,
      amenities, // array or object
    } = req.body;

    const remaining_contract_value =
      transfer_contract === true || transfer_contract === "true"
        ? remaining_contract || null
        : null;

    const { data, error } = await supabase
      .from("listings_table")
      .insert([
        {
          description,
          rent,
          deposit,
          image_urls: image_urls
            ? Array.isArray(image_urls)
              ? JSON.stringify(image_urls)
              : image_urls
            : JSON.stringify([]),
          address,
          contact:
            typeof contact === "object" ? JSON.stringify(contact) : contact,
          owner_id: req.user.id,
          transfer_contract,
          remaining_contract: remaining_contract_value,
          category,
          bedrooms,
          bathrooms,
          amenities: Array.isArray(amenities)
            ? JSON.stringify(amenities)
            : amenities,
        },
      ])
      .select("room_id, description, rent, deposit, address, category");

    if (error) throw error;
    res.status(201).json({ success: true, room: data[0] });
  } catch (err) {
    console.error("Error inserting room:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================
// READ (single room page)
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

    let parsedContact = data.contact;
    try {
      parsedContact =
        typeof data.contact === "string"
          ? JSON.parse(data.contact)
          : data.contact;
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
// READ ALL (listing page)
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
// READ for editing (only owner)
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

    if (error) throw error;
    if (!data)
      return res.status(404).json({ error: "Not found or not your listing" });

    let parsedContact = data.contact;
    try {
      parsedContact =
        typeof data.contact === "string"
          ? JSON.parse(data.contact)
          : data.contact;
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
      description,
      rent,
      deposit,
      image_urls,
      address,
      contact,
      transfer_contract,
      remaining_contract,
      category,
      bedrooms,
      bathrooms,
      amenities,
    } = req.body;

    const remaining_contract_value =
      transfer_contract === true || transfer_contract === "true"
        ? remaining_contract || null
        : null;

    const { data, error } = await supabase
      .from("listings_table")
      .update({
        description,
        rent,
        deposit,
        image_urls: Array.isArray(image_urls)
          ? JSON.stringify(image_urls)
          : image_urls,
        address,
        contact:
          typeof contact === "object" ? JSON.stringify(contact) : contact,
        transfer_contract,
        remaining_contract: remaining_contract_value,
        category,
        bedrooms,
        bathrooms,
        amenities: Array.isArray(amenities)
          ? JSON.stringify(amenities)
          : amenities,
      })
      .eq("room_id", id)
      .eq("owner_id", req.user.id)
      .select();

    if (error) throw error;
    if (!data || !data.length) {
      return res
        .status(404)
        .json({ success: false, error: "Not found or no permission" });
    }

    res.json({ success: true, room: data[0] });
  } catch (err) {
    console.error("Error updating room:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================
// UPDATE IMAGES ONLY
// ============================
router.put("/:id/images", authMiddleware.verifyAuth, async (req, res) => {
  const { id } = req.params;
  const { image_urls } = req.body;

  try {
    const { data, error } = await supabase
      .from("listings_table")
      .update({
        image_urls: Array.isArray(image_urls)
          ? JSON.stringify(image_urls)
          : image_urls,
      })
      .eq("room_id", id)
      .eq("owner_id", req.user.id)
      .select("room_id, image_urls");

    if (error) throw error;
    res.json({ success: true, room: data[0] });
  } catch (err) {
    console.error("Error updating room images:", err);
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
      return res
        .status(404)
        .json({ success: false, error: "Not found or no permission" });
    }

    res.json({ success: true, deleted: data[0] });
  } catch (err) {
    console.error("Error deleting room:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});
module.exports = router;
