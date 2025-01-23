// server.js
require("dotenv").config(); // Load environment variables
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// Serve the uploads folder as a static directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Import routes
const patientRoutes = require("./routes/patients");

// Use routes
// Protect all routes under `/api` except `/auth`
// Add the `authenticateToken` middleware to secure `/api` endpoints
app.use("/api", patientRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
