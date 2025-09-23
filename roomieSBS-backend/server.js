const cors = require('cors');
const dotenv = require('dotenv');
const supabase = require('./supabaseClient.js');

dotenv.config();

const express = require('express');
const app = express();  
const PORT = process.env.PORT || 5000;

// app.use(cors({ origin: 'https://frontend.example' }));
app.use(cors());
app.use(express.json());

// Room routes
const roomRoutes = require("./routes/rooms.js");
app.use("/rooms", roomRoutes);

// Roommate profile routes
const roommatesRouter = require('./routes/roommateProfiles');
app.use('/roommates', roommatesRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

