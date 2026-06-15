import React, { useState } from "react";
import { NavLink } from "react-router-dom";

const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://rupai-fabric-n9zz.onrender.com";

function ResetPassword() {
  const [form, setForm] = useState({
    username: "",
    newPassword: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/auth/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.message);
        setMessage("");
        return;
      }

      setMessage("Password reset successful");
      setError("");

    } catch (err) {
      setError("Server error");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>Reset Password</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            style={styles.input}
            onChange={(e) =>
              setForm({ ...form, username: e.target.value })
            }
            required
          />

          <input
            type={showPassword ? "text" : "password"}
            placeholder="New Password"
            style={styles.input}
            onChange={(e) =>
              setForm({ ...form, newPassword: e.target.value })
            }
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

          <button style={styles.button}>
            Reset Password
          </button>
        </form>

        {message && (
          <p style={{ color: "green" }}>
            {message}{" "}
            <NavLink to="/login">Login</NavLink>
          </p>
        )}

        {error && (
          <p style={{ color: "red" }}>{error}</p>
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
    background: "linear-gradient(135deg, #ff758c, #ff7eb3)",
  },

  card: {
    width: "380px",
    padding: "35px",
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
    textAlign: "center",
  },

  input: {
    width: "100%",
    padding: "12px",
    margin: "10px 0",
    borderRadius: "8px",
    border: "1px solid #ddd",
  },

  button: {
    width: "100%",
    padding: "12px",
    background: "#ff4d6d",
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
    marginTop: "5px",
  },
};
export default ResetPassword;