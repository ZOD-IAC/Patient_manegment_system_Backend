// controllers/patients.js
const db = require("../config/db");

// Fetch all patients
const getPatients = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM patients");
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching patients:", error);
    res.status(500).json({ error: "Failed to fetch patients" });
  }
};

const addPatients = async (req, res) => {
  const { name, DOB, gender, email, mobile, address, condition } = req.body;

  // Validation
  if (!name || !DOB || !gender || !mobile) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const sql =
      "INSERT INTO patients (name, DOB, gender, email, mobile, address , conditions) VALUES (?, ?, ?, ?, ?, ?, ? )";
    const [result] = await db.query(sql, [
      name,
      DOB,
      gender,
      email,
      mobile,
      address,
      condition,
    ]);
    res.status(201).json({
      message: "Patient added successfully",
      patientId: result.insertId,
    });
  } catch (error) {
    console.error("Error adding patient:", error);
    res.status(500).json({ error: "Database error" });
  }
};

const editPatient = async (req, res) => {
  if (!db) {
    return res.status(500).json({ error: "Database not initialized" });
  }

  const { id } = req.params;
  const { name, DOB, mobile, gender, email, address } = req.body;

  // Input validation
  if (!name || !DOB || !mobile || !gender || !email || !address) {
    return res.status(400).json({ error: "All fields are required" });
  }
  if (typeof mobile !== "string" || !/^\d{10}$/.test(mobile)) {
    return res.status(400).json({ error: "Invalid mobile number provided" });
  }

  // Sanitize and validate ID
  const sanitizedId = parseInt(id, 10);
  if (isNaN(sanitizedId)) {
    return res.status(400).json({ error: "Invalid patient ID" });
  }

  try {
    // Update query
    const query = `
      UPDATE patients
      SET name = ?, DOB = ?, mobile = ?, gender = ?, email = ?, address = ?
      WHERE patient_id = ?
    `;
    const [result] = await db.query(query, [
      name,
      DOB,
      mobile,
      gender,
      email,
      address,
      sanitizedId,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.status(200).json({
      message: "Patient updated successfully",
      updatedFields: { name, DOB, mobile, gender, email, address },
    });
  } catch (error) {
    console.error("Error updating patient:", error.message || error);
    res
      .status(500)
      .json({ error: "An error occurred while updating the patient" });
  }
};

const findPatient = async (req, res) => {
  if (!db) {
    return res.status(500).json({ error: "Database not initialized" });
  }
  const mobile = req.params.mobile;

  // Validate input
  if (!mobile || typeof mobile !== "string" || !/^\d{10}$/.test(mobile)) {
    return res.status(400).json({ error: "Invalid mobile number provided" });
  }

  try {
    // Use prepared statements to prevent SQL injection
    const query = `SELECT * FROM patients WHERE mobile = ?`;
    const [result] = await db.query(query, [mobile]);

    if (result.length === 0) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error finding patient:", error);
    res.status(500).json({ error: "Database error" });
  }
};

const addTreatment = async (req, res) => {
  const { patientId, date, process, amount, treatedBy } = req.body;

  // Validate input
  if (!patientId || !date || !process || !amount || !treatedBy) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const query = `
        INSERT INTO treatments (patient_id, date, process, amount, treated_by)
        VALUES (?, ?, ?, ?, ?)
      `;
    const result = await db.query(query, [
      patientId,
      date,
      process,
      amount,
      treatedBy,
    ]);
    res.status(201).json({
      message: "Treatment added successfully",
      treatmentId: result.insertId,
    });
  } catch (error) {
    console.error("Error adding treatment:", error);
    res.status(500).json({ error: "Database error" });
  }
};

const getPatientWithTreatments = async (req, res) => {
  const { patientId } = req.params;
  try {
    // Fetch patient details
    const patientQuery = `SELECT * FROM patients WHERE patient_id = ?`;
    const [patientRows] = await db.query(patientQuery, [patientId]);

    // Check if the patient exists
    if (patientRows.length === 0) {
      return res.status(404).json({ error: "Patient not found" });
    }
    const patient = patientRows[0];

    // Fetch treatments for the patient
    const treatmentsQuery = `SELECT * FROM treatments WHERE patient_id = ? ORDER BY date DESC`;
    const [treatmentRows] = await db.query(treatmentsQuery, [patientId]);

    // Return the combined response
    res.status(200).json({
      ...patient,
      treatments: treatmentRows,
    });
  } catch (error) {
    console.error("Error fetching patient with treatments:", error);
    res.status(500).json({ error: "Database error" });
  }
};

const getHistoryImages = async (req, res) => {
  const { patientId } = req.params;
  try {
    const sql = `SELECT * FROM prescription_images WHERE patient_id = ?`;
    const [result] = await db.query(sql, [patientId]);

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching patients:", error);
    res.status(500).json({ error: "Failed to fetch patients" });
  }
};

const addImagesForPatient = async (req, res) => {
  const { patientId } = req.params;
  const files = req.files;

  if (!files || files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }

  try {
    // Check if the patient exists
    const [patient] = await db.query(
      "SELECT * FROM patients WHERE patient_id = ?",
      [patientId]
    );

    if (patient.length === 0) {
      return res.status(404).json({ error: "Patient not found" });
    }

    // Insert images into the prescription_images table
    const imageRecords = files.map((file) => [patientId, file.path]);
    await db.query(
      "INSERT INTO prescription_images (patient_id, image_path) VALUES ?",
      [imageRecords]
    );

    res.status(201).json({ message: "Images added successfully!" });
  } catch (err) {
    console.error("Error adding images for patient:", err);
    res.status(500).json({ error: "Database error" });
  }
};

const deletePatient = async (req, res) => {
  if (!db) {
    return res.status(500).json({ error: "Database not initialized" });
  }
  const { id } = req.params;
  try {
    // Query to delete the patient by ID
    const deleteQuery = "DELETE FROM patients WHERE patient_id = ?";
    const [result] = await db.execute(deleteQuery, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Patient not found." });
    }

    res.status(200).json({ message: "Patient deleted successfully." });
  } catch (error) {
    console.error("Error deleting patient:", error);
    res
      .status(500)
      .json({ error: "An error occurred while deleting the patient." });
  }
};

module.exports = {
  getPatients,
  addPatients,
  findPatient,
  addTreatment,
  getPatientWithTreatments,
  editPatient,
  addImagesForPatient,
  getHistoryImages,
  deletePatient,
};
