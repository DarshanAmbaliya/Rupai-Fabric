import React, { useEffect, useState } from "react";
import axios from "axios";
import './Productionreport.css';
import EmployeeProductionProfile from "../../components/EmployeeProductionProfile/EmployeeProductionProfile";
import { NavLink } from "react-router-dom";

const ProductionReport = () => {
  const currentMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM
  const [month, setMonth] = useState(currentMonthStr);
  const [tableData, setTableData] = useState([]);
  const [operators, setOperators] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [showEmployeeFilter, setShowEmployeeFilter] = useState(false);
  const [searchEmployee, setSearchEmployee] = useState("");
  const [efficiencyThreshold, setEfficiencyThreshold] = useState(85);

  // --- NEW METRIC STATE ---
  const [metric, setMetric] = useState("efficiency"); // Options: meter, efficiency, totalPick, avgPick

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
      const res = await axios.get(`${API_URL}month?month=${month}`);
      const monthData = res.data;

      // 1. Get unique operators
      const operatorMap = new Map();
      Object.values(monthData).forEach((day) => {
        day.operator_data.forEach((op) => {
          if (op.operator_id && op.operator_name) {
            operatorMap.set(op.operator_id, {
              id: op.operator_id,
              name: op.operator_name.trim(),
              shift: op.shift
            });
          }
        });
      });

      const operatorList = Array.from(operatorMap.values());
      setOperators(operatorList);
      setSelectedEmployees(operatorList.map(op => op.id));
      // 2. Prepare raw table rows with conditional metric calculations
      const table = Object.keys(monthData)
        .sort((a, b) => {
          const [dayA, monthA, yearA] = a.split("-");
          const [dayB, monthB, yearB] = b.split("-");
          return new Date(`${yearA}-${monthA}-${dayA}`) - new Date(`${yearB}-${monthB}-${dayB}`);
        })
        .map((date) => {
          const row = { date };

          operatorList.forEach((op) => {
            const opData = monthData[date].operator_data.find(
              (o) => o.operator_id === op.id
            );

            // --- Production Meter Sum ---
            const meterSum = opData
              ? opData.machine_production.reduce((sum, m) => sum + (m.meter || 0), 0)
              : 0;

            // --- CONDITIONAL EFFICIENCY CALCULATION ---
            // Filter out machines where efficiency is 0
            let efficiencyAvg = 0;
            if (opData && opData.machine_production) {
              const activeMachines = opData.machine_production.filter(m => (m.efficiency || 0) > 0);
              if (activeMachines.length > 0) {
                const efficiencySum = activeMachines.reduce((sum, m) => sum + m.efficiency, 0);
                efficiencyAvg = parseFloat((efficiencySum / activeMachines.length).toFixed(2));
              }
            }

            // --- Total Pick Sum ---
            const totalPickSum = opData
              ? opData.machine_production.reduce((sum, m) => sum + (m.machinePick || 0), 0)
              : 0;

            // --- Average Pick per Active Machine ---
            // Filter out machines with 0 machinePick if you want consistent logic
            let avgPickVal = 0;
            if (opData && opData.machine_production) {
              const activePickMachines = opData.machine_production.filter(m => (m.machinePick || 0) > 0);
              if (activePickMachines.length > 0) {
                avgPickVal = parseFloat((totalPickSum / activePickMachines.length).toFixed(2));
              }
            }

            // Store all metrics in an object per operator
            row[op.id] = {
              meter: meterSum,
              efficiency: efficiencyAvg, // Uses the newly calculated dynamic average
              totalPick: totalPickSum,
              avgPick: avgPickVal
            };
          });

          return row;
        });

      setTableData(table);
    } catch (err) {
      console.error(err);
      setTableData([]);
      setOperators([]);
    }
  };

  const handleEmployeeChange = (id) => {
    setSelectedEmployees(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedEmployees.length === operators.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(operators.map(op => op.id));
    }
  };

  const filteredEmployees = operators.filter(op =>
    op.name.toLowerCase().includes(searchEmployee.toLowerCase())
  );

  // --- FILTER LOGIC ---
  const filteredData = tableData.filter((row) => {
    if (!row) return false;
    if (!startDate && !endDate) return true;

    const day = parseInt(row.date.split("-")[0]);
    const startDay = startDate ? parseInt(startDate.split("-")[2]) : 0;
    const endDay = endDate ? parseInt(endDate.split("-")[2]) : 32;

    return day >= startDay && day <= endDay;
  });

  // Helper helper to get the specific metric value for a row & operator
  const getVal = (row, opId) => row[opId]?.[metric] || 0;

  // Dynamically calculate row-level totals or averages based on selection
  const getRowSummary = (row) => {
    const values = operators.map(op => getVal(row, op.id)).filter(v => v > 0);
    if (values.length === 0) return 0;

    // Use Average for efficiency/avgPick, Sum for totals/meters
    if (metric === "efficiency" || metric === "avgPick") {
      const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
      return parseFloat(avg.toFixed(2));
    }
    return values.reduce((sum, v) => sum + v, 0);
  };

  // Calculate Grand Total for the current view
  const currentViewGrandTotal = filteredData.reduce(
    (sum, row) => sum + getRowSummary(row),
    0
  );

  // Labels for headers dynamically changing based on the metric
  const getSummaryHeaderLabel = () => {
    if (metric === "efficiency") return "Daily Avg Eff %";
    if (metric === "avgPick") return "Daily Avg Pick";
    return "Daily Total";
  };

  const getFooterSummaryLabel = () => {
    if (metric === "efficiency" || metric === "avgPick") return "Overall Avg";
    return "Grand Total";
  };

  const visibleOperators = operators.filter(op =>
    selectedEmployees.includes(op.id)
  );

  const sortedOperators = [...visibleOperators].sort((a, b) => {
    if (!sortOrder) return 0;

    const getOperatorGrandTotal = (opId) => {

      const values = filteredData
        .map(row => getVal(row, opId))
        .filter(v => v > 0);

      if (metric === "efficiency" || metric === "avgPick") {
        return values.length
          ? values.reduce((sum, v) => sum + v, 0) / values.length
          : 0;

      }

      return filteredData.reduce(
        (sum, row) => sum + getVal(row, opId),
        0
      );
    };

    const totalA = getOperatorGrandTotal(a.id);
    const totalB = getOperatorGrandTotal(b.id);
    return sortOrder === "asc"
      ? totalA - totalB
      : totalB - totalA;
  });

  const getBonus = (efficiency) => {
    return efficiency > 90 ? Math.floor(efficiency - 90) : 0;
  };

  const printProductionReport = () => {
    document.body.classList.add("print-productionreport");
    window.print();
    document.body.classList.remove("print-productionreport");
  };

  return (
    <section className="production-report-section">
      <div className="container">
        <div className="row">
          <h2>Production Report
            <button className="print-btn" onClick={printProductionReport}>
              Print
            </button>
          </h2>

          <div className="filter-controls">
            {/* --- NEW METRIC DROPDOWN FILTER --- */}
            <div className="filter-menu">
              <label><strong>View Metric: </strong></label>
              <select value={metric} onChange={(e) => setMetric(e.target.value)}>
                <option value="efficiency">Average Efficiency (%)</option>
                <option value="meter">Production Meter (m)</option>
                {/* <option value="totalPick">Total Pick</option>
                <option value="avgPick">Average Pick per Machine</option> */}
              </select>
            </div>

            <div className="filter-menu">
              <label><strong>Month: </strong></label>
              <input
                type="month"
                value={month}
                onChange={(e) => {
                  setMonth(e.target.value);
                  setStartDate("");
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
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="filter-menu">
              <label>
                <strong>Sort Grand Total: </strong>
              </label>

              <select
                value={sortOrder || ""}
                onChange={(e) =>
                  setSortOrder(e.target.value || null)
                }
              >
                <option value="">
                  Default Order
                </option>

                <option value="desc">
                  Highest Grand Total
                </option>

                <option value="asc">
                  Lowest Grand Total
                </option>

              </select>
            </div>
            <div className="filter-menu employee-filter">
              <label><strong>Employees: </strong></label>
              <div
                className="employee-select"
                onClick={() => setShowEmployeeFilter(!showEmployeeFilter)}
              >
                {selectedEmployees.length === operators.length
                  ? "All Employees"
                  : `${selectedEmployees.length} Selected`}

                <span>▼</span>
              </div>
              {showEmployeeFilter && (
                <div className="employee-dropdown">
                  <input
                    type="text"
                    placeholder="Search Employee..."
                    value={searchEmployee}
                    onChange={(e) => setSearchEmployee(e.target.value)}
                  />
                  <label className="employee-item">
                    <input
                      type="checkbox"
                      checked={selectedEmployees.length === operators.length}
                      onChange={handleSelectAll}
                    />
                    Select All
                  </label>
                  <hr />
                  {filteredEmployees.map(op => (
                    <label
                      key={op.id}
                      className="employee-item"
                    >
                      <input
                        type="checkbox"
                        checked={selectedEmployees.includes(op.id)}
                        onChange={() => handleEmployeeChange(op.id)}
                      />
                      {op.name}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {metric === "efficiency" && (
              <div className="filter-menu">
                <label>
                  <strong>Alert Below:</strong>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={efficiencyThreshold}
                  onChange={(e) =>
                    setEfficiencyThreshold(Number(e.target.value) || 0)
                  }
                  placeholder="Enter %"
                />
              </div>
            )}

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
                  <th key="date">Date</th>
                  {sortedOperators.map((op) => (
                    <th
                      key={op.employeeId}
                      className={op.shift === "Night" ? "operator-night" : "operator-day"}
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        setSelectedEmployee(op);
                        setShowProfile(true);
                      }}
                    >
                      {op.name}
                    </th>
                  ))}
                  <th key="daily-total">{getSummaryHeaderLabel()}</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map((row) => (
                    <tr key={row.date}>
                      <td>
                        <NavLink to={`/production/${row.date.split('-').reverse().join('-')}`}>
                          {row.date}
                        </NavLink>
                      </td>
                      {sortedOperators.map((op) => (
                        <td key={op.id} className={
                          metric === "efficiency" && getVal(row, op.id) > 0 && getVal(row, op.id) < efficiencyThreshold
                            ? "alert"
                            : ""
                        }>{getVal(row, op.id)}</td>
                      ))}
                      <td style={{ fontWeight: "bold" }}>{getRowSummary(row)}</td>
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
                  <td>{getFooterSummaryLabel()}</td>
                  {sortedOperators.map((op) => {
                    let sum = 0;
                    let count = 0;

                    filteredData.forEach((row) => {
                      const value = Number(getVal(row, op.id)) || 0;

                      if (value > 0) {
                        sum += value;
                        count++;
                      }
                    });

                    const footerVal =
                      metric === "efficiency" || metric === "avgPick"
                        ? (count > 0 ? Number((sum / count).toFixed(2)) : 0)
                        : filteredData.reduce((total, row) => total + (Number(getVal(row, op.id)) || 0), 0);

                    return <td key={op.id}>{footerVal}</td>;
                  })}
                  <td>
                    {(() => {
                      if (metric === "efficiency" || metric === "avgPick") {
                        let totalAvg = 0;
                        let employeeCount = 0;

                        sortedOperators.forEach((op) => {
                          const values = filteredData
                            .map((row) => getVal(row, op.id))
                            .filter((v) => v > 0);

                          if (values.length > 0) {
                            const avg =
                              values.reduce((sum, v) => sum + v, 0) / values.length;

                            totalAvg += avg;
                            employeeCount++;
                          }
                        });

                        return employeeCount
                          ? parseFloat((totalAvg / employeeCount).toFixed(2))
                          : 0;
                      }

                      return currentViewGrandTotal;
                    })()}
                  </td>
                </tr>
                <tr>
                  <td>Bonus</td>

                  {sortedOperators.map((op) => {
                    const totalBonus = filteredData.reduce((sum, row) => {
                      const efficiency = row[op.id]?.efficiency || 0;
                      return sum + getBonus(efficiency);
                    }, 0);

                    return (
                      <td key={op.id}>
                        {totalBonus}
                      </td>
                    );
                  })}

                  <td>
                    {sortedOperators.reduce((sum, op) => {
                      return (
                        sum +
                        filteredData.reduce((bonus, row) => {
                          const efficiency = row[op.id]?.efficiency || 0;
                          return bonus + getBonus(efficiency);
                        }, 0)
                      );
                    }, 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {showProfile && (
            <EmployeeProductionProfile
              employeeId={selectedEmployee.id}
              onClose={() => setShowProfile(false)}
            />
          )}
        </div>
      </div>
    </section>
  );
};

export default ProductionReport;