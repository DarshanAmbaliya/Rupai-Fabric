import React, { useEffect, useState } from "react";
import axios from "axios";
import './Productionreport.css';

const ProductionReport = () => {
  const currentMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM
  const [month, setMonth] = useState(currentMonthStr);
  const [tableData, setTableData] = useState([]);
  const [operators, setOperators] = useState([]);
  const [totals, setTotals] = useState({});
  const [grandTotal, setGrandTotal] = useState(0);

  const API_BASE_URL = window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://rupai-fabric-n9zz.onrender.com";

  const API_URL = `${API_BASE_URL}/api/production/`;

  // --- FILTER STATES ---
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchData();
  }, [month]);

  const fetchData = async () => {
    try {
      const res = await axios.get(
        `${API_URL}month?month=${month}`
      );
      const monthData = res.data;

      // 1. Get unique operators
      const operatorSet = new Set();
      Object.values(monthData).forEach((day) => {
        day.operator_data.forEach((op) => {
          if (op.operator_name) operatorSet.add(op.operator_name);
        });
      });
      const operatorList = Array.from(operatorSet);
      setOperators(operatorList);

      // 2. Prepare raw table rows and initial totals
      const totalMeters = {};
      operatorList.forEach((opName) => (totalMeters[opName] = 0));

      const table = Object.keys(monthData)
        .sort((a, b) => {
          const [dayA, monthA, yearA] = a.split("-");
          const [dayB, monthB, yearB] = b.split("-");

          const dateA = new Date(`${yearA}-${monthA}-${dayA}`);
          const dateB = new Date(`${yearB}-${monthB}-${dayB}`);

          return dateA - dateB; // ascending order
        })
        .map((date) => {
          const row = { date, dailyTotal: 0 };
          operatorList.forEach((opName) => {
            const opData = monthData[date].operator_data.find(
              (o) => o.operator_name === opName
            );

            const meterSum = opData
              ? opData.machine_production.reduce((sum, m) => sum + m.meter, 0)
              : 0;

            row[opName] = meterSum;
            row.dailyTotal += meterSum;
            totalMeters[opName] += meterSum;
          });
          return row;
        });

      const totalOfAllOperators = Object.values(totalMeters).reduce(
        (sum, val) => sum + val,
        0
      );

      setTotals(totalMeters);
      setTableData(table);
      setGrandTotal(totalOfAllOperators);
    } catch (err) {
      console.error(err);
      setTableData([]);
      setOperators([]);
      setTotals({});
      setGrandTotal(0);
    }
  };

  // --- FILTER LOGIC ---
  const filteredData = tableData.filter((row) => {
    if (!startDate && !endDate) return true;

    // Extract day number (e.g., "13" -> 13)
    const day = parseInt(row.date);
    const startDay = startDate ? parseInt(startDate.split("-")[2]) : 0;
    const endDay = endDate ? parseInt(endDate.split("-")[2]) : 32;

    return day >= startDay && day <= endDay;
  });

  // Calculate dynamic totals for the current view
  const currentViewGrandTotal = filteredData.reduce((sum, row) => sum + row.dailyTotal, 0);

  return (
    <section className="production-report-section">
      <div className="container">
        <div className="row">
          <h2>Production Report</h2>

          <div className="filter-controls">
            <div className="filter-menu">
              <label><strong>Month: </strong></label>
              <input
                type="month"
                value={month}
                onChange={(e) => {
                  setMonth(e.target.value);
                  setStartDate(""); // Reset day filters when month changes
                  setEndDate("");
                }}
              />
            </div>

            <div className="filter-menu">
              <label><strong>From Date: </strong></label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (endDate && e.target.value > endDate) setEndDate("");
                }}
              />
            </div>

            <div className="filter-menu">
              <label><strong>To Date: </strong></label>
              <input
                type="date"
                value={endDate}
                min={startDate} // This prevents selecting a date before "From Date"
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {(startDate || endDate) && (
              <button
                onClick={() => { setStartDate(""); setEndDate(""); }}
                style={{ cursor: 'pointer' }}
              >
                Clear Filters
              </button>
            )}
          </div>

          <div className="production-data" style={{ overflowX: 'auto' }}>
            <table
              border="1"
              cellPadding="10"
              style={{ marginTop: "20px", borderCollapse: "collapse", width: "100%", textAlign: "center" }}
            >
              <thead style={{ background: "#eee" }}>
                <tr>
                  <th>Date</th>
                  {operators.map((op) => (
                    <th key={op}>{op}</th>
                  ))}
                  <th>Daily Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map((row) => (
                    <tr key={row.date}>
                      <td>{row.date}</td>
                      {operators.map((op) => (
                        <td key={op}>{row[op] || 0}</td>
                      ))}
                      <td style={{ fontWeight: 'bold' }}>{row.dailyTotal}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={operators.length + 2}>No data found for selected range.</td>
                  </tr>
                )}
              </tbody>
              <tfoot style={{ background: "#e9ecef", fontWeight: "bold" }}>
                <tr>
                  <td>Total</td>
                  {operators.map((op) => (
                    <td key={op}>
                      {filteredData.reduce((sum, row) => sum + (row[op] || 0), 0)}
                    </td>
                  ))}
                  <td>{currentViewGrandTotal}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductionReport;