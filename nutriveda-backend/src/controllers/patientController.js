const Patient = require('../models/Patient');

class PatientController {
  static async createPatient(req, res) {
    try {
      const patient = await Patient.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Patient created successfully',
        data: patient
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getAllPatients(req, res) {
    try {
      const patients = await Patient.findAll();
      res.status(200).json({
        success: true,
        message: 'Patients retrieved successfully',
        data: patients,
        count: patients.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getPatientById(req, res) {
    try {
      const patient = await Patient.findById(req.params.id);
      
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Patient retrieved successfully',
        data: patient
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async updatePatient(req, res) {
    try {
      const patient = await Patient.update(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Patient updated successfully',
        data: patient
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = PatientController;