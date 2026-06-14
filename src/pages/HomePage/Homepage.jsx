import React from "react";
import { NavLink } from "react-router-dom";

const Homepage = ({ currentUser }) => {
  return (
    <>
      <ul style={{
        listStyle: "none",
        padding: 0,
        display: "flex",
        gap: "10px",
        justifyContent: "center",
        flexWrap: "wrap"
      }}>

        {/* Common Links */}
        <li>
          <NavLink
            to="/attendance"
            style={navStyle("#4CAF50")}
          >
            Daily Attendance
          </NavLink>
        </li>

        <li>
          <NavLink
            to="/production"
            style={navStyle("#2196F3")}
          >
            Daily Production
          </NavLink>
        </li>

        {/* Admin Only Links */}
        {currentUser?.role === "admin" || currentUser?.role === "site_developer" && (
          <>
            <li>
              <NavLink
                to="/attendancerecord"
                style={navStyle("#ff9800")}
              >
                Attendance Record
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/productionreport"
                style={navStyle("#9c27b0")}
              >
                Production Report
              </NavLink>
            </li>
          </>
        )}

        <li>
          <NavLink
            to="/adminreport"
            style={navStyle("#f44336")}
          >
            Admin Report
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/yarn"
            style={navStyle("#3F51B5")}
          >
            Add Yarn Quality
          </NavLink>
        </li>
      </ul>
      <div className="mataji-image" style={{"display": "flex","justifyContent": "center"}}>
        <img src="./rupai-mataji.jpeg" alt="" style={{'width':"200px","height":"350px"}} />
      </div>
    </>
  );
};

const navStyle = (bgColor) => ({
  display: "inline-block",
  padding: "10px 18px",
  backgroundColor: bgColor,
  color: "#fff",
  textDecoration: "none",
  borderRadius: "6px",
  fontSize: "16px",
  fontWeight: "bold",
  transition: "0.3s"
});

export default Homepage;