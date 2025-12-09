const express = require("express");
const router = express.Router();
const sanitizeHtml = require("sanitize-html");
const { body, validationResult } = require("express-validator");
const supabase = require("../supabaseClient.js");
const authMiddleware = require("../middleware/authMiddleware.js");

// Helper function to sanitize text fields
const sanitizeField = (text) => {
  if (!text) return text;
  return sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} }).trim();
};

// Helper function to validate URLs (only http/https)
const isValidUrl = (url) => {
  try {
    const u = new URL(url);
    return ["https:", "http:"].includes(u.protocol);
  } catch {
    return false;
  }
};

// ============================
// CREATE (UploadRoom)
// ============================
router.post(
  "/",
  authMiddleware.verifyAuth,
  [
    body("description")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 1200 })
      .withMessage("description must not exceed 1200 characters"),
    body("rent")
      .exists()
      .withMessage("rent is required")
      .isNumeric()
      .withMessage("rent must be a number")
      .custom((value) => {
        const num = parseFloat(value);
        if (num < 0 || num > 999999999) {
          throw new Error("rent must be between 0 and 999,999,999");
        }
        return true;
      }),
    body("deposit")
      .optional()
      .isNumeric()
      .withMessage("deposit must be a number")
      .custom((value) => {
        if (value !== undefined && value !== "") {
          const num = parseFloat(value);
          if (num < 0 || num > 999999999) {
            throw new Error("deposit must be between 0 and 999,999,999");
          }
        }
        return true;
      }),
    body("address")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage("address must not exceed 500 characters"),
    body("contact").optional(),
    body("contact.zalo")
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 200 })
      .withMessage("zalo contact must not exceed 200 characters"),
    body("contact.facebook")
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 200 })
      .withMessage("facebook contact must not exceed 200 characters"),
    body("contact.viber")
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 200 })
      .withMessage("viber contact must not exceed 200 characters"),
    body("transfer_contract").optional().toBoolean().isBoolean(),
    body("remaining_contract")
      .optional()
      .custom((value, { req }) => {
        if (
          req.body.transfer_contract === true ||
          req.body.transfer_contract === "true"
        ) {
          if (value !== undefined && value !== null && value !== "") {
            if (isNaN(parseFloat(value))) {
              throw new Error(
                "remaining_contract must be a valid number when transfer_contract is true"
              );
            }
          }
        }
        return true;
      }),
    body("category")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 100 })
      .withMessage("category must not exceed 100 characters"),
    body("bedrooms").optional().isNumeric(),
    body("bathrooms").optional().isNumeric(),
    body("image_urls")
      .optional()
      .isArray()
      .withMessage("image_urls must be an array")
      .custom((value) => {
        if (Array.isArray(value)) {
          for (let url of value) {
            if (!isValidUrl(url)) {
              throw new Error(
                "each image URL must be a valid http or https URL"
              );
            }
          }
        }
        return true;
      }),
    body("amenities")
      .optional()
      .isArray()
      .withMessage("amenities must be an array")
      .custom((value) => {
        if (Array.isArray(value)) {
          for (let item of value) {
            if (typeof item !== "string") {
              throw new Error("each amenity must be a string");
            }
            if (item.length > 100) {
              throw new Error("each amenity must not exceed 100 characters");
            }
          }
        }
        return true;
      }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorArray = errors.array();
      let hasRentDepositError = errorArray.some(
        (e) => e.path === "rent" || e.path === "deposit"
      );

      if (hasRentDepositError) {
        return res.status(400).json({
          success: false,
          errors: errorArray,
          message: "Please enter the correct rent and deposit values",
        });
      }

      return res.status(400).json({ success: false, errors: errorArray });
    }

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

      // Sanitize category and amenities to prevent XSS
      const sanitizedCategory = sanitizeField(category);
      const sanitizedAmenities = Array.isArray(amenities)
        ? amenities.map((a) => sanitizeField(a))
        : amenities;

      // Filter and validate image URLs (only http/https)
      const cleanImages = Array.isArray(image_urls)
        ? image_urls.filter(isValidUrl)
        : [];

      const { data, error } = await supabase
        .from("listings_table")
        .insert([
          {
            description: sanitizeField(description),
            rent,
            deposit,
            image_urls: Array.isArray(cleanImages)
              ? JSON.stringify(cleanImages)
              : JSON.stringify([]),
            address: sanitizeField(address),
            contact:
              typeof contact === "object"
                ? JSON.stringify({
                    zalo: sanitizeField(contact.zalo),
                    facebook: sanitizeField(contact.facebook),
                    viber: sanitizeField(contact.viber),
                  })
                : sanitizeField(contact),
            owner_id: req.user.id,
            transfer_contract,
            remaining_contract: remaining_contract_value,
            category: sanitizedCategory,
            bedrooms,
            bathrooms,
            amenities: Array.isArray(sanitizedAmenities)
              ? JSON.stringify(sanitizedAmenities)
              : sanitizedAmenities,
          },
        ])
        .select("room_id, description, rent, deposit, address, category");

      if (error) throw error;
      res.status(201).json({ success: true, room: data[0] });
    } catch (err) {
      console.error("Error inserting room:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

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

    // Parse each listing's JSON fields
    const parsedRooms = data.map((r) => ({
      ...r,
      contact: tryParse(r.contact, {}),
      image_urls: tryParse(r.image_urls, []),
      amenities: tryParse(r.amenities, []),
    }));

    res.json({ rooms: parsedRooms });
  } catch (err) {
    console.error("Error fetching rooms:", err);
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
});

// ============================
// Helper: safe JSON parse
// ============================
function tryParse(value, fallback) {
  if (!value) return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

// ============================
// READ for editing (only owner) - MUST BE BEFORE /:id
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

    if (error) {
      if (error.code === "PGRST116") {
        // No row found
        return res.status(403).json({
          success: false,
          error:
            "You don't have permission to edit this room or it doesn't exist",
        });
      }
      throw error;
    }

    if (!data) {
      return res.status(403).json({
        success: false,
        error:
          "You don't have permission to edit this room or it doesn't exist",
      });
    }

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

    // Parse contact, images, amenities safely
    const parsed = {
      ...data,
      contact: tryParse(data.contact, {}),
      image_urls: tryParse(data.image_urls, []),
      amenities: tryParse(data.amenities, []),
    };

    res.json({ room: parsed });
  } catch (err) {
    console.error("Error fetching room:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============================
// UPDATE (EditRoom)
// ============================
router.put(
  "/:id",
  authMiddleware.verifyAuth,
  [
    body("description")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 1200 })
      .withMessage("description must not exceed 1200 characters"),
    body("rent")
      .optional()
      .isNumeric()
      .withMessage("rent must be a number")
      .custom((value) => {
        if (value !== undefined && value !== "") {
          const num = parseFloat(value);
          if (num < 0 || num > 999999999) {
            throw new Error("rent must be between 0 and 999,999,999");
          }
        }
        return true;
      }),
    body("deposit")
      .optional()
      .isNumeric()
      .withMessage("deposit must be a number")
      .custom((value) => {
        if (value !== undefined && value !== "") {
          const num = parseFloat(value);
          if (num < 0 || num > 999999999) {
            throw new Error("deposit must be between 0 and 999,999,999");
          }
        }
        return true;
      }),
    body("address")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage("address must not exceed 500 characters"),
    body("contact").optional(),
    body("contact.zalo")
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 200 })
      .withMessage("zalo contact must not exceed 200 characters"),
    body("contact.facebook")
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 200 })
      .withMessage("facebook contact must not exceed 200 characters"),
    body("contact.viber")
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 200 })
      .withMessage("viber contact must not exceed 200 characters"),
    body("transfer_contract").optional().toBoolean().isBoolean(),
    body("remaining_contract")
      .optional()
      .custom((value, { req }) => {
        if (
          req.body.transfer_contract === true ||
          req.body.transfer_contract === "true"
        ) {
          if (value !== undefined && value !== null && value !== "") {
            if (isNaN(parseFloat(value))) {
              throw new Error(
                "remaining_contract must be a valid number when transfer_contract is true"
              );
            }
          }
        }
        return true;
      }),
    body("category")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 100 })
      .withMessage("category must not exceed 100 characters"),
    body("bedrooms").optional().isNumeric(),
    body("bathrooms").optional().isNumeric(),
    body("image_urls")
      .optional()
      .isArray()
      .withMessage("image_urls must be an array")
      .custom((value) => {
        if (Array.isArray(value)) {
          for (let url of value) {
            if (!isValidUrl(url)) {
              throw new Error(
                "each image URL must be a valid http or https URL"
              );
            }
          }
        }
        return true;
      }),
    body("amenities")
      .optional()
      .isArray()
      .withMessage("amenities must be an array")
      .custom((value) => {
        if (Array.isArray(value)) {
          for (let item of value) {
            if (typeof item !== "string") {
              throw new Error("each amenity must be a string");
            }
            if (item.length > 100) {
              throw new Error("each amenity must not exceed 100 characters");
            }
          }
        }
        return true;
      }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorArray = errors.array();
      let hasRentDepositError = errorArray.some(
        (e) => e.path === "rent" || e.path === "deposit"
      );

      if (hasRentDepositError) {
        return res.status(400).json({
          success: false,
          errors: errorArray,
          message: "Please enter the correct rent and deposit values",
        });
      }

      return res.status(400).json({ success: false, errors: errorArray });
    }

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

      // Sanitize text fields to prevent XSS
      const sanitizedDescription = sanitizeField(description);
      const sanitizedAddress = sanitizeField(address);
      const sanitizedCategory = sanitizeField(category);
      const sanitizedAmenities = Array.isArray(amenities)
        ? amenities.map((a) => sanitizeField(a))
        : amenities;
      const sanitizedContact = contact
        ? {
            zalo: contact.zalo ? sanitizeField(contact.zalo) : "",
            facebook: contact.facebook ? sanitizeField(contact.facebook) : "",
            viber: contact.viber ? sanitizeField(contact.viber) : "",
          }
        : {};

      // Filter and validate image URLs (only http/https)
      const cleanImages = Array.isArray(image_urls)
        ? image_urls.filter(isValidUrl)
        : undefined;

      const { data, error } = await supabase
        .from("listings_table")
        .update({
          description: sanitizedDescription,
          rent,
          deposit,
          image_urls: cleanImages ? JSON.stringify(cleanImages) : image_urls,
          address: sanitizedAddress,
          contact:
            typeof sanitizedContact === "object"
              ? JSON.stringify(sanitizedContact)
              : sanitizedContact,
          transfer_contract,
          remaining_contract: remaining_contract_value,
          category: sanitizedCategory,
          bedrooms,
          bathrooms,
          amenities: Array.isArray(sanitizedAmenities)
            ? JSON.stringify(sanitizedAmenities)
            : sanitizedAmenities,
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
  }
);

// ============================
// UPDATE IMAGES ONLY
// ============================
router.put("/:id/images", authMiddleware.verifyAuth, async (req, res) => {
  const { id } = req.params;
  const { image_urls } = req.body;

  try {
    // Filter URLs to allow only http/https (prevent javascript:, data:, etc.)
    const cleanImages = Array.isArray(image_urls)
      ? image_urls.filter(isValidUrl)
      : [];

    const { data, error } = await supabase
      .from("listings_table")
      .update({
        image_urls: Array.isArray(cleanImages)
          ? JSON.stringify(cleanImages)
          : JSON.stringify([]),
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
