import React, { useEffect, useState } from 'react';
import { Route, Routes, Navigate, useNavigate, NavLink } from 'react-router-dom';
import { UAParser } from 'ua-parser-js';
import bcrypt from "bcryptjs";
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

const getDeviceDetails = () => {
  const parser = new UAParser();
  const res = parser.getResult();
  const vendor = res.device.vendor || "";
  const model = res.device.model || "";
  const os = res.os.name || "";
  if (!vendor && !model) return `Desktop (${os})`;
  return `${vendor} ${model} (${os})`.trim();
};

const USERS_DB = [
  { username: 'admin', hash: '$2b$10$JFjSmI3KdAiP9diWPHnloOtkBmOAIteR8XHSodNInc4e/uDeZYw3.', role: 'admin', name: 'Administrator' },
  { username: 'demo', hash: '$2b$10$P8.kmq08IebevVfYBV2HRuklURWXNBcKqqcub5PnWpYaYUA6iUSX2', role: 'demo', name: 'Manager' },
  { username: 'master', hash: '$2b$10$ofJDM5/K4O65.j0rtiaZyOeIHZhRP837o.5tVLtQKkpChGIVMDan6', role: 'user', name: 'Staff' }
];

function App() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // PASTE YOUR URL HERE
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxzYPp_rqBf-mXz30-N4zIZMXvRPJ8_L7mHiH9oC4U-GNjl5Ml2npGGm_uKNrnIXOb6/exec';

  // Function to send data to Sheet
  const logToSheet = (user, status) => {
    fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: user.username,
        role: user.role,
        device: user.device || getDeviceDetails(),
        login_time: new Date().toLocaleTimeString(),
        status: status // "Login" or "Logout"
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

  const handleLogin = (e) => {
    e.preventDefault();
    const userMatch = USERS_DB.find(
      (u) => u.username.toLowerCase() === credentials.username.toLowerCase() &&
        bcrypt.compareSync(credentials.password, u.hash)
    );

    if (userMatch) {
      const deviceInfo = getDeviceDetails();
      const today = new Date().toLocaleDateString();
      const sessionData = { ...userMatch, device: deviceInfo, loginDate: today };

      // SEND LOGIN STATUS
      logToSheet(sessionData, "Login");

      setCurrentUser(sessionData);
      localStorage.setItem('authUser', JSON.stringify(sessionData));
      setError('');
      navigate('/');
    } else {
      setError('Invalid username or password');
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

  if (!currentUser) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px' }}>
        <div style={{ display: 'inline-block', padding: '30px', border: '1px solid #ddd', borderRadius: '10px' }}>
          <h2>System Login</h2>
          <form onSubmit={handleLogin}>
            <input type="text" placeholder="Username" onChange={e => setCredentials({ ...credentials, username: e.target.value })} required style={{ display: 'block', margin: '10px auto', padding: '10px' }} />
            <input type="password" placeholder="Password" onChange={e => setCredentials({ ...credentials, password: e.target.value })} required style={{ display: 'block', margin: '10px auto', padding: '10px' }} />
            <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '5px' }}>Login</button>
          </form>
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
      </div>
    );
  }

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
        <Route path='/' element={<Homepage currentUser={currentUser} />} />
        <Route path='/attendance' element={<AttendancePage currentUser={currentUser} />} />
        <Route path='/production' element={<Production />} />
        <Route path="/production/:date?" element={<Production />} />
        <Route path='/fabric' element={<Fabricquality />} />
        <Route path='/yarn' element={<YarnQuality />} />
        <Route path='/attendancerecord' element={currentUser.role === 'admin' ? <AttendanceRecord /> : <Navigate to="/" />} />
        <Route path='/productionreport' element={currentUser.role === 'admin' ? <ProductionReport /> : <Navigate to="/" />} />
        <Route path='/adminreport' element={<AdminReport currentUser={currentUser} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;