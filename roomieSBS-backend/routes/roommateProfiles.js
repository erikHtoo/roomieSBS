const express = require("express");
const router = express.Router();
const supabase = require("../supabaseClient");
const authMiddleware = require("../middleware/authMiddleware");
const { body, validationResult } = require("express-validator");
const sanitizeHtml = require("sanitize-html");
const {
  isOwnedStorageImageUrl,
  removeOwnedStorageImages,
} = require("../utils/storageImages");

// Helper function to sanitize text fields and prevent XSS
const sanitizeField = (text) =>
  sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} }).trim();

const profileValidators = [
  body("person_image_urls")
    .optional()
    .isArray({ max: 8 })
    .withMessage("no more than 8 profile images are allowed")
    .custom((urls, { req }) =>
      urls.every((url) =>
        isOwnedStorageImageUrl(url, "roommate-images", req.user.id),
      ),
    )
    .withMessage("profile images must belong to the signed-in user's uploads"),
  body("person_name").optional().isString().trim().isLength({ min: 1, max: 100 }),
  body("person_gender").optional().toBoolean().isBoolean(),
  body("person_budget")
    .optional()
    .isFloat({ min: 0, max: 999999999 })
    .withMessage("person_budget must be between 0 and 999,999,999"),
  body("person_preferred_location").optional().isString().trim().isLength({ max: 200 }),
  body("person_about").optional().isString().trim().isLength({ max: 1200 }),
  body("person_contact").optional().isObject(),
  body("person_contact.zalo").optional({ checkFalsy: true }).isString().trim().isLength({ max: 200 }),
  body("person_contact.facebook").optional({ checkFalsy: true }).isString().trim().isLength({ max: 200 }),
  body("person_contact.viber").optional({ checkFalsy: true }).isString().trim().isLength({ max: 200 }),
  body("person_friends").optional().isArray({ max: 5 }),
  body("person_friends.*.name").optional().isString().trim().isLength({ min: 1, max: 100 }),
  body("person_friends.*.gender").optional().isString().trim().isLength({ max: 30 }),
  body("person_traits").optional().isArray({ max: 12 }),
  body("person_traits.*").optional().isString().trim().isLength({ max: 60 }),
];

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
    console.error("Error fetching profile:", err.message);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// ============================
// GET all profiles (for explore page)
// ============================
router.get("/all", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("roommates_table")
      .select(
        "id, person_image_urls, person_name, person_gender, person_budget, person_preferred_location, person_about, person_friends, person_traits, person_active, created_at",
      )
      .eq("person_active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ profiles: data });
  } catch (err) {
    console.error("Error fetching all profiles:", err.message);
    res.status(500).json({ error: "Failed to fetch profiles" });
  }
});

// ============================
// GET profile by ID (view another roommate)
// ============================
router.get("/:id", authMiddleware.verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("roommates_table")
      .select("*")
      .eq("id", id)
      .single();

    if (error?.code === "PGRST116") {
      return res.status(404).json({ error: "Profile not found" });
    }
    if (error) throw error;

    res.json({ profile: data });
  } catch (err) {
    console.error("Error fetching profile by id:", err.message);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// ============================
// POST (Create new profile)
// ============================
router.post(
  "/",
  authMiddleware.verifyAuth,
  [body("person_name").exists().withMessage("person_name is required"), ...profileValidators],
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
            name: friend.name ? sanitizeField(friend.name) : "",
            gender: friend.gender ? sanitizeField(friend.gender) : "",
          }))
        : null;

      const sanitizedTraits = person_traits?.map((trait) => sanitizeField(trait));

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
            person_traits: sanitizedTraits || null,
            person_active: true,
          },
        ])
        .select();

      if (error) throw error;

      res.status(201).json({ success: true, roommate: data[0] });
    } catch (err) {
      console.error("Error inserting roommate profile:", err.message);
      res.status(500).json({ success: false, error: "Failed to create profile" });
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
    ...profileValidators,
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
              name: friend.name ? sanitizeField(friend.name) : "",
              gender: friend.gender ? sanitizeField(friend.gender) : "",
            }))
          : null;
        updatePayload.person_friends = sanitizedFriends || null;
      }
      if (person_traits !== undefined)
        updatePayload.person_traits =
          person_traits?.map((trait) => sanitizeField(trait)) || null;
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
      console.error("Error updating profile:", err.message);
      res.status(500).json({ success: false, error: "Failed to update profile" });
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

    if (data[0]) {
      await removeOwnedStorageImages(
        supabase,
        "roommate-images",
        data[0].person_image_urls,
        req.user.id,
      );
    }

    res.json({ success: true, deletedProfile: data[0] });
  } catch (err) {
    console.error("Error deleting profile:", err.message);
    res.status(500).json({ success: false, error: "Failed to delete profile" });
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
    console.error("Error updating active status:", err.message);
    res.status(500).json({ success: false, error: "Failed to update profile status" });
  }
});

module.exports = router;
