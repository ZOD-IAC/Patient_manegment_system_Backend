// routes/patients.js
const express = require("express");
const {
  getPatients,
  addPatients,
  findPatient,
  addTreatment,
  getPatientWithTreatments,
  editPatient,
  addImagesForPatient,
  getHistoryImages,
  deletePatient,
} = require("../controllers/patients");
const db = require("../config/db");
const router = express.Router();
const multer = require("multer");
const path = require("path");

// Multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// Fetch all patients
router.get("/patients", getPatients);

// POST route to add a images to patient
router.post(
  "/patients/addImages/:patientId",
  upload.array("prescriptionImages", 10),
  addImagesForPatient
);

// get route to get a prescription images
router.get("/patients/getImages/:patientId", getHistoryImages);

//post route for finding particular patient
router.get("/patients/findPatient/:mobile", findPatient);

//post route for adding treatment for the patient
router.post("/patients/addTreatment", addTreatment);

//post route for add patient
router.post("/patients/addPatient", upload.none(), addPatients);

//put route for editing patient details for the patient
router.put("/patients/editPatient/:id", editPatient);

//put route for editing patient details for the patient
router.delete("/patients/deletePatient/:id", deletePatient);

//get route to fetch patient with treatment
router.get(
  "/patients/getPatientTreatment/:patientId",
  getPatientWithTreatments
);

module.exports = router;
