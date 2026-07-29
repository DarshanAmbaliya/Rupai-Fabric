const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const employeeRoutes = require('./routes/employeeRoutes');
const fabricRoutes = require("./routes/fabricRoutes");
const productionRoutes = require("./routes/productionRoutes.js")
const yarnRoutes = require("./routes/yarnRoutes");
const authRoutes = require("./routes/authRoutes");
const employeeProfileRoutes = require("./routes/employeeProfileRoutes");

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// ✅ CORS Configuration
// This allows your Netlify frontend to talk to this Railway backend
app.use(cors({
  origin: ["https://rupaifabric.netlify.app", "http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use('/api/employees', employeeRoutes);
app.use("/api/fabrics", fabricRoutes);
app.use("/api/production", productionRoutes);
app.use("/api/yarns", yarnRoutes);
app.use('/api/employees', employeeRoutes);
app.use("/api/employee-profile", employeeProfileRoutes);

// api status Check
app.get('/', (req, res) => {
  res.send('Rupai Fabric API is running!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});