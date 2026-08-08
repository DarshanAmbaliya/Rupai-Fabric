const mongoose = require("mongoose");
const Payroll = require('../models/Employee');

exports.migrateEmployeeIds = async (req, res) => {
  try {
    const payrolls = await Payroll.find();
    let count = 0;

    for (const payroll of payrolls) {
      let changed = false;
      for (const [month, employees] of payroll.months.entries()) {
        const updatedEmployees = employees.map(emp => {
          if (!emp.employeeId) {
            emp.employeeId = new mongoose.Types.ObjectId();
            count++;
            changed = true;
            console.log(
              "Added ID:",
              emp.name,
              emp.employeeId
            );
          }
          return emp;
        });
        payroll.months.set(month, updatedEmployees);
      }

      if (changed) {
        payroll.markModified("months");
        await payroll.save();
      }
    }

    res.json({
      message: "Migration completed",
      updated: count
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

// GET: Fetch all payroll data
exports.getEmployees = async (req, res) => {
  try {
    const data = await Payroll.find();
    const result = {};
    data.forEach(item => {
      result[item.year] = item.months;
    });
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST: Save or Update a specific month's data
exports.createEmployee = async (req, res) => {
  const { year, month, employees } = req.body;

  if (!year || !month) {
    return res.status(400).json({
      message: "Year and Month are required"
    });
  }

  try {
    const normalizedEmployees = employees.map(emp => ({
      ...emp,

      employeeId:
        emp.employeeId && mongoose.Types.ObjectId.isValid(emp.employeeId)
          ? emp.employeeId
          : new mongoose.Types.ObjectId()
    }));

    let payroll = await Payroll.findOne({
      year: parseInt(year)
    });

    if (!payroll) {
      payroll = new Payroll({
        year: parseInt(year),
        months: {}
      });
    }

    payroll.months.set(
      month.toLowerCase(),
      normalizedEmployees
    );

    payroll.markModified("months");

    const saved = await payroll.save();

    res.status(200).json(saved);

  } catch (err) {
    console.error(err);

    res.status(400).json({
      message: err.message
    });
  }
};

// Placeholders for update/delete
exports.updateEmployee = (req, res) => res.status(200).json({ message: "Update success" });
exports.deleteEmployee = (req, res) => res.status(200).json({ message: "Delete success" });