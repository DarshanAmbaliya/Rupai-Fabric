import axios from "axios";
import React, { useEffect, useState } from "react";
import SalarySlip from "../components/SalarySlip";

export default function AttendanceRecord() {
  const [record, setRecord] = useState({});

  // 1. Get current month/year for defaults
  const now = new Date();
  const currentYearStr = now.getFullYear().toString();
  const monthNames = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december"
  ];
  const currentMonthName = monthNames[now.getMonth()];

  const [selectedYear, setSelectedYear] = useState(currentYearStr);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthName);
  const [employeeList, setEmployeeList] = useState([]);
  const [viewingSlip, setViewingSlip] = useState(null);

  const API_BASE_URL = window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://rupai-fabric-n9zz.onrender.com";

  const API_URL = `${API_BASE_URL}/api/employees`;
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(API_URL);
        setRecord(res.data);
        const years = Object.keys(res.data);
        if (!selectedYear && years.length > 0) setSelectedYear(years[years.length - 1]);
      } catch (e) {
        console.log("Error fetching records:", e);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedYear && selectedMonth && record[selectedYear]) {
      setEmployeeList(record[selectedYear][selectedMonth] || []);
    } else {
      setEmployeeList([]);
    }
  }, [selectedYear, selectedMonth, record]);

  const totals = employeeList.reduce((acc, emp) => ({
    salary: acc.salary + (emp.totalSalary || 0),
    advance: acc.advance + (emp.totalAdvance || 0),
    net: acc.net + (emp.finalPay || 0)
  }), { salary: 0, advance: 0, net: 0 });

  const handlePrint = () => {
    document.body.classList.remove("printing-slip"); // Ensure slip mode is OFF
    window.print();
  };
  // 2. For the Individual Salary Slip
