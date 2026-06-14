import React, { useState, useEffect } from "react";
import axios from "axios";
import { getDaysInMonth, createEmployee, PRINT_STYLE } from "../utils/payrollHelpers";
import SalarySlip from "../components/SalarySlip";
import AdvanceInput from "../components/AdvanceInput";
import bcrypt from 'bcryptjs'

/**
 * FIXED API URL LOGIC
 * This ensures the URL never evaluates to "undefined".
 * If you are on Netlify, it uses the production Railway URL.
 * If you are on your computer, it uses localhost.
 */
const API_BASE_URL = window.location.hostname === "localhost"
  ? "http://localhost:5000"
  : "https://rupai-fabric.onrender.com";

const API_URL = `${API_BASE_URL}/api/employees`;

// Month names declared at top
const monthNames = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december"
];

// Get current date automatically
const today = new Date();
const currentYear = today.getFullYear();
const currentMonthIdx = today.getMonth();

export default function AttendancePage({ currentUser }) {
  const isAdmin = currentUser?.role === 'admin';
  const isDeveloper = currentUser?.role === 'site_developer';
  // Default now uses current month & year
  const [displayDate, setDisplayDate] = useState({
    year: currentYear,
    monthName:
      monthNames[currentMonthIdx].charAt(0).toUpperCase() +
      monthNames[currentMonthIdx].slice(1),
    monthIdx: currentMonthIdx
  });

  const days = getDaysInMonth(displayDate.year, displayDate.monthIdx);

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingEmp, setViewingEmp] = useState(null);
  const [newEmpName, setNewEmpName] = useState("");
  const [newEmpRate, setNewEmpRate] = useState(750);
  const [selectedMonthForNew, setSelectedMonthForNew] = useState("");

  const availableYears = [2025, 2026, 2027, 2028, 2029, 2030];

  // FETCH DATA
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(API_URL);
        const yearData = res.data[displayDate.year];
        const monthKey = displayDate.monthName.toLowerCase();

        if (yearData && yearData[monthKey]) {
          setEmployees(yearData[monthKey]);
        } else {
          setEmployees([]);
        }
      } catch (err) {
        console.error("API Connection Failed!", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [displayDate.year, displayDate.monthName]);

  const syncToDB = async (updatedList) => {
    try {
      await axios.post(API_URL, {
        year: displayDate.year,
        month: displayDate.monthName.toLowerCase(),
        employees: updatedList
      });
      console.log("Sync Successful");
    } catch (err) {
      console.error("Sync failed", err);
      alert("Changes not saved. Check server connection.");
    }
  };

  const handleViewChange = (field, value) => {
    if (field === "year") {
      setDisplayDate(prev => ({ ...prev, year: parseInt(value) }));
    } else {
      const mIdx = monthNames.indexOf(value.toLowerCase());
      setDisplayDate(prev => ({
        ...prev,
        monthName: value.charAt(0).toUpperCase() + value.slice(1),
        monthIdx: mIdx
      }));
    }
  };

  const handleInitializeMonth = async () => {
    if (!selectedMonthForNew) return alert("Please select a month!");

    const confirmMsg = `Initialize ${selectedMonthForNew.toUpperCase()} ${displayDate.year}? Names carry over, but attendance resets.`;
    if (!window.confirm(confirmMsg)) return;

    const newMonthIdx = monthNames.indexOf(selectedMonthForNew.toLowerCase());
    const newDays = getDaysInMonth(displayDate.year, newMonthIdx);

    const freshData = employees.map(emp => ({
      name: emp.name,
      dailySalary: emp.dailySalary,
      attendance: new Array(newDays).fill(""),
      advance: [],
      totalPresent: 0,
      totalAbsent: 0,
      totalSalary: 0,
      totalAdvance: 0,
      finalPay: 0
    }));

    try {
      await axios.post(API_URL, {
        year: displayDate.year,
        month: selectedMonthForNew.toLowerCase(),
        employees: freshData
      });

      setDisplayDate(prev => ({
        ...prev,
        monthName:
          selectedMonthForNew.charAt(0).toUpperCase() +
          selectedMonthForNew.slice(1),
        monthIdx: newMonthIdx
      }));

      setEmployees(freshData);
      setSelectedMonthForNew("");
    } catch (err) {
      alert("Database error: Could not initialize month.");
    }
  };

  const updateField = async (id, field, value) => {
    const updatedList = employees.map(emp => {
      const currentId = emp._id || emp.id;
      if (currentId !== id) return emp;

      let updatedEmp = { ...emp, [field]: value };

      if (['attendance', 'dailySalary', 'advance'].includes(field)) {
        const presentCount = updatedEmp.attendance.filter(x => x === "P").length;
        const absentCount = updatedEmp.attendance.filter(x => x === "A").length;

        updatedEmp.totalPresent = presentCount;
        updatedEmp.totalAbsent = absentCount;
        updatedEmp.totalSalary = presentCount * updatedEmp.dailySalary;

        updatedEmp.totalAdvance = updatedEmp.advance.reduce((acc, obj) => {
          const val = Object.values(obj)[0];
          return acc + (Number(val) || 0);
        }, 0);

        updatedEmp.finalPay =
          updatedEmp.totalSalary - updatedEmp.totalAdvance;
      }

      return updatedEmp;
    });

    setEmployees(updatedList);
    await syncToDB(updatedList);
  };

  const addNewEmployee = async () => {
    if (!newEmpName.trim()) return;

    const newEmp = createEmployee(Date.now(), newEmpName, days, newEmpRate);
    const updatedList = [...employees, newEmp];

    setEmployees(updatedList);
    await syncToDB(updatedList);
    setNewEmpName("");
  };

  const deleteEmployee = async (emp) => {
    const targetId = emp._id || emp.id;
    const targetName = emp.name;
  
    // 1. First verification: Admin Password
    // const password = window.prompt(`To delete ${targetName}, enter Admin Password:`);
    // if (!password) return;
  
    // Verify using your bcrypt hash for '5242MT'
    // const adminHash = '$2b$10$Wi5OE4ZlocW49O/8qDbbgOatoV5Nbn/ug9pTLJohPdkoS53PU5MI2';
    // const isMatch = bcrypt.compareSync(password, adminHash);
  
    // if (!isMatch) {
    //   alert("Incorrect password!");
    //   return;
    // }
  
    // 2. Second verification: Employee Name check
    const confirmName = window.prompt(`Type "${targetName}" to confirm deletion:`);
    
    if (confirmName === targetName) {
      const updatedList = employees.filter(e => (e._id || e.id) !== targetId);
      setEmployees(updatedList);
      await syncToDB(updatedList);
      alert(`${targetName} has been deleted.`);
    } else {
      alert("Name did not match. Deletion cancelled.");
    }
  };

  const removeAdvance = async (emp, advIndex) => {
    const empId = emp._id || emp.id;
    const targetAdv = emp.advance[advIndex];
    
    // Extract date and amount from the advance object
    const advDate = Object.keys(targetAdv)[0];
    const advAmount = Object.values(targetAdv)[0];
  
    // Show prompt asking to type employee name
    const confirmMsg = `Remove Advance of ₹${advAmount} (${advDate}) for ${emp.name}? \n\nType "${emp.name}" to confirm:`;
    const userInput = window.prompt(confirmMsg);
  
    if (userInput === emp.name) {
      const updatedList = employees.map(e => {
        if ((e._id || e.id) !== empId) return e;
  
        const newAdvance = e.advance.filter((_, idx) => idx !== advIndex);
        const totalAdv = newAdvance.reduce((acc, obj) => acc + Number(Object.values(obj)[0]), 0);
  
        return {
          ...e,
          advance: newAdvance,
          totalAdvance: totalAdv,
          finalPay: e.totalSalary - totalAdv
        };
      });
  
      setEmployees(updatedList);
      await syncToDB(updatedList);
      alert("Advance removed successfully.");
    } else if (userInput !== null) {
      alert("Name mismatch! Action cancelled.");
    }
  };

  const printSlip = (id) => {
    const content = document.getElementById(`slip-${id}`).innerHTML;
    window.print(content)
  };

  return (
    <div className="container">
      <style>
        {`
@media print {

 .table-wrapper,.app-header,.add-emp-btn{display:none !important;}
 .modal-overlay{background: none !important; align-items: start !important;padding-top: 80px !important;
    justify-content: center;}
 .modal-content{box-shadow: none !important;padding: 0 !important;
    border-radius: 0 !important;
    }
`}
      </style>
      <header className="app-header">
        <div className="title-area">
          <h1 style={{ margin: 0 }}>Payroll: {displayDate.monthName} {displayDate.year}</h1>
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <select value={displayDate.year} onChange={(e) => handleViewChange("year", e.target.value)}>
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={displayDate.monthName.toLowerCase()} onChange={(e) => handleViewChange("month", e.target.value)}>
              {monthNames.map(m => <option key={m} value={m}>VIEW {m.toUpperCase()}</option>)}
            </select>
          </div>
        </div>

        <div className="header-actions">
          <div className="add-emp-box">
            <input placeholder="New Employee Name" value={newEmpName} onChange={e => setNewEmpName(e.target.value)} />
            <input type="number" placeholder="Rate" style={{ width: '80px' }} value={newEmpRate} onChange={e => setNewEmpRate(e.target.value)} />
            {isAdmin && (<><button className="add-emp-btn" onClick={addNewEmployee}>+ Add Employee</button></>)}
          </div>

          <div className="month-create-box">
            <span style={{ fontSize: '11px', fontWeight: 'bold' }}>INITIALIZE MONTH:</span>
            <select value={selectedMonthForNew} onChange={(e) => setSelectedMonthForNew(e.target.value)}>
              <option value="">Select Month</option>
              {monthNames.map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
            </select>
            <button className="add-emp-btn" onClick={handleInitializeMonth} style={{ background: '#0284c7' }}>
              Create Data
            </button>
          </div>
        </div>
      </header>

      <div className="table-wrapper">
        <table className="main-table">
          <thead>
            <tr>
              <th className="sticky-col">Employee Name</th>
              {isAdmin && <th>Rate</th>}
              {Array.from({ length: days }, (_, i) => <th key={i}>{i + 1}</th>)}
              <th style={{ color: "#2ecc71" }}>P</th>
              <th style={{ color: "#e74c3c" }}>A</th>
              <th>Earnings</th>
              <th style={{ minWidth: '250px' }}>Advances</th>
              <th>Net Pay</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {employees.length > 0 ? (
              employees.map(emp => (
                <tr key={emp._id || emp.id}>
                  <td className="sticky-col">
                    <input
                      type="text"
                      value={emp.name}
                      onChange={e => updateField(emp._id || emp.id, 'name', e.target.value)}
                      style={{ border: 'none', background: 'transparent', fontWeight: 'bold', width: '100%' }}
                    />
                  </td>
                  {isAdmin && 
                  <td>
                    <input
                      type="number"
                      className="rate-input"
                      value={emp.dailySalary}
                      onChange={e => updateField(emp._id || emp.id, 'dailySalary', Number(e.target.value))}
                    />
                  </td>}
                  {emp.attendance.map((v, i) => (
                    <td key={i} className={`att-cell ${v === "P" ? "p-bg" : v === "A" ? "a-bg" : ""}`}>
                      <select value={v} onChange={e => {
                        const newAtt = [...emp.attendance];
                        newAtt[i] = e.target.value;
                        updateField(emp._id || emp.id, 'attendance', newAtt);
                      }}>
                        <option value="">-</option>
                        <option value="P">P</option>
                        <option value="A">A</option>
                      </select>
                    </td>
                  ))}
                  <td className="stats-cell text-p">{emp.totalPresent}</td>
                  <td className="stats-cell text-a">{emp.totalAbsent || 0}</td>
                  <td>₹{emp.totalSalary}</td>
                  <td>
                    {isAdmin && (<><AdvanceInput onAdd={(d, a) => {
                      const newAdv = [...emp.advance, { [d]: Number(a) }];
                      updateField(emp._id || emp.id, 'advance', newAdv);
                    }} /></>)}
                    <div className="adv-grid">
                      {emp.advance.map((obj, idx) => (
                        <div key={idx} className="adv-tag">
                          <span>{Object.keys(obj)[0]}: ₹{Object.values(obj)[0]}</span>
                          {isAdmin && (<><button onClick={() => removeAdvance(emp, idx)}>&times;</button></>)}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="money-text highlight">₹{emp.finalPay}</td>
                  <td className="action-cell">
                    <button className="view-btn" onClick={() => setViewingEmp(emp)}>View</button>
                    {isAdmin && (<><button className="trash-btn" onClick={() => deleteEmployee(emp)}>🗑️</button></>)}
                    <div id={`slip-${emp._id || emp.id}`} style={{ display: "none" }}>
                      <SalarySlip emp={emp} month={displayDate.monthName} year={displayDate.year} />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={days + 8} style={{ padding: '60px', textAlign: 'center' }}>
                  No data found for {displayDate.monthName} {displayDate.year}.
                  Select a month and click "Create Data" to begin.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {viewingEmp && (
        <div className="modal-overlay" onClick={() => setViewingEmp(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <SalarySlip emp={viewingEmp} month={displayDate.monthName} year={displayDate.year} />
            <button className="add-emp-btn" onClick={() => printSlip(viewingEmp._id || viewingEmp.id)}>🖨️ Print Slip</button>
          </div>
        </div>
      )}
    </div>
  );
}