// src/pages/admin/AdminAttendance.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Attendance() {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAttendance = async () => {
    try {
      const res = await axios.get('https://attendance-backend-d4vi.onrender.comattendance/all'); // Admin endpoint
      setAttendanceData(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  if (loading) return <p>Loading attendance...</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>All Users Attendance</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #000' }}>
            <th style={{ padding: '10px' }}>Profile</th>
            <th style={{ padding: '10px' }}>Name</th>
            <th style={{ padding: '10px' }}>Username</th>
            <th style={{ padding: '10px' }}>Email</th>
            <th style={{ padding: '10px' }}>Check In</th>
            <th style={{ padding: '10px' }}>Check Out</th>
            <th style={{ padding: '10px' }}>Total Time (min)</th>
          </tr>
        </thead>
        <tbody>
          {attendanceData.map((item) => (
            <tr key={item.id} style={{ borderBottom: '1px solid #ccc' }}>
              <td style={{ padding: '10px', textAlign: 'center' }}>
                {item.users.profile_url ? (
                  <img
                    src={item.users.profile_url}
                    alt={item.users.name}
                    width="50"
                    style={{ borderRadius: '50%' }}
                  />
                ) : (
                  'N/A'
                )}
              </td>
              <td style={{ padding: '10px' }}>{item.users.name}</td>
              <td style={{ padding: '10px' }}>{item.users.username}</td>
              <td style={{ padding: '10px' }}>{item.users.email}</td>
              <td style={{ padding: '10px' }}>
                {item.check_in ? new Date(item.check_in).toLocaleString() : 'N/A'}
              </td>
              <td style={{ padding: '10px' }}>
                {item.check_out ? new Date(item.check_out).toLocaleString() : 'N/A'}
              </td>
              <td style={{ padding: '10px' }}>
                {item.total_time_minutes?.toFixed(2) || '0'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
