import React, { useEffect, useState } from "react";
import ChandraaLogo from "../../assets/images/CHANDRAA.png";
import WebSixLogo from "../../assets/images/WEB SIX.png";
import { useNavigate } from "react-router-dom";

const API_BASE = "https://attendance-backend-5cvu.onrender.com";

const AdminOption = () => {
  const [admin, setAdmin] = useState({
    name: "Admin",
    email: "admin@gmail.com",
    profileUrl: "https://via.placeholder.com/130",
    userId: null,
  });

  const [attendanceData, setAttendanceData] = useState([]);
  const [userData, setUserData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchEmployeeId, setSearchEmployeeId] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const authData = JSON.parse(localStorage.getItem("auth"));
    if (authData?.profile) {
      setAdmin({
        name: authData.profile.name || "Admin",
        email: authData.profile.email || "admin@gmail.com",
        profileUrl:
          authData.profile.profile_url || "https://via.placeholder.com/130",
        userId: authData.profile.userId || null,
      });
    }
  }, []);

  // 🔍 Fetch Functions
  const fetchAttendanceByEmployeeId = async () => {
    if (!searchEmployeeId) {
      setError("Please enter an employee ID to search.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 🔽 Convert to uppercase before sending to backend
      const normalizedId = searchEmployeeId.trim().toUpperCase();
      const params = new URLSearchParams({ employee_id: normalizedId });

      const res = await fetch(
        `${API_BASE}/attendance/filter-by-employee-id?${params.toString()}`,
        { headers: { accept: "application/json" } }
      );

      if (!res.ok) throw new Error(`Error fetching attendance: ${res.statusText}`);

      const data = await res.json();
      setAttendanceData(data);
      setUserData([]);
    } catch (err) {
      setError(err.message);
      setAttendanceData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllAttendance = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/attendance/all`, {
        headers: { accept: "application/json" },
      });
      if (!res.ok) throw new Error(`Error fetching all attendance: ${res.statusText}`);
      const data = await res.json();
      setAttendanceData(data);
      setUserData([]);
    } catch (err) {
      setError(err.message);
      setAttendanceData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/users/all`, {
        headers: { accept: "application/json" },
      });
      if (!res.ok) throw new Error(`Error fetching users: ${res.statusText}`);
      const data = await res.json();
      setUserData(data);
      setAttendanceData([]);
    } catch (err) {
      setError(err.message);
      setUserData([]);
    } finally {
      setLoading(false);
    }
  };

  // Format helpers
  const formatDate = (d) => d?.slice(0, 10) || "N/A";
  const formatTime = (t) => {
    if (!t) return "N/A";
    const dt = new Date(t);
    return dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body, html, #root { margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background: #f8f9fa; }

        .dashboard-container {
  display: flex;
  min-height: 100vh;
  background: #f8f9fa;
}

/* Sidebar desktop */
.sidebar {
  width: 280px;
  background: #00a6ff;
  color: #fff;
  text-align: center;
  padding: 20px;
  flex-shrink: 0;
}
        .sidebar img {
          border-radius: 50%;
          width: 90px; height: 90px;
          object-fit: cover;
          margin: 10px 0;
          border: 3px solid #fff;
        }
        .sidebar h2 { margin-bottom: 10px; }
        .sidebar h3 { margin: 5px 0; }
        .sidebar p { margin: 0; font-size: 0.9rem; }

        .right-panel {
  flex: 1;
  padding: 30px;
  background: #fff;
  overflow-y: auto;     /* ✅ content not too wide */
  margin: 0 auto;
}

/* Cards layout */
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); /* ✅ wider for desktop */
  gap: 20px;
}
        /* Cards */
        .card {
          background: #f3f4f6;
          padding: 12px;
          border-radius: 8px;
          text-align: center;
          font-size: 0.95rem;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        }
        .card h4 { margin-bottom: 8px; font-size: 1rem; }
        .card input {
          width: 100%;
          padding: 8px;
          margin: 8px 0;
          border-radius: 5px;
          border: 1px solid #ccc;
        }
        .card button {
          display: block;
          width: 100%;
          margin: 6px 0;
          background: #00a6ff;
          border: none;
          color: #fff;
          padding: 8px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 0.85rem;
        }
        .card button:hover { background: #4338ca; }

        /* Tables */
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; text-align: left; font-size: 0.9rem; }
        thead { background: #00a6ff; color: #fff; }
        tbody tr:nth-child(even) { background: #f9f9f9; }
        .table-container { overflow-x: auto; margin-top: 20px; }

        /* Responsive */
        @media (max-width: 768px) {
          .dashboard-container {
    flex-direction: column;   /* ✅ stack on mobile */
  }
  .sidebar {
    width: 100%;
  }
  .right-panel {
    max-width: 100%;
    padding: 15px;
  }
  .cards {
    grid-template-columns: 1fr;
  }
}
      `}</style>

      <div className="dashboard-container">
        {/* Sidebar (top on mobile) */}
        <aside className="sidebar">
          <h2>DASHBOARD</h2>
          <img src={admin.profileUrl} alt={admin.name} />
          <h3>{admin.name}</h3>
          <p>{admin.email}</p>
        </aside>

        {/* Right Panel */}
        <main className="right-panel">
          <div className="top-logos">
            <img src={ChandraaLogo} alt="Chandraa Ads" style={{ height: "50px" }} />
            <img src={WebSixLogo} alt="Web Six" style={{ height: "50px" }} />
          </div>

          {/* Cards */}
          <div className="cards">
            <div className="card">
              <h4>EMPLOYEE DETAILS</h4>
              <button onClick={fetchAllUsers}>Load Users</button>
            </div>

            <div className="card">
              <h4>ATTENDANCE DETAIL</h4>
              <input
                type="text"
                placeholder="Enter employee ID"
                value={searchEmployeeId}
                onChange={(e) => setSearchEmployeeId(e.target.value)}
              />
              <button onClick={fetchAttendanceByEmployeeId}>Search</button>
              <button onClick={fetchAllAttendance}>View All</button>
            </div>

            <div className="card">
              <h4>ADMIN DASHBOARD</h4>
              <button onClick={() => navigate("/admin/dashboard")}>
                Go to Dashboard
              </button>
            </div>
          </div>

          {/* Loader & Error */}
          {loading && <p>Loading...</p>}
          {error && <p style={{ color: "red" }}>{error}</p>}

          {/* User Table */}
          {userData.length > 0 && (
            <div className="table-container">
              <h3>User List</h3>
              <table>
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Profile</th>
                    <th>Designation</th>
                    <th>Email</th>
                    <th>Mobile</th>
                    <th>IEN</th>
                  </tr>
                </thead>
                <tbody>
                  {userData.map((u, i) => (
                    <tr key={i}>
                      <td>{u.employee_id}</td>
                      <td style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <img
                          src={u.profile_url}
                          alt={u.name}
                          style={{ width: "32px", height: "32px", borderRadius: "50%" }}
                        />
                        {u.name}
                      </td>
                      <td>{u.designation}</td>
                      <td>{u.email}</td>
                      <td>{u.mobile}</td>
                      <td>{u.ien}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Attendance Table */}
          {attendanceData.length > 0 && (
            <div className="table-container">
              <h3>Attendance Records</h3>
              <table>
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Profile</th>
                    <th>Email</th>
                    <th>Mobile</th>
                    <th>Designation</th>
                    <th>Date</th>
                    <th>Check-in</th>
                    <th>Check-out</th>
                    <th>Total Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceData.map((rec, i) => {
                    const u = rec.users || {};
                    return (
                      <tr key={i}>
                        <td>{u.employee_id || "N/A"}</td>
                        <td style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <img
                            src={u.profile_url || "https://via.placeholder.com/40"}
                            alt={u.name}
                            style={{ width: "32px", height: "32px", borderRadius: "50%" }}
                          />
                          {u.name || "N/A"}
                        </td>
                        <td>{u.email || "N/A"}</td>
                        <td>{u.mobile || "N/A"}</td>
                        <td>{u.designation || "N/A"}</td>
                        <td>{formatDate(rec.date)}</td>
                        <td>{formatTime(rec.check_in)}</td>
                        <td>{formatTime(rec.check_out)}</td>
                        <td>{rec.total_time_formatted || "N/A"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default AdminOption;
