const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');
const authmiddleWare = require('../middleware/authMiddleware.js');

// POST DATA FROM REACT FORM  IN src/UploadRoom.js
router.post('/', authmiddleWare.verifyAuth, async (req, res) => {
    console.log("Received data:", req.body);
    try {
        const {
        room_name,
        description,
        price,
        price_num,
        image_urls, // array of URLs
        address,
        contact,
        owner_id,
        preferred_gender,
        deposit,
        about
        } = req.body;

        // Insert into Supabase DB
        const { data, error } = await supabase
        .from("listings_table")
        .insert([
            {
            room_name,
            description,
            price,
            price_num,
            image_urls,
            address,
            contact,
            owner_id: req.user.id,
            preferred_gender,
            deposit,
            about
            }
        ])
        .select();

        if (error) throw error;

        res.status(201).json({ success: true, room: data[0] });
    } catch (err) {
        console.error("Error inserting room:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});


module.exports = router;