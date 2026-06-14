import React, { useEffect, useState } from 'react';
import { Route, Routes, Navigate, useNavigate, NavLink } from 'react-router-dom';
import { UAParser } from 'ua-parser-js';
import './App.css';

// Page Imports
import Homepage from './pages/HomePage/Homepage';
import AttendancePage from './pages/AttendancePage';
import AttendanceRecord from './pages/AttendanceRecord';
import Production from './pages/Production/Production';
import Fabricquality from './components/FabricQuality/Fabricquality';
import ProductionReport from './pages/ProductionReport/ProductionReport';
import AdminReport from './pages/AdminReport/AdminReport';
import YarnQuality from './components/YarnQuality/YarnQuality';
import Register from './pages/Register';
import ResetPassword from "./pages/ResetPassword";

const getDeviceDetails = () => {
  const parser = new UAParser();
  const res = parser.getResult();
  const vendor = res.device.vendor || "";
  const model = res.device.model || "";
  const os = res.os.name || "";
  if (!vendor && !model) return `Desktop (${os})`;
  return `${vendor} ${model} (${os})`.trim();
};

function App() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  const API_BASE_URL =
    window.location.hostname === "localhost"
      ? "http://localhost:5000"
      : "https://rupai-fabric.onrender.com";

  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxJ74WwPwwscMooeLOA5saRUOlvQGkBPahDJPmlMOzXH9BdoJVtjKUiqdiauecIRpuh/exec";

  const logToSheet = (user, status) => {
    fetch(SCRIPT_URL, {
      method: "POST",
      mode: "no-cors", // MUST KEEP THIS
      headers: {
        "Content-Type": "text/plain"
      },
      body: JSON.stringify({
        username: user.username,
        role: user.role,
        device: user.device || getDeviceDetails(),
        login_time: new Date().toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata"
        }),
        status: status
      })
    });
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('authUser');
    if (savedUser) {
      const parsedData = JSON.parse(savedUser);
      const today = new Date().toLocaleDateString();
      if (parsedData.loginDate === today) {
        setCurrentUser(parsedData);
      } else {
        localStorage.removeItem('authUser');
        setCurrentUser(null);
      }
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: credentials.username,
            password: credentials.password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Invalid username or password");
        return;
      }

      const deviceInfo = getDeviceDetails();
      const today = new Date().toLocaleDateString();

      const sessionData = {
        ...data.user,
        device: deviceInfo,
        loginDate: today,
      };

      logToSheet(sessionData, "Login");

      setCurrentUser(sessionData);

      localStorage.setItem(
        "authUser",
        JSON.stringify(sessionData)
      );

      setError("");
      navigate("/");
    } catch (error) {
      console.error("Login Error:", error);
      setError("Server Error");
    }
  };

  const handleLogout = () => {
    if (currentUser) {
      // SEND LOGOUT STATUS
      logToSheet(currentUser, "Logout");
    }
    setCurrentUser(null);
    localStorage.removeItem('authUser');
    setCredentials({ username: '', password: '' });
    navigate('/');
  };


  return (
    <div className="App">
      <header className="app-header">
        <div className="header-left">
          <NavLink to='/'>
            <img src="/logo.png" alt="Logo" className="logo" />
          </NavLink>
          <span className="user-info">
            <strong>{currentUser?.username}</strong>
            <span className="device"> ({currentUser?.device})</span>
          </span>
        </div>

        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </header>

      <Routes>

        {/* PUBLIC ROUTES */}
        <Route
          path="/login"
          element={
            currentUser ? (
              <Navigate to="/" />
            ) : (
              <div style={styles.container}>
                <div style={styles.card}>
                  <h2>System Login</h2>

                  <form onSubmit={handleLogin}>
                    <input
                      type="text"
                      placeholder="Username"
                      onChange={(e) =>
                        setCredentials({
                          ...credentials,
                          username: e.target.value,
                        })
                      }
                      style={styles.input}
                    />

                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      onChange={(e) =>
                        setCredentials({
                          ...credentials,
                          password: e.target.value,
                        })
                      }
                      style={styles.input}
                    />
                    <label style={{ fontSize: "13px", display: "block", marginTop: "5px" }}>
                      <input
                        type="checkbox"
                        onChange={togglePassword}
                        style={{ marginRight: "5px" }}
                      />
                      Show Password
                    </label>

                    <button style={styles.button}>Login</button>
                  </form>

                  {error && <p style={{ color: "red" }}>{error}</p>}

                  <p>
                    <NavLink to="/register">Create Account</NavLink>
                  </p>

                  <NavLink to="/reset-password">
                    Forgot Password?
                  </NavLink>
                </div>
              </div>
            )
          }
        />

        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* PROTECTED ROUTES */}
        <Route
          path="/"
          element={
            currentUser ? (
              <Homepage currentUser={currentUser} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/attendance"
          element={
            currentUser ? (
              <AttendancePage currentUser={currentUser} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route path="/production" element={<Production />} />
        <Route path="/production/:date?" element={<Production />} />
        <Route path="/fabric" element={<Fabricquality />} />
        <Route path="/yarn" element={<YarnQuality />} />

        <Route
          path="/attendancerecord"
          element={
            currentUser?.role === "admin" ||
              currentUser?.role === "site_developer" ? (
              <AttendanceRecord />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/productionreport"
          element={
            currentUser?.role === "admin" ||
              currentUser?.role === "site_developer" ? (
              <ProductionReport />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/adminreport"
          element={
            currentUser ? (
              <AdminReport currentUser={currentUser} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route path="*" element={<Navigate to="/login" />} />

      </Routes>
    </div>
  );
}
const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
  },

  card: {
    width: "380px",
    padding: "35px",
    borderRadius: "12px",
    background: "#fff",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
    textAlign: "center",
  },

  input: {
    width: "100%",
    padding: "12px",
    margin: "10px 0",
    borderRadius: "8px",
    border: "1px solid #ddd",
    outline: "none",
  },

  button: {
    width: "100%",
    padding: "12px",
    background: "#667eea",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  },
};
export default App;