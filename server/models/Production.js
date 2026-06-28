const mongoose = require("mongoose");

const machineSchema = new mongoose.Schema(
  {
    machineNumber: Number,
    quality: String,
    reed: String,
    rpm: String,
    bimNumber: String,
    bimBalance: Number,
    meter: Number,
    efficiency: Number,
    pick: Number,
    machinePick: Number
  },
  { _id: false }
);

const operatorSchema = new mongoose.Schema(
  {
    operator_name: String,
    shift: String,
    average_meter: Number,
    average_efficiency: Number,
    machine_production: [machineSchema]
  },
  { _id: false }
);

const daySchema = new mongoose.Schema(
  {
    summary: Object,
    operator_data: [operatorSchema]
  },
  { _id: false }
);

const productionSchema = new mongoose.Schema(
  {
    year: {
      type: Number,
      unique: true
    },
    january: { type: Map, of: daySchema },
    february: { type: Map, of: daySchema },
    march: { type: Map, of: daySchema },
    april: { type: Map, of: daySchema },
    may: { type: Map, of: daySchema },
    june: { type: Map, of: daySchema },
    july: { type: Map, of: daySchema },
    august: { type: Map, of: daySchema },
    september: { type: Map, of: daySchema },
    october: { type: Map, of: daySchema },
    november: { type: Map, of: daySchema },
    december: { type: Map, of: daySchema }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Production", productionSchema);
