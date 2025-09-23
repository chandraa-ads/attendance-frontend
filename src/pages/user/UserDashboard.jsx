import React, { useEffect, useState } from 'react';
import chandraaLogo from '/src/assets/images/CHANDRAA.png';
import webSixLogo from '/src/assets/images/WEB SIX.png';
import '../../assets/styles/UserDashboard.css';

export default function UserDashboard() {
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
      const res = await fetch(`https://attendance-backend-d4vi.onrender.com/users/me?userId=${userId}`, {
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
      const res = await fetch(`https://attendance-backend-d4vi.onrender.com/attendance/me?userId=${userId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch attendance");
      const data = await res.json();
      setAttendance(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Attendance fetch error", err);
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
      const res = await fetch("https://attendance-backend-d4vi.onrender.com/attendance/checkin", {
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
      const res = await fetch("https://attendance-backend-d4vi.onrender.com/attendance/checkout", {
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

  const today = new Date().toISOString().split("T")[0];
  const todayRecord = attendance.find((a) => a.date === today);
  const hasCheckedIn = Boolean(todayRecord?.check_in);
  const hasCheckedOut = Boolean(todayRecord?.check_out);

  const formatTime = (datetime) => {
    try {
      if (!datetime) return "-";
      const dateObj = new Date(datetime);
      // Format time in IST timezone, showing hours:minutes:seconds AM/PM
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
          ) : null}
        </div>
        <h1>{user?.name}</h1>
        <small>{user?.email}</small>
        <small><strong>Role:</strong> {user?.role}</small>
        {user?.designation && <small><strong>Designation:</strong> {user.designation}</small>}
        {user?.employee_id && <small><strong>Emp ID:</strong> {user.employee_id}</small>}
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
            <button onClick={handleCheckIn} disabled={loading || hasCheckedIn}>
              {loading && !hasCheckedOut ? "Processing..." : "Check In"}
            </button>
          </div>
          <div className="btnCard">
            <button onClick={handleCheckOut} disabled={loading || !hasCheckedIn || hasCheckedOut}>
              {loading && hasCheckedIn ? "Processing..." : "Check Out"}
            </button>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="tableTitle">My Attendance</div>
        <div className="tableContainer">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Total Time (min)</th>
              </tr>
            </thead>
            <tbody>
              {attendance.length > 0 ? (
                attendance.map((rec) => (
                  <tr key={rec.id || rec.date}>
                    <td>{rec.date}</td>
                    <td>{formatTime(rec.check_in)}</td>
                    <td>{formatTime(rec.check_out)}</td>
                    <td>{rec.total_time_formatted ?? "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">No records found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
