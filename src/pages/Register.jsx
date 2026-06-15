import React, { useState } from "react";
import { NavLink } from "react-router-dom";

const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://rupai-fabric-n9zz.onrender.com";

function Register() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "staff",
    name: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Registration failed");
        setMessage("");
        return;
      }

      setMessage("User registered successfully 🎉");
      setError("");

      setFormData({
        username: "",
        password: "",
        role: "staff",
        name: "",
      });
    } catch (err) {
      setError("Server Error");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>User Registration</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            style={styles.input}
            required
          />

          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            style={styles.input}
            required
          />

          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            style={styles.input}
            required
          />

          <label style={styles.checkbox}>
            <input
              type="checkbox"
              onChange={() =>
                setShowPassword(!showPassword)
              }
            />
            Show Password
          </label>

          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            style={styles.input}
          >
            <option value="admin">Admin</option>
            <option value="master">Master</option>
            <option value="staff">Staff</option>
          </select>

          <button type="submit" style={styles.button}>
            Register
          </button>
        </form>

        {message && (
          <p style={{ color: "green", marginTop: "10px" }}>
            {message}{" "}
            <NavLink to="/login">Login</NavLink>
          </p>
        )}

        {error && (
          <p style={{ color: "red", marginTop: "10px" }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #43cea2, #185a9d)",
  },

  card: {
    width: "400px",
    padding: "30px",
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
    textAlign: "center",
  },

  input: {
    width: "100%",
    padding: "12px",
    margin: "8px 0",
    borderRadius: "8px",
    border: "1px solid #ddd",
  },

  button: {
    width: "100%",
    padding: "12px",
    background: "#185a9d",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
  },

  checkbox: {
    display: "flex",
    alignItems: "center",
    fontSize: "13px",
    marginBottom: "10px",
  },
};

export default Register;