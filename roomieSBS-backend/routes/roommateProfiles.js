const express = require("express");
const router = express.Router();
const supabase = require("../supabaseClient");
const authMiddleware = require("../middleware/authMiddleware");

// ============================
// GET current user's profile
// ============================
router.get("/", authMiddleware.verifyAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("roommates_table")
      .select("*")
      .eq("id", req.user.id)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    res.json({ profile: data || null });
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============================
// GET all profiles (for explore page)
// ============================
router.get("/all", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("roommates_table")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ profiles: data });
  } catch (err) {
    console.error("Error fetching all profiles:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============================
// GET profile by ID (view another roommate)
// ============================
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("roommates_table")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    res.json({ profile: data });
  } catch (err) {
    console.error("Error fetching profile by id:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============================
// POST (Create new profile)
// ============================
router.post("/", authMiddleware.verifyAuth, async (req, res) => {
  try {
    const {
      person_image_urls,
      person_name,
      person_gender,
      person_budget,
      person_preferred_location,
      person_about,
      person_contact,
      person_friends,
      person_traits,
    } = req.body;

    const { data, error } = await supabase
      .from("roommates_table")
      .insert([
        {
          id: req.user.id,
          person_image_urls,
          person_name,
          person_gender,
          person_budget,
          person_preferred_location,
          person_about,
          person_contact:
            typeof person_contact === "object"
              ? JSON.stringify(person_contact)
              : person_contact,
          person_friends: person_friends
            ? JSON.stringify(person_friends)
            : null,
          person_traits: person_traits ? JSON.stringify(person_traits) : null,
          person_active: true,
        },
      ])
      .select();

    if (error) throw error;

    res.status(201).json({ success: true, roommate: data[0] });
  } catch (err) {
    console.error("Error inserting roommate profile:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================
// PUT (Update profile)
// ============================
router.put("/", authMiddleware.verifyAuth, async (req, res) => {
  try {
    const {
      person_image_urls,
      person_name,
      person_gender,
      person_budget,
      person_preferred_location,
      person_about,
      person_contact,
      person_friends,
      person_traits,
      person_active,
    } = req.body;

    const { data, error } = await supabase
      .from("roommates_table")
      .update({
        person_image_urls,
        person_name,
        person_gender,
        person_budget,
        person_preferred_location,
        person_about,
        person_contact:
          typeof person_contact === "object"
            ? JSON.stringify(person_contact)
            : person_contact,
        person_friends: person_friends ? JSON.stringify(person_friends) : null,
        person_traits: person_traits ? JSON.stringify(person_traits) : null,
        person_active: person_active !== undefined ? person_active : true,
      })
      .eq("id", req.user.id)
      .select();

    if (error) throw error;
    res.json({ success: true, profile: data[0] });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================
// DELETE (Remove profile)
// ============================
router.delete("/", authMiddleware.verifyAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("roommates_table")
      .delete()
      .eq("id", req.user.id)
      .select();

    if (error) throw error;

    res.json({ success: true, deletedProfile: data[0] });
  } catch (err) {
    console.error("Error deleting profile:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
