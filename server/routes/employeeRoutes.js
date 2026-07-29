const express = require('express');
const router = express.Router();
const {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  migrateEmployeeIds
} = require('../controllers/employeeController');

// Standard Routes
router.route('/')
  .get(getEmployees)
  .post(createEmployee);

router.get('/migrate-ids', migrateEmployeeIds);

router.route('/:id')
  .put(updateEmployee)
  .delete(deleteEmployee);

module.exports = router;