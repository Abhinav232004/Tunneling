// server.js - Simple backend server for DigitalOcean GUI Launcher
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API endpoint to provide configuration to frontend
app.get('/api/config', (req, res) => {
  res.json({
    apiToken: process.env.DIGITALOCEAN_API_TOKEN,
    vncPassword: process.env.VNC_PASSWORD
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});
