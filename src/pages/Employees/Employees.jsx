import React, { useEffect, useState } from "react";
import axios from "axios";
import EmployeeProfileModal from "../../components/EmployeeProfile/EmployeeProfileModal";
import "./Employees.css";

const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://rupai-fabric-n9zz.onrender.com";

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showProfileModal, setShowProfileModal] = useState(false);

  // Store complete employee object
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE_URL}/api/employee-profile/employees`
      );
      const employeesWithStatus = await Promise.all(
        res.data.map(async (emp) => {
          try {
            const profileRes = await axios.get(
              `${API_BASE_URL}/api/employee-profile/${emp.employeeId}`
            );
            const profile = profileRes.data;
            return {
              ...emp,
              profileStatus: {
                profilePicture: !!profile.profilePicture?.url,
                aadhaarPhoto: !!profile.aadhaarPhoto?.url,
                passbookPhoto: !!profile.passbookPhoto?.url
              }
            };
          } catch (err) {
            return {
              ...emp,
              profileStatus: {
                profilePicture: false,
                aadhaarPhoto: false,
                passbookPhoto: false
              }
            };
          }
        })
      );
      setEmployees(employeesWithStatus);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const openProfile = (employee) => {
    setSelectedEmployee(employee);
    setShowProfileModal(true);
  };

  const closeProfile = () => {
    setShowProfileModal(false);
    setSelectedEmployee(null);
  };

  return (
    <div className="employeesPage">

      <h2>Employee List</h2>

      {loading ? (
        <h3>Loading...</h3>
      ) : (
        <div className="employeeGrid">

          {employees.length === 0 ? (
            <h3>No Employees Found</h3>
          ) : (
            employees.map((emp) => (
              <div
                key={emp._id}
                className="employeeCard"
              >
                <div className="employeeName">
                  {emp.name}
                </div>
                <div className="profileStatus">
                  <div className={emp.profileStatus.profilePicture ? "status success" : "status danger"}>
                    {emp.profileStatus.profilePicture ? "✔" : "✗"} Profile
                  </div>
                  <div className={emp.profileStatus.aadhaarPhoto ? "status success" : "status danger"}>
                    {emp.profileStatus.aadhaarPhoto ? "✔" : "✗"} Aadhaar
                  </div>

                  <div className={emp.profileStatus.passbookPhoto ? "status success" : "status danger"}>
                    {emp.profileStatus.passbookPhoto ? "✔" : "✗"} Passbook
                  </div>
                </div>
                {/* <div className="salary">
                  ₹ {emp.dailySalary}
                </div> */}

                <button
                  className="profileBtn"
                  onClick={() => openProfile(emp)}
                >
                  View Profile
                </button>
              </div>
            ))
          )}

        </div>
      )}

      {showProfileModal && selectedEmployee && (
        <EmployeeProfileModal
          open={showProfileModal}
          employeeId={selectedEmployee.employeeId}
          employeeName={selectedEmployee.name}
          onClose={closeProfile}
          onProfileUpdated={fetchEmployees}
        />
      )}
    </div>
  );
};

export default Employees;