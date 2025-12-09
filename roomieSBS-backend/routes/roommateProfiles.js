const express = require("express");
const router = express.Router();
const supabase = require("../supabaseClient");
const authMiddleware = require("../middleware/authMiddleware");
const { body, validationResult } = require("express-validator");
const sanitizeHtml = require("sanitize-html");

// Helper function to sanitize text fields and prevent XSS
const sanitizeField = (text) =>
  sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} }).trim();

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
router.post(
  "/",
  authMiddleware.verifyAuth,
  [
    body("person_name")
      .exists()
      .withMessage("person_name is required")
      .isString(),
    body("person_gender").optional().toBoolean().isBoolean(),
    body("person_budget")
      .optional()
      .isNumeric()
      .withMessage("person_budget must be a number"),
    body("person_preferred_location").optional().isString(),
    body("person_about").optional().isString(),
    body("person_contact").optional(),
    body("person_contact.zalo")
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 200 })
      .withMessage("zalo contact must not exceed 200 characters"),
    body("person_contact.facebook")
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 200 })
      .withMessage("facebook contact must not exceed 200 characters"),
    body("person_contact.viber")
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 200 })
      .withMessage("viber contact must not exceed 200 characters"),
    body("person_friends")
      .optional()
      .isArray()
      .withMessage("person_friends must be an array"),
    body("person_traits")
      .optional()
      .isArray()
      .withMessage("person_traits must be an array"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, errors: errors.array() });
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

      // Sanitize text fields to prevent XSS
      const sanitizedName = sanitizeField(person_name);
      const sanitizedAbout = person_about ? sanitizeField(person_about) : "";
      const sanitizedLocation = person_preferred_location
        ? sanitizeField(person_preferred_location)
        : "";
      const sanitizedContact = person_contact
        ? {
            zalo: person_contact.zalo ? sanitizeField(person_contact.zalo) : "",
            facebook: person_contact.facebook
              ? sanitizeField(person_contact.facebook)
              : "",
            viber: person_contact.viber
              ? sanitizeField(person_contact.viber)
              : "",
          }
        : {};

      // Sanitize friend names
      const sanitizedFriends = person_friends
        ? person_friends.map((friend) => ({
            ...friend,
            name: friend.name ? sanitizeField(friend.name) : "",
          }))
        : null;

      const { data, error } = await supabase
        .from("roommates_table")
        .insert([
          {
            id: req.user.id,
            person_image_urls,
            person_name: sanitizedName,
            person_gender,
            person_budget,
            person_preferred_location: sanitizedLocation,
            person_about: sanitizedAbout,
            person_contact:
              typeof sanitizedContact === "object"
                ? JSON.stringify(sanitizedContact)
                : sanitizedContact,
            person_friends: sanitizedFriends || null,
            person_traits: person_traits || null,
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
  }
);

// ============================
// PUT (Update profile)
// ============================
router.put(
  "/",
  authMiddleware.verifyAuth,
  [
    body("person_name").optional().isString(),
    body("person_gender").optional().toBoolean().isBoolean(),
    body("person_budget")
      .optional()
      .isNumeric()
      .withMessage("person_budget must be a number"),
    body("person_preferred_location").optional().isString(),
    body("person_about").optional().isString(),
    body("person_contact").optional(),
    body("person_contact.zalo")
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 200 })
      .withMessage("zalo contact must not exceed 200 characters"),
    body("person_contact.facebook")
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 200 })
      .withMessage("facebook contact must not exceed 200 characters"),
    body("person_contact.viber")
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 200 })
      .withMessage("viber contact must not exceed 200 characters"),
    body("person_friends")
      .optional()
      .isArray()
      .withMessage("person_friends must be an array"),
    body("person_traits")
      .optional()
      .isArray()
      .withMessage("person_traits must be an array"),
    body("person_active")
      .optional()
      .toBoolean()
      .isBoolean()
      .withMessage("person_active must be boolean"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, errors: errors.array() });
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

      // Build update payload only with provided fields to avoid accidental overwrites
      const updatePayload = {};
      if (person_image_urls !== undefined)
        updatePayload.person_image_urls = person_image_urls;
      if (person_name !== undefined)
        updatePayload.person_name = sanitizeField(person_name);
      if (person_gender !== undefined)
        updatePayload.person_gender = person_gender;
      if (person_budget !== undefined)
        updatePayload.person_budget = person_budget;
      if (person_preferred_location !== undefined)
        updatePayload.person_preferred_location = sanitizeField(
          person_preferred_location
        );
      if (person_about !== undefined)
        updatePayload.person_about = sanitizeField(person_about);
      if (person_contact !== undefined) {
        const sanitizedContact = person_contact
          ? {
              zalo: person_contact.zalo
                ? sanitizeField(person_contact.zalo)
                : "",
              facebook: person_contact.facebook
                ? sanitizeField(person_contact.facebook)
                : "",
              viber: person_contact.viber
                ? sanitizeField(person_contact.viber)
                : "",
            }
          : {};
        updatePayload.person_contact =
          typeof sanitizedContact === "object"
            ? JSON.stringify(sanitizedContact)
            : sanitizedContact;
      }
      if (person_friends !== undefined) {
        const sanitizedFriends = person_friends
          ? person_friends.map((friend) => ({
              ...friend,
              name: friend.name ? sanitizeField(friend.name) : "",
            }))
          : null;
        updatePayload.person_friends = sanitizedFriends || null;
      }
      if (person_traits !== undefined)
        updatePayload.person_traits = person_traits || null;
      if (person_active !== undefined)
        updatePayload.person_active = person_active;

      if (Object.keys(updatePayload).length === 0) {
        return res.status(400).json({
          success: false,
          error: "No valid fields provided for update",
        });
      }

      const { data, error } = await supabase
        .from("roommates_table")
        .update(updatePayload)
        .eq("id", req.user.id)
        .select();

      if (error) throw error;
      res.json({ success: true, profile: data[0] });
    } catch (err) {
      console.error("Error updating profile:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

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

// ============================
// PATCH (Toggle Active Status)
// ============================
router.patch("/", authMiddleware.verifyAuth, async (req, res) => {
  try {
    const { person_active } = req.body;

    if (typeof person_active !== "boolean") {
      return res
        .status(400)
        .json({ success: false, error: "person_active must be boolean" });
    }

    const { data, error } = await supabase
      .from("roommates_table")
      .update({ person_active })
      .eq("id", req.user.id)
      .select();

    if (error) throw error;

    res.json({ success: true, updatedProfile: data[0] });
  } catch (err) {
    console.error("Error updating active status:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
