import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import chandraaLogo from '/src/assets/images/CHANDRAA.png';
import webSixLogo from '/src/assets/images/WEB SIX.png';
import '../../assets/styles/UserDashboard.css';

export default function UserDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    try {
      const authData = JSON.parse(localStorage.getItem("auth"));
      return authData?.profile || null;
    } catch {
      return null;
    }
  });
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState('');
  const [dateInfo, setDateInfo] = useState({ day: '', daynum: '', month: '', year: '' });
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Check authentication and redirect if not logged in
  useEffect(() => {
    const authData = JSON.parse(localStorage.getItem("auth"));
    if (!authData) {
      navigate('/login');
    }
  }, [navigate]);

  // Real-time clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-US", { hour12: true }));
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Static date on load
  useEffect(() => {
    const today = new Date();
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    setDateInfo({
      day: days[today.getDay()],
      daynum: today.getDate(),
      month: months[today.getMonth()],
      year: today.getFullYear()
    });
  }, []);

  const getAuthData = () => {
    try {
      return JSON.parse(localStorage.getItem("auth"));
    } catch {
      return null;
    }
  };

  const getUserId = () => {
    const authData = getAuthData();
    return authData?.profile?.id || authData?.user?.id || null;
  };

  const getToken = () => {
    const authData = getAuthData();
    return authData?.session?.access_token || null;
  };

  const fetchUser = async (userId) => {
    try {
      const token = getToken();
      const res = await fetch(`http://localhost:3000/users/me?userId=${userId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch user");
      const data = await res.json();
      setUser(data);
    } catch (err) {
      console.error("User fetch error", err);
    }
  };

  const fetchAttendance = async (userId) => {
    try {
      const token = getToken();
      const res = await fetch(`http://localhost:3000/attendance/me?userId=${userId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch attendance");
      const data = await res.json();
      setAttendance(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Attendance fetch error", err);
    }
  };

  const fetchAttendanceSummary = async (userId, month, year) => {
    try {
      const token = getToken();
      const res = await fetch(
        `http://localhost:3000/attendance/summary?userId=${userId}&month=${month}&year=${year}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      if (!res.ok) throw new Error("Failed to fetch attendance summary");
      const data = await res.json();
      setSummary(data);
    } catch (err) {
      console.error("Attendance summary error", err);
      setSummary(null);
    }
  };

  useEffect(() => {
    const userId = getUserId();
    if (userId) {
      fetchUser(userId);
      fetchAttendance(userId);
    }
  }, []);

  const handleCheckIn = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch("http://localhost:3000/attendance/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userId: user.id }),
      });
      const result = await res.json();
      if (res.ok) {
        fetchAttendance(user.id);
        alert("✅ Checked in successfully");
      } else {
        alert(result.message || "Check-in failed");
      }
    } catch {
      alert("Error during check-in");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch("http://localhost:3000/attendance/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userId: user.id }),
      });
      const result = await res.json();
      if (res.ok) {
        fetchAttendance(user.id);
        alert("✅ Checked out successfully");
      } else {
        alert(result.message || "Check-out failed");
      }
    } catch {
      alert("Error during check-out");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("auth");
    navigate('/login');
  };

  const handleShowSummary = async () => {
    const userId = getUserId();
    if (userId) {
      await fetchAttendanceSummary(userId, selectedMonth, selectedYear);
      setShowSummary(true);
    }
  };

  const today = new Date().toISOString().split("T")[0];
  const todayRecord = attendance.find((a) => a.date === today);
  const hasCheckedIn = Boolean(todayRecord?.check_in);
  const hasCheckedOut = Boolean(todayRecord?.check_out);
  const isAbsentToday = todayRecord?.is_absent || false;

  const formatTime = (datetime) => {
    try {
      if (!datetime) return "-";
      const dateObj = new Date(datetime);
      return dateObj.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return "-";
    }
  };

  // Generate month options
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(2000, i, 1).toLocaleString('default', { month: 'long' })
  }));

  // Generate year options (last 5 years to current year)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  return (
    <div className="container">
      {/* Left Sidebar */}
      <div className="sidebar">
        <div className="profilePic">
          {user?.profile_url ? (
            <img
              src={user.profile_url}
              alt="Profile"
              style={{ width: "100%", height: "100%", borderRadius: "50%" }}
            />
          ) : (
            <div className="profile-placeholder">
              {user?.name?.charAt(0) || 'U'}
            </div>
          )}
        </div>
        <h1>{user?.name || 'User'}</h1>
        <small>{user?.email}</small>
        <small><strong>Role:</strong> {user?.role}</small>
        {user?.designation && <small><strong>Designation:</strong> {user.designation}</small>}
        {user?.employee_id && <small><strong>Emp ID:</strong> {user.employee_id}</small>}
        
        {/* Summary Section in Sidebar */}
        <div className="summary-section">
          <h3>Today's Status</h3>
          <div className={`status-indicator ${isAbsentToday ? 'absent' : hasCheckedOut ? 'completed' : hasCheckedIn ? 'checked-in' : 'not-checked'}`}>
            {isAbsentToday ? 'Absent' : 
             hasCheckedOut ? 'Completed' : 
             hasCheckedIn ? 'Checked In' : 'Not Checked In'}
          </div>
          
          {todayRecord?.check_in && (
            <div className="today-times">
              <div><strong>Check-in:</strong> {formatTime(todayRecord.check_in)}</div>
              {todayRecord.check_out && (
                <div><strong>Check-out:</strong> {formatTime(todayRecord.check_out)}</div>
              )}
            </div>
          )}
        </div>

        {/* Attendance Summary Controls */}
        <div className="summary-controls">
          <h3>Monthly Summary</h3>
          <div className="summary-filters">
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="summary-select"
            >
              {monthOptions.map(month => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="summary-select"
            >
              {yearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <button onClick={handleShowSummary} className="summary-btn">
            View Summary
          </button>
        </div>

        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>

      {/* Right Main Panel */}
      <div className="main">
        {/* Logos Row */}
        <div className="logos">
          <img src={chandraaLogo} alt="Chandraa Logo" />
          <img src={webSixLogo} alt="WebSix Logo" />
        </div>

        {/* Date & Time */}
        <div className="datetime-widget">
          <div className="display-date">
            {dateInfo.day}, {dateInfo.daynum} {dateInfo.month} {dateInfo.year}
          </div>
          <div className="display-time">{time}</div>
        </div>

        {/* Check In / Out Buttons */}
        <div className="buttons">
          <div className="btnCard">
            <button 
              onClick={handleCheckIn} 
              disabled={loading || hasCheckedIn || isAbsentToday}
              className={hasCheckedIn ? 'disabled' : ''}
            >
              {loading && !hasCheckedOut ? "Processing..." : 
               isAbsentToday ? "Absent Today" :
               hasCheckedIn ? "Already Checked In" : "Check In"}
            </button>
          </div>
          <div className="btnCard">
            <button 
              onClick={handleCheckOut} 
              disabled={loading || !hasCheckedIn || hasCheckedOut || isAbsentToday}
              className={!hasCheckedIn || hasCheckedOut ? 'disabled' : ''}
            >
              {loading && hasCheckedIn ? "Processing..." : 
               isAbsentToday ? "Absent Today" :
               !hasCheckedIn ? "Check In First" :
               hasCheckedOut ? "Already Checked Out" : "Check Out"}
            </button>
          </div>
        </div>

        {/* Attendance Summary Modal */}
        {showSummary && summary && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Attendance Summary - {monthOptions.find(m => m.value === selectedMonth)?.label} {selectedYear}</h2>
                <button onClick={() => setShowSummary(false)} className="close-btn">&times;</button>
              </div>
              <div className="summary-stats">
                <div className="stat-card">
                  <h3>Total Days</h3>
                  <p>{summary.total_days}</p>
                </div>
                <div className="stat-card present">
                  <h3>Present Days</h3>
                  <p>{summary.present_days}</p>
                </div>
                <div className="stat-card absent">
                  <h3>Absent Days</h3>
                  <p>{summary.absent_days}</p>
                </div>
                <div className="stat-card half">
                  <h3>Half Days</h3>
                  <p>{summary.half_days}</p>
                </div>
                <div className="stat-card avg">
                  <h3>Avg Work Hours</h3>
                  <p>{summary.average_work_hours}h</p>
                </div>
              </div>
              <div className="modal-body">
                <h3>Daily Records</h3>
                <div className="summary-table-container">
                  <table className="summary-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Check In</th>
                        <th>Check Out</th>
                        <th>Total Time</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.records.map((record, index) => (
                        <tr key={index} className={record.status.toLowerCase().replace(' ', '-')}>
                          <td>{record.date}</td>
                          <td>{record.check_in || '-'}</td>
                          <td>{record.check_out || '-'}</td>
                          <td>{record.total_time || '-'}</td>
                          <td>
                            <span className={`status-badge ${record.status.toLowerCase().replace(' ', '-')}`}>
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Attendance Table */}
        <div className="tableTitle">My Attendance</div>
        <div className="tableContainer">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Total Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {attendance.length > 0 ? (
                attendance.map((rec) => (
                  <tr key={rec.id || rec.date} className={rec.status?.toLowerCase().replace(' ', '-')}>
                    <td>{rec.date}</td>
                    <td>{formatTime(rec.check_in)}</td>
                    <td>{formatTime(rec.check_out)}</td>
                    <td>{rec.total_time_formatted ?? "-"}</td>
                    <td>
                      <span className={`status-badge ${rec.status?.toLowerCase().replace(' ', '-')}`}>
                        {rec.status || (rec.is_absent ? 'Absent' : 
                          (rec.check_in && !rec.check_out ? 'Checked In' :
                          (rec.check_in && rec.check_out ? 'Checked Out' : 'Not Checked In')))}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">No records found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}