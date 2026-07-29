const mongoose = require('mongoose');

const EmployeeEntrySchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  name: String,
  dailySalary: Number,
  attendance: [String],
  advance: Array,
  totalPresent: Number,
  totalAbsent: Number,
  totalSalary: Number,
  totalAdvance: Number,
  finalPay: Number
});

const YearlyPayrollSchema = new mongoose.Schema({
  year: { type: Number, required: true, unique: true },
  months: {
    type: Map,
    of: [EmployeeEntrySchema],
    default: {}
  }
}, { timestamps: true });

module.exports = mongoose.model('Payroll', YearlyPayrollSchema);