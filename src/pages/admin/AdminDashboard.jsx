// src/components/admin/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../../assets/styles/AdminDashboard.css';
import ChandraaLogo from "../../assets/images/CHANDRAA.png";
import WebSixLogo from "../../assets/images/WEB SIX.png";
export default function AdminDashboard() {
  const [admin, setAdmin] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ message: '', type: '' });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setFeedback({ message: '', type: '' });

      try {
        // Get admin info from localStorage
        const authData = JSON.parse(localStorage.getItem("auth"));
        if (!authData) {
          throw new Error("No auth data found. Please login again.");
        }

        const profile = authData.profile || {};
        setAdmin({
          name: profile.name || "Admin",
          email: profile.email || "admin@gmail.com",
          profileUrl: profile.profile_url || "https://via.placeholder.com/130",
          role: profile.role || "admin",
        });

        const token = authData.session?.access_token;
        if (!token) throw new Error("No access token found. Please login again.");

        // Fetch all users
        const usersRes = await axios.get("https://attendance-backend-d4vi.onrender.com/users/all", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (Array.isArray(usersRes.data)) {
          setUsers(usersRes.data);
        } else {
          setUsers([]);
        }

      } catch (error) {
        console.error("Fetching users failed:", error);
        setFeedback({ message: `❌ ${error.message}`, type: 'error' });
        setAdmin(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddUser = () => {
    navigate('/admin/panel'); // navigate to Add User page
  };

  if (loading) return <p style={{ padding: '20px', textAlign: 'center' }}>Loading...</p>;
  if (!admin) return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <p>Admin data not available. Please login again.</p>
      <button className="btn" onClick={() => navigate('/login')}>Go to Login</button>
    </div>
  );

  return (

    <div className="container">
      {/* Sidebar */}
      <div className="sidebar">
        <img src={admin.profileUrl} alt="Admin Profile" />
        <h3>{admin.name}</h3>
        <p>{admin.email}</p>
      </div>

      {/* Main Content */}
      <div className="main">
        <div className="header">
           <img src={ChandraaLogo} alt="Chandraa Ads" style={{ height: "50px" }} />
                <img src={WebSixLogo} alt="Web Six" style={{ height: "50px" }} />
        </div>

        <h2>EMPLOYEE DETAILS</h2>

        {/* Feedback */}
        {feedback.message && (
          <div className={`feedback ${feedback.type}`} style={{ marginBottom: '15px', textAlign: 'center' }}>
            {feedback.message}
          </div>
        )}

        {/* Users Table */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>E.ID</th>
                <th>NAME</th>
                <th>EMAIL</th>
                <th>DESIGNATION</th>
                <th>MOBILE</th>
                <th>EMERGENCY NO</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? users.map(user => (
                <tr key={user.id}>
                  <td>{user.employee_id || 'N/A'}</td>
                  <td className="emp-name">
                    <img src={user.profile_url || 'https://via.placeholder.com/40'} alt="Emp" className="emp-img" />
                    {user.name || 'N/A'}
                  </td>
                  <td>{user.email || 'N/A'}</td>
                  <td>{user.designation || 'N/A'}</td>
                  <td>{user.mobile || 'N/A'}</td>
                  <td>{user.ien || 'N/A'}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center' }}>No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
  <button className="btn" onClick={handleAddUser}>➕ Add User</button>
  <button className="btn" onClick={() => navigate('/admin/option')}>📊 Dashboard</button>
</div>


      </div>
    </div>
  );
}
