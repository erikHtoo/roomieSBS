const cors = require('cors');
const dotenv = require('dotenv');
const supabase = require('./supabaseClient.js');

dotenv.config();

const express = require('express');
const app = express();  
const PORT = process.env.PORT || 5000;

// app.use(cors({ origin: 'https://your-frontend.example' }));
app.use(cors());
app.use(express.json());

// IMPORT ROUTES
const roomRoutes = require("./routes/room");
app.use("/room", roomRoutes);
const roomsRoute = require("./routes/rooms.js");
app.use("/rooms", roomsRoute);
const postingRoute = require('./routes/posting.js');
app.use('/posting', postingRoute);
const editingRoute = require('./routes/editing.js');
app.use('/edit', editingRoute);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

