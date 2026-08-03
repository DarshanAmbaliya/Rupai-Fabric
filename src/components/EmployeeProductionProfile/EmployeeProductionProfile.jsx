import React, { useEffect, useState, useMemo, useRef } from "react";
import Chart from "react-apexcharts";
import axios from "axios";
import "./EmployeeProductionProfile.css";
import { NavLink } from "react-router-dom";

const EmployeeProductionProfile = ({ employeeId, onClose }) => {
  const currentMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM
  // --- STATE MANAGEMENT ---
  const [selectedOperatorId, setSelectedOperatorId] = useState(employeeId);
  const [operatorsList, setOperatorsList] = useState([]);
  const [startDate, setStartDate] = useState(currentMonthStr + "-01");
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [rawMonthlyData, setRawMonthlyData] = useState({});
  const [avatarImage, setAvatarImage] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [showImageViewer, setShowImageViewer] = useState(false);

  // Chart Metric Selector State ("meters" | "machines" | "picks" | "efficiency")
  const [selectedChartMetric, setSelectedChartMetric] = useState("meters");

  const fileInputRef = useRef(null);
  const API_BASE_URL = window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://rupai-fabric-n9zz.onrender.com";

  // Helper: Find all YYYY-MM strings within a selection range
  const getMonthsInRange = (start, end) => {
    const months = [];
    let current = new Date(start);
    const stop = new Date(end);
    while (current <= stop) {
      months.push(current.toISOString().slice(0, 7));
      current.setMonth(current.getMonth() + 1);
    }
    return [...new Set(months)];
  };

  // --- FETCH DATA ---
  useEffect(() => {
    if (!startDate || !endDate) return;

    const fetchRangeData = async () => {
      setLoading(true);
      try {
        const monthsNeeded = getMonthsInRange(startDate, endDate);
        const promises = monthsNeeded.map(m =>
          axios.get(`${API_BASE_URL}/api/production/month?month=${m}`)
        );

        const responses = await Promise.all(promises);
        const combinedData = {};
        const globalOperatorsMap = new Map();

        responses.forEach(res => {
          if (res.data) {
            Object.assign(combinedData, res.data);
            Object.values(res.data).forEach((day) => {
              if (day.operator_data) {
                day.operator_data.forEach((op) => {
                  if (op.operator_id && op.operator_name) {
                    globalOperatorsMap.set(op.operator_id, op.operator_name.trim());
                  }
                });
              }
            });
          }
        });

        setRawMonthlyData(combinedData);
        setOperatorsList(Array.from(globalOperatorsMap.entries()).map(([id, name]) => ({ id, name })));
      } catch (err) {
        console.error("Error fetching analytics profile details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRangeData();
  }, [startDate, endDate, API_BASE_URL]);

  useEffect(() => {
    if (!selectedOperatorId) return;
    const fetchProfileImage = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/employee-profile/${selectedOperatorId}`
        );

        setProfileImage(
          res.data.profilePicture?.url || ""
        );
      } catch (err) {
        setProfileImage("");
      }
    };
    fetchProfileImage();
  }, [selectedOperatorId]);

  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };

  // Find Selected Operator's Name for Display Profile
  const currentOperatorName = useMemo(() => {
    const op = operatorsList.find(o => o.id === selectedOperatorId);
    return op ? op.name : "Operator";
  }, [operatorsList, selectedOperatorId]);

  // --- PROCESS AND AGGREGATE CALCULATIONS ---
  const stats = useMemo(() => {
    let totalMeters = 0;
    let totalMachinesCountAllDays = 0;
    let totalEfficiencySum = 0;
    let totalMachinePickSum = 0;
    let totalMachinesMeasured = 0;
    let totalDaysActive = 0;
    let totalLostMeter = 0;

    const chartDates = [];
    const chartMeters = [];
    const chartMachinesRun = [];
    const chartPicks = [];
    const chartEfficiency = [];
    const chartLostMeter = [];
    const dailyTableData = [];

    const startTs = new Date(startDate).setHours(0, 0, 0, 0);
    const endTs = new Date(endDate).setHours(23, 59, 59, 999);

    const sortedDays = Object.keys(rawMonthlyData).sort((a, b) => {
      const [d1, m1, y1] = a.split("-");
      const [d2, m2, y2] = b.split("-");
      return new Date(`${y1}-${m1}-${d1}`) - new Date(`${y2}-${m2}-${d2}`);
    });

    sortedDays.forEach((dateStr) => {
      const [d, m, y] = dateStr.split("-");
      const dayTimestamp = new Date(`${y}-${m}-${d}`).getTime();

      if (dayTimestamp >= startTs && dayTimestamp <= endTs) {
        const dayPayload = rawMonthlyData[dateStr];
        if (!dayPayload || !dayPayload.operator_data) return;

        const operatorObj = dayPayload.operator_data.find(op => op.operator_id === selectedOperatorId);

        if (operatorObj && operatorObj.machine_production) {
          const validMachines = operatorObj.machine_production.filter(m => {
            if (!m || Object.keys(m).length === 0) return false;
            return !((m.meter || 0) === 0 && (m.efficiency || 0) === 0);
          });

          if (validMachines.length > 0) {
            totalDaysActive++;
            totalMachinesCountAllDays += validMachines.length;

            let dailyMeterSum = 0;
            let dailyEffSum = 0;
            let dailyPickSum = 0;
            let dailyLostMeter = 0;

            validMachines.forEach((mach) => {
              const meter = Number(mach.meter || 0);
              const rpm = Number(mach.rpm || 0);
              const efficiency = Number(mach.efficiency || 0);
              const pick = Number(mach.pick || 0);

              dailyMeterSum += meter;
              dailyEffSum += efficiency;
              dailyPickSum += (mach.machinePick || 0);

              if (rpm > 0 && pick > 0) {
                const actualProduction =
                  (rpm * 12 * 60 * (efficiency / 100)) /
                  (39.37 * pick);

                const lostMeter = meter - actualProduction;

                dailyLostMeter += lostMeter;
                totalLostMeter += lostMeter;
              }

              totalMachinesMeasured++;
            });

            const activeEffMachines = validMachines.filter(
              (m) => (m.efficiency || 0) > 0
            );

            const avgEfficiency =
              activeEffMachines.length > 0
                ? Number(
                  (
                    activeEffMachines.reduce(
                      (sum, m) => sum + (m.efficiency || 0),
                      0
                    ) / activeEffMachines.length
                  ).toFixed(2)
                )
                : 0;

            const activePickMachines = validMachines.filter(
              (m) => (m.machinePick || 0) > 0
            );

            const avgPickPerMachine =
              activePickMachines.length > 0
                ? Number(
                  (dailyPickSum / activePickMachines.length).toFixed(2)
                )
                : 0;

            dailyTableData.push({
              date: dateStr,
              avgEfficiency,
              avgPickPerMachine,
              totalPick: dailyPickSum,
              lostMeter: Number(dailyLostMeter.toFixed(2)),
              totalProduction: dailyMeterSum,
            });

            totalMeters += dailyMeterSum;
            totalEfficiencySum += dailyEffSum;
            totalMachinePickSum += dailyPickSum;

            chartDates.push(dateStr);
            chartMeters.push(dailyMeterSum);
            chartMachinesRun.push(validMachines.length);
            chartPicks.push(parseFloat((dailyPickSum / validMachines.length).toFixed(2)));
            chartEfficiency.push(parseFloat((dailyEffSum / validMachines.length).toFixed(2)));
            chartLostMeter.push(parseFloat(dailyLostMeter.toFixed(2)));
          }
        }
      }
    });

    let targetedSeriesName = "Production Meter";
    let targetedChartData = chartMeters;
    let yAxisUnit = "Meters";

    if (selectedChartMetric === "machines") {
      targetedSeriesName = "Machines Run";
      targetedChartData = chartMachinesRun;
      yAxisUnit = "Count";
    } else if (selectedChartMetric === "picks") {
      targetedSeriesName = "Avg Machine Pick";
      targetedChartData = chartPicks;
      yAxisUnit = "Picks";
    } else if (selectedChartMetric === "efficiency") {
      targetedSeriesName = "Avg Efficiency";
      targetedChartData = chartEfficiency;
      yAxisUnit = "%";
    } else if (selectedChartMetric === "lostmeter") {
      targetedSeriesName = "Lost Production Meter";
      targetedChartData = chartLostMeter;
      yAxisUnit = "Meters";
    }

    return {
      totalMeters,
      totalLostMeter,
      totalMachinePickSum, // Added to return hook metrics
      avgMachinesPerDay: totalDaysActive > 0 ? (totalMachinesCountAllDays / totalDaysActive).toFixed(2) : 0,
      avgMeterPerMachine: totalMachinesMeasured > 0 ? (totalMeters / totalMachinesMeasured).toFixed(2) : 0,
      avgPickPerMachine: totalMachinesMeasured > 0 ? (totalMachinePickSum / totalMachinesMeasured).toFixed(2) : 0,
      avgEfficiency: totalMachinesMeasured > 0 ? (totalEfficiencySum / totalMachinesMeasured).toFixed(2) : 0,
      chartOptions: {
        chart: { id: "employee-performance-metrics-chart", toolbar: { show: true } },
        xaxis: { categories: chartDates, title: { text: "Dates" } },
        yaxis: { title: { text: yAxisUnit } },
        stroke: { curve: "smooth", width: 3 },
        colors: [
          selectedChartMetric === "lostmeter"
            ? "#dc2626"
            : "#4f46e5"
        ],
        dataLabels: { enabled: true }
      },
      chartSeries: [
        { name: targetedSeriesName, data: targetedChartData }
      ],
      hasChartData: chartDates.length > 0,
      dailyTableData,
    };
  }, [rawMonthlyData, startDate, endDate, selectedOperatorId, selectedChartMetric]);
  const totalEntries = stats.dailyTableData.length;

  const footer = {
    avgEfficiency:
      totalEntries > 0
        ? (
          stats.dailyTableData.reduce(
            (sum, row) => sum + row.avgEfficiency,
            0
          ) / totalEntries
        ).toFixed(2)
        : 0,

    avgPickPerMachine:
      totalEntries > 0
        ? (
          stats.dailyTableData.reduce(
            (sum, row) => sum + row.avgPickPerMachine,
            0
          ) / totalEntries
        ).toFixed(2)
        : 0,

    totalPick: stats.dailyTableData.reduce(
      (sum, row) => sum + row.totalPick,
      0
    ),

    totalLostMeter: stats.dailyTableData.reduce(
      (sum, row) => sum + row.lostMeter,
      0
    ),

    totalProduction: stats.dailyTableData.reduce(
      (sum, row) => sum + row.totalProduction,
      0
    ),
  };

  const minEfficiency = Math.min(
    ...stats.dailyTableData.map(row => Number(row.avgEfficiency))
  );

  const printEmployee = () => {
    document.body.classList.add("print-employee");
    window.print();
    document.body.classList.remove("print-employee");
  };
  return (
    <div className="employee-modal-overlay">
      <div className="employee-modal">
        {/* Fixed Header Elements */}
        <div className="modal-header">
          <h3>Employee Production Profile</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        {/* Fixed Configuration Controllers Dashboard */}
        <div className="modal-controls-bar">
          <div className="control-group">
            <label><strong>Select Operator: </strong></label>
            <select
              value={selectedOperatorId}
              onChange={(e) => setSelectedOperatorId(e.target.value)}
              className="modal-select"
            >
              {operatorsList.map(op => (
                <option key={op.id} value={op.id}>{op.name}</option>
              ))}
            </select>
          </div>
          <div className="control-group">
            <label><strong>From: </strong></label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="control-group">
            <label><strong>To: </strong></label>
            <input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>

        {/* NEW SCROLLABLE BODY CONTAINER WRAPPER */}
        <div className="modal-scrollable-body">
          {loading ? (
            <div className="loading-state">Syncing operational data calculations...</div>
          ) : (
            <div className="main-box">
              {/* Left Box: Operator Photo & Performance Aggregations summary */}
              <div className="box left-box print-section">
                <div className="print-header">
                  <h2>Employee Production Profile</h2>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div className="print-date">
                      <strong>Period :</strong>{" "}
                      {new Date(startDate).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                      {"  "}to{"  "}
                      {new Date(endDate).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </div>

                    <div className="print-date">
                      <strong>Printed On :</strong>{" "}
                      {new Date().toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                  <hr />
                </div>
                <div className="avatar-wrapper">
                  <div className="profile-avatar-container" title="Click to change photo">
                    {profileImage ? (
                      <img
                        src={profileImage}
                        className="profile-photo-img"
                        onClick={() => profileImage && setShowImageViewer(true)}
                      />
                    ) : (
                      <div className="profile-avatar-initial">
                        {currentOperatorName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    style={{ display: "none" }}
                  />
                  <h4 className="profile-name">{currentOperatorName}</h4>
                  <span className="profile-badge">Operator</span>
                </div>

                {/* NEW METRICS GRID LAYOUT STRUCTURE */}
                <div className="metrics-grid">
                  <div className="metric-card-wrapper full-width-card">
                    <div className="metric-header">
                      <span className="metric-title">Total Production</span>
                      <span className="metric-trend-indicator">Live</span>
                    </div>
                    <div className="metric-hero-value">
                      {stats.totalMeters.toLocaleString()} <small>Mtr</small>
                    </div>
                  </div>

                  {/* Added Total Machine Pick Sum Metric Card */}
                  {/* <div className="metric-card-wrapper">
                    <span className="metric-title">Total Machine Pick</span>
                    <div className="metric-sub-value">
                      {stats.totalMachinePickSum.toLocaleString()}
                    </div>
                  </div> */}

                  <div className="metric-card-wrapper">
                    <span className="metric-title">Avg Meter/Machine</span>
                    <div className="metric-sub-value">
                      {stats.avgMeterPerMachine} <small>Mtr</small>
                    </div>
                  </div>

                  <div className="metric-card-wrapper">
                    <span className="metric-title">Avg Machines Run</span>
                    <div className="metric-sub-value">  {stats.avgMachinesPerDay} <small>Active</small></div>
                  </div>

                  {/* <div className="metric-card-wrapper">
                    <span className="metric-title">Avg Machine Pick</span>
                    <div className="metric-sub-value">{stats.avgPickPerMachine}</div>
                  </div> */}

                  <div className="metric-card-wrapper priority-border">
                    <span className="metric-title">Avg Efficiency</span>
                    <div className="metric-sub-value accent-text">
                      {footer.avgEfficiency}%
                    </div>
                  </div>

                  <div className="metric-card-wrapper red-border">
                    <span className="metric-title">Total Lost Meter</span>

                    <div
                      className="metric-sub-value"
                      style={{
                        color: "#dc2626",
                        fontWeight: "700"
                      }}
                    >
                      {stats.totalLostMeter < 0
                        ? `- ${Math.abs(stats.totalLostMeter).toFixed(2)}`
                        : stats.totalLostMeter.toFixed(2)}
                      <small> Mtr</small>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Box: Dynamic Chart Analytics View */}
              <div className="box right-box print-section">
                <div className="chart-header-row">
                  <h4>Production Timeline Trend</h4>
                  <div className="metric-selector">
                    <label><strong>View Metric: </strong></label>
                    <select
                      value={selectedChartMetric}
                      onChange={(e) => setSelectedChartMetric(e.target.value)}
                      className="metric-dropdown"
                    >
                      <option value="meters">Production Meter</option>
                      <option value="machines">Machines Run / Day</option>
                      {/* <option value="picks">Machine Pick</option> */}
                      <option value="efficiency">Avg Efficiency (%)</option>
                      <option value="lostmeter">
                        Lost Production Meter
                      </option>
                    </select>
                  </div>
                </div>

                <div className="chart-container">
                  {stats.hasChartData ? (
                    <Chart
                      options={stats.chartOptions}
                      series={stats.chartSeries}
                      type="line"
                      height="320"
                    />
                  ) : (
                    <div className="no-data-msg">No entries found matching this date range.</div>
                  )}
                </div>

                <div className="employee-table print-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Avg Efficiency %</th>
                        {/* <th>Avg Pick / Machine</th> */}
                        {/* <th>Total Pick</th> */}
                        <th>Lost Meter</th>
                        <th>Total Production (m)</th>
                      </tr>
                    </thead>

                    <tbody>
                      {stats.dailyTableData.map((row) => (
                        <tr key={row.date}>
                          <td>
                            <NavLink to={`/production/${row.date.split('-').reverse().join('-')}`}>
                              {row.date}
                            </NavLink>
                          </td>
                          <td
                            className={Number(row.avgEfficiency) === minEfficiency ? "min-efficiency" : ""}
                          >{row.avgEfficiency}</td>
                          {/* <td>{row.avgPickPerMachine}</td> */}
                          {/* <td>{row.totalPick}</td> */}
                          <td
                            style={{
                              color: row.lostMeter < 0 ? "#dc2626" : "#15803d",
                            }}
                          >
                            {row.lostMeter}
                          </td>
                          <td>{row.totalProduction}</td>
                        </tr>
                      ))}
                    </tbody>

                    <tfoot>
                      <tr>
                        <th>Total / Avg</th>
                        <th>{footer.avgEfficiency}</th>
                        {/* <th>{footer.avgPickPerMachine}</th> */}
                        {/* <th>{footer.totalPick}</th> */}
                        <th>{(footer.totalLostMeter).toFixed(2)}</th>
                        <th>{footer.totalProduction}</th>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="print-button">
          <button className="print-btn" onClick={printEmployee}>
            Print
          </button>
        </div>
      </div>
      {showImageViewer && (
        <div
          className="imageViewer"
          onClick={() => setShowImageViewer(false)}
        >
          <img
            src={profileImage}
            alt={currentOperatorName}
            className="viewerImage"
          />
        </div>
      )}
    </div>
  );
};

export default EmployeeProductionProfile;