const handlePrintSlip = () => {
  document.body.classList.add("printing-slip"); // Turn slip mode ON
  
  // Use a tiny timeout to let the browser apply the class before the dialog opens
  setTimeout(() => {
    window.print();
    // Remove the class after the print dialog closes so the UI goes back to normal
    document.body.classList.remove("printing-slip");
  }, 100);
};

  return (
    <section className="attendance-history">
      <div className="container">
        <style>
          {`
@media print {
.app-header,.add-emp-btn{display:none !important;}
 .modal-overlay{background: none !important; align-items: start !important;padding-top: 80px !important;
    justify-content: center;}
 .modal-content{box-shadow: none !important;padding: 0 !important;
    border-radius: 0 !important;
    }
`}
        </style>
        {/* --- SCREEN HEADER --- */}
        <div className="app-header no-print">
          <div className="brand">
            <h2>Rupai Fabric</h2>
            <p>{selectedMonth || 'Select Month'} {selectedYear}</p>
          </div>

          <div className="controls">
            <div className="select-group">
              <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                {Object.keys(record).map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                <option value="">Select Month</option>
                {monthNames.map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
              </select>
            </div>
            <button onClick={handlePrint} className="print-report-btn">🖨️ <span className="btn-text">Print Report</span></button>
          </div>
        </div>

        {/* --- PRINT HEADER --- */}
        <div className="print-only">
          <div className="print-header">
            <h1>Rupai Fabric</h1>
            <p>Hindwa Textile, Parab Road, Umbhel</p>
            <div className="report-title">
              SALARY STATEMENT: {selectedMonth.toUpperCase()} {selectedYear}
            </div>
          </div>
        </div>

        {/* --- MAIN TABLE (Wrapped for Responsiveness) --- */}
        <div className="table-wrapper">
          <table className="pro-table">
            <thead>
              <tr>
                <th>Sr.</th>
                <th>Employee Name</th>
                <th>Rate</th>
                <th className="center">P</th>
                <th className="center">A</th>
                <th>Gross Salary</th>
                <th>Advance</th>
                <th>Net Payable</th>
                <th className="no-print">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employeeList.map((emp, index) => (
                <tr key={emp._id || index}>
                  <td>{index + 1}</td>
                  <td className="emp-name">{emp.name}</td>
                  <td>₹{emp.dailySalary}</td>
                  <td className="center text-p">{emp.totalPresent}</td>
                  <td className="center text-a">{emp.totalAbsent}</td>
                  <td>₹{emp.totalSalary}</td>
                  <td className="text-a">₹{emp.totalAdvance}</td>
                  <td className="text-net">₹{emp.finalPay}</td>
                  <td className="no-print">
                    {viewingSlip && (
                      <SalarySlip
                        emp={viewingSlip}
                        month={selectedMonth.toUpperCase()}
                        year={selectedYear}
                      />
                    )}
                    <button onClick={() => setViewingSlip(emp)} className="slip-btn">Slip</button>
                  </td>
                </tr>
              ))}
            </tbody>
            {employeeList.length > 0 && (
              <tfoot className="table-footer">
                <tr>
                  <td colSpan="5" className="right">TOTAL:</td>
                  <td>₹{totals.salary}</td>
                  <td className="text-a">₹{totals.advance}</td>
                  <td className="text-net">₹{totals.net}</td>
                  <td className="no-print"></td>
                </tr>
              </tfoot>
            )}
          </table>

          {employeeList.length === 0 && (
            <div className="empty-state">No records found for this period.</div>
          )}
        </div>

        {/* --- SIGNATURE AREA --- */}
        <div className="print-only signature-section">
          <div className="sig-box">Checked By</div>
          <div className="sig-box">Manager/Authorized Sign</div>
        </div>
      </div>

      {/* --- SALARY SLIP MODAL --- */}
      {viewingSlip && (
        <div className="modal-overlay no-print" onClick={() => setViewingSlip(null)}>
          <div className="modal-content slip-paper" onClick={e => e.stopPropagation()}>
            <button className="close-x" onClick={() => setViewingSlip(null)}>&times;</button>
            <div className="modal-scroll-area">
              <SalarySlip
                emp={viewingSlip}
                month={selectedMonth.toUpperCase()}
                year={selectedYear}
              />
            </div>
            <div className="modal-actions">
              <button className="print-report-btn" onClick={handlePrintSlip}>Print This Slip</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .attendance-history { 
            padding: 20px; 
            max-width: 1200px; 
            margin: 0 auto;
        }
        
        /* RESPONSIVE HEADER */
        .app-header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            padding-bottom: 20px; 
            border-bottom: 1px solid #ddd;
            gap: 20px;
            flex-wrap: wrap; /* Allows wrapping on small screens */
        }
        .attendance-history .brand h2 { font-size: 22px; margin:0; padding: 5px 0; }
        .attendance-history .brand p { text-transform: uppercase; font-size:14px; color: #666; }
        
        .controls { 
            display: flex; 
            gap: 10px; 
            align-items: center;
            flex-wrap: wrap;
        }
        .select-group { display: flex; gap: 8px; }

        /* TABLE RESPONSIVENESS */
        .table-wrapper { 
            width: 100%; 
            overflow-x: auto; /* Standard horizontal scroll for mobile */
            margin-top: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
            -webkit-overflow-scrolling: touch;
        }

        .pro-table { min-width: 800px; width: 100%; border-collapse: collapse; font-size: 14px; }
        .pro-table th { text-align: center; background: #2c3e50; color: white; padding: 12px; white-space: nowrap; }
        .pro-table td { padding: 12px; border-bottom: 1px solid #eee; white-space: nowrap; }
        
        /* COLORS & UI */
        .text-p { color: #27ae60; font-weight: bold; }
        .text-a { color: #e74c3c; font-weight: bold; }
        .text-net { font-size: 15px; font-weight: 800; color: #2c3e50; }
        .print-report-btn { background: #34495e; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; font-weight: 600; white-space: nowrap; }
        .slip-btn { background: #3498db; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; }
        .empty-state { padding: 40px; text-align: center; color: #888; }

        /* MODAL RESPONSIVENESS */
        .modal-overlay { position: fixed; inset: 0; background:rgba(0,0,0,0.85); display:flex; justify-content:center; align-items:center; z-index:999; padding: 15px; }
        .slip-paper { 
            background: white; 
            padding: 30px; 
            border-radius: 8px; 
            position: relative; 
            width: 100%; 
            max-width: 858px; 
            max-height: 90vh; 
            display: flex; 
            flex-direction: column; 
        }
        .modal-scroll-area { overflow-y: auto; padding: 10px 0; }
        .close-x { position: absolute; right: 15px; top: 10px; font-size: 28px; border: none; background: none; cursor: pointer; color: #333; z-index: 10; }

        /* MOBILE OVERRIDES (Phones) */
        @media (max-width: 600px) {
            .attendance-history { padding: 10px; }
            .attendance-history .brand p{
              padding: 0;
              margin: 0;
            }
            .attendance-history .container{padding: 0;}
            .app-header { flex-direction: column; }
            .controls { width: 100%; justify-content: center; }
            .select-group { width: 100%; }
            .select-group select { flex: 1; padding: 5px;}
            .print-report-btn { padding: 10px; }
        }

        /* PRINT STYLES */
        .print-only { display: none; }
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .attendance-history { padding: 0; }
          .table-wrapper { overflow: visible; }
          .pro-table { min-width: 100%; border: 1px solid #000; }
          .pro-table th { background: #eee !important; color: black !important; border: 1px solid #000; }
          .pro-table td { border: 1px solid #000; }
          .print-header { text-align: center; margin-bottom: 20px; }
          .signature-section { display: flex !important; justify-content: space-between; margin-top: 50px; }
          .sig-box { border-top: 1.5px solid #000; width: 40%; text-align: center; padding-top: 5px; font-weight: bold; }
        }

        /* --- SLIP PRINTING LOGIC --- */
  @media print {
    /* When we are printing a SLIP, hide the main report and table */
    body.printing-slip .no-print,
    body.printing-slip .app-header,
    body.printing-slip .table-wrapper,
    body.printing-slip .print-only,
    body.printing-slip .signature-section {
      display: none !important;
    }

    /* Show only the modal content and make it fill the page */
    body.printing-slip .modal-overlay {
      position: static !important;
      display: block !important;
      padding: 0 !important;
      background: none !important;
    }

    body.printing-slip .modal-content {
      box-shadow: none !important;
      border: none !important;
      width: 100% !important;
      max-width: none !important;
    }

    /* Hide the 'Print' and 'Close' buttons on the actual printed paper */
    body.printing-slip .modal-actions,
    body.printing-slip .close-x {
      display: none !important;
    }
  }
      `}</style>
    </section>
  );
}