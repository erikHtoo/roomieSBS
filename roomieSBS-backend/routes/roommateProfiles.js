const express = require("express");
const router = express.Router();
const supabase = require("../supabaseClient");
const authmiddleWare = require("../middleware/authMiddleware");

// GET current profile (check if user already has one)
router.get("/", authmiddleWare.verifyAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("roommates_table")
      .select("*")
      .eq("id", req.user.id)
      .single();

    if (error && error.code !== "PGRST116") throw error; // not found error code
    res.json({ profile: data || null });
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET all profiles (for home page)
router.get("/all", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("roommates_table")
      .select("*");

    if (error) throw error;
    res.json({ profiles: data });
  } catch (err) {
    console.error("Error fetching all profiles:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET profile by id (for roommate page)
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

// POST (create new profile)
router.post("/", authmiddleWare.verifyAuth, async (req, res) => {
  try {
    const {
      person_image_urls,
      person_name,
      person_gender,
      person_budget,
      person_preferred_location,
      person_about,
      person_contact,
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
          person_contact,
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

// PUT (update profile)
router.put("/", authmiddleWare.verifyAuth, async (req, res) => {
  try {
    const {
      person_image_urls,
      person_name,
      person_gender,
      person_budget,
      person_preferred_location,
      person_about,
      person_contact,
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
        person_contact,
      })
      .eq("id", req.user.id)
      .select();

    if (error) throw error;

    res.json({ profile: data[0] });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE (remove profile)
router.delete("/:id", authmiddleWare.verifyAuth, async (req, res) => {
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
