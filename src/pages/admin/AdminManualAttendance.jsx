import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../assets/styles/AdminManualAttendance.css';

export default function AdminManualAttendance() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [bulkAction, setBulkAction] = useState('present');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [absenceReason, setAbsenceReason] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [existingAttendance, setExistingAttendance] = useState({});
  const [allAttendanceData, setAllAttendanceData] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [viewMode, setViewMode] = useState('marker'); // 'marker' or 'viewer'
  const [filters, setFilters] = useState({
    name: '',
    status: 'all',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    department: 'all',
    designation: 'all'
  });

  const getToken = () => {
    try {
      const authStr = localStorage.getItem("auth");
      if (!authStr) {
        navigate('/login');
        return null;
      }
      const authData = JSON.parse(authStr);
      return authData?.access_token || authData?.token || null;
    } catch (err) {
      console.error("Error extracting token:", err);
      navigate('/login');
      return null;
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchAllAttendance();
  }, []);

  useEffect(() => {
    if (selectedDate && users.length > 0) {
      initializeAttendanceRecords();
      fetchExistingAttendance();
    }
  }, [selectedDate, users]);

  useEffect(() => {
    if (viewMode === 'viewer') {
      fetchAllAttendance();
    }
  }, [viewMode, filters]);

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const token = getToken();
      if (!token) return;

      const res = await fetch('https://attendance-backend-d4vi.onrender.com/users/all', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("auth");
          navigate('/login');
          return;
        }
        throw new Error(`Failed to fetch users: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Users fetch error", err);
      setMessage({ text: 'Error fetching users: ' + err.message, type: 'error' });
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchExistingAttendance = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`https://attendance-backend-d4vi.onrender.com/attendance/all?date=${selectedDate}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      
      if (res.ok) {
        const data = await res.json();
        const attendanceMap = {};
        data.forEach(record => {
          attendanceMap[record.user_id] = {
            exists: true,
            status: record.is_absent ? 'absent' : 
                    (record.check_in && !record.check_out ? 'checked-in' : 
                    (record.check_in && record.check_out ? 'present' : 'pending')),
            record: record
          };
        });
        setExistingAttendance(attendanceMap);
      }
    } catch (err) {
      console.error("Error fetching existing attendance:", err);
    }
  };

  const fetchAllAttendance = async () => {
    try {
      setAttendanceLoading(true);
      const token = getToken();
      if (!token) return;

      let url = 'https://attendance-backend-d4vi.onrender.com/attendance/filter?';
      const params = [];
      
      if (filters.startDate) params.push(`startDate=${filters.startDate}`);
      if (filters.endDate) params.push(`endDate=${filters.endDate}`);
      if (filters.name) params.push(`name=${encodeURIComponent(filters.name)}`);
      if (filters.status && filters.status !== 'all') params.push(`status=${filters.status}`);
      if (filters.department && filters.department !== 'all') params.push(`department=${encodeURIComponent(filters.department)}`);
      if (filters.designation && filters.designation !== 'all') params.push(`designation=${encodeURIComponent(filters.designation)}`);
      
      url += params.join('&');
      
      const res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      
      if (res.ok) {
        const data = await res.json();
        setAllAttendanceData(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching all attendance:", err);
      setMessage({ text: 'Error fetching attendance data: ' + err.message, type: 'error' });
    } finally {
      setAttendanceLoading(false);
    }
  };

  const initializeAttendanceRecords = () => {
    const records = {};
    users.forEach(user => {
      const existing = existingAttendance[user.id];
      if (existing) {
        records[user.id] = {
          status: existing.status,
          checkIn: existing.record.check_in ? 
                   new Date(existing.record.check_in).toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit' }) : 
                   '09:00',
          checkOut: existing.record.check_out ? 
                    new Date(existing.record.check_out).toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit' }) : 
                    '18:00',
          absenceReason: existing.record.absence_reason || '',
          manualEntry: existing.record.manual_entry || true,
          alreadyMarked: true
        };
      } else {
        records[user.id] = {
          status: 'pending',
          checkIn: '09:00',
          checkOut: '18:00',
          absenceReason: '',
          manualEntry: true,
          alreadyMarked: false
        };
      }
    });
    setAttendanceRecords(records);
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setSelectedUsers([]);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUserStatusChange = (userId, status) => {
    const existing = existingAttendance[userId];
    if (existing) {
      setMessage({ 
        text: `Cannot change status for ${users.find(u => u.id === userId)?.name}. Attendance already exists.`, 
        type: 'warning' 
      });
      return;
    }

    setAttendanceRecords(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        status: status,
        checkIn: status === 'present' ? '09:00' : '',
        checkOut: status === 'present' ? '18:00' : '',
        absenceReason: status === 'absent' ? prev[userId]?.absenceReason || '' : '',
        alreadyMarked: false
      }
    }));
  };

  const handleCheckInChange = (userId, time) => {
    const existing = existingAttendance[userId];
    if (existing) return;

    setAttendanceRecords(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        checkIn: time,
        status: 'present',
        alreadyMarked: false
      }
    }));
  };

  const handleCheckOutChange = (userId, time) => {
    const existing = existingAttendance[userId];
    if (existing) return;

    setAttendanceRecords(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        checkOut: time,
        status: 'present',
        alreadyMarked: false
      }
    }));
  };

  const handleAbsenceReasonChange = (userId, reason) => {
    const existing = existingAttendance[userId];
    if (existing) return;

    setAttendanceRecords(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        absenceReason: reason,
        status: 'absent',
        alreadyMarked: false
      }
    }));
  };

  const toggleUserSelection = (userId) => {
    const existing = existingAttendance[userId];
    if (existing) {
      setMessage({ 
        text: `Cannot select ${users.find(u => u.id === userId)?.name}. Attendance already exists.`, 
        type: 'warning' 
      });
      return;
    }

    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      const usersWithoutAttendance = users
        .filter(user => !existingAttendance[user.id])
        .map(user => user.id);
      setSelectedUsers(usersWithoutAttendance);
    }
  };

  const applyBulkAction = () => {
    if (selectedUsers.length === 0) {
      setMessage({ text: 'Please select users for bulk action', type: 'warning' });
      return;
    }

    const validUsers = selectedUsers.filter(userId => !existingAttendance[userId]);
    if (validUsers.length === 0) {
      setMessage({ text: 'Selected users already have attendance marked', type: 'warning' });
      return;
    }

    if (bulkAction === 'absent' && !absenceReason.trim()) {
      setMessage({ text: 'Please provide absence reason', type: 'warning' });
      return;
    }

    const updatedRecords = { ...attendanceRecords };
    validUsers.forEach(userId => {
      updatedRecords[userId] = {
        ...updatedRecords[userId],
        status: bulkAction,
        checkIn: bulkAction === 'present' ? '09:00' : '',
        checkOut: bulkAction === 'present' ? '18:00' : '',
        absenceReason: bulkAction === 'absent' ? absenceReason : '',
        manualEntry: true,
        alreadyMarked: false
      };
    });

    setAttendanceRecords(updatedRecords);
    setMessage({ 
      text: `Applied ${bulkAction} status to ${validUsers.length} user(s)`, 
      type: 'success' 
    });
  };

  const submitIndividualAttendance = async (userId) => {
    const existing = existingAttendance[userId];
    if (existing) {
      setMessage({ 
        text: `Attendance already exists for ${users.find(u => u.id === userId)?.name}`, 
        type: 'warning' 
      });
      return;
    }

    const record = attendanceRecords[userId];
    if (!record || record.status === 'pending') {
      setMessage({ text: 'Please set attendance status first', type: 'warning' });
      return;
    }

    if (record.status === 'absent' && !record.absenceReason.trim()) {
      setMessage({ text: 'Please provide absence reason', type: 'warning' });
      return;
    }

    try {
      setLoading(true);
      const token = getToken();
      if (!token) return;

      const payload = {
        userId: userId,
        date: selectedDate,
        isAbsent: record.status === 'absent',
        absenceReason: record.status === 'absent' ? record.absenceReason.trim() : null,
        checkIn: record.status === 'present' ? record.checkIn : null,
        checkOut: record.status === 'present' ? record.checkOut : null
      };

      const res = await fetch('https://attendance-backend-d4vi.onrender.com/attendance/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      
      if (res.ok) {
        setMessage({ 
          text: `Attendance recorded for ${users.find(u => u.id === userId)?.name || 'user'}`, 
          type: 'success' 
        });
        const newExisting = { ...existingAttendance };
        newExisting[userId] = {
          exists: true,
          status: record.status,
          record: { ...payload, id: result.data?.id }
        };
        setExistingAttendance(newExisting);
        
        setAttendanceRecords(prev => ({
          ...prev,
          [userId]: {
            ...prev[userId],
            alreadyMarked: true
          }
        }));
      } else {
        setMessage({ 
          text: result.message || 'Failed to record attendance', 
          type: 'error' 
        });
      }
    } catch (err) {
      console.error("Submit error:", err);
      setMessage({ text: 'Error: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const submitAllAttendance = async () => {
    const recordsToSubmit = Object.entries(attendanceRecords)
      .filter(([userId, record]) => 
        record.status !== 'pending' && 
        !existingAttendance[userId]
      )
      .map(([userId, record]) => ({
        userId: userId,
        date: selectedDate,
        isAbsent: record.status === 'absent',
        absenceReason: record.status === 'absent' ? record.absenceReason.trim() : null,
        checkIn: record.status === 'present' ? record.checkIn : null,
        checkOut: record.status === 'present' ? record.checkOut : null
      }));

    if (recordsToSubmit.length === 0) {
      setMessage({ text: 'No attendance records to submit', type: 'warning' });
      return;
    }

    const missingReasons = recordsToSubmit.filter(r => r.isAbsent && !r.absenceReason);
    if (missingReasons.length > 0) {
      setMessage({ 
        text: `${missingReasons.length} absent records missing reason`, 
        type: 'warning' 
      });
      return;
    }

    const confirmSubmit = window.confirm(`Submit attendance for ${recordsToSubmit.length} user(s)?`);
    if (!confirmSubmit) return;

    try {
      setLoading(true);
      const token = getToken();
      if (!token) return;

      const batchSize = 10;
      const batches = [];
      for (let i = 0; i < recordsToSubmit.length; i += batchSize) {
        batches.push(recordsToSubmit.slice(i, i + batchSize));
      }

      let successful = 0;
      let failed = 0;
      const newExisting = { ...existingAttendance };

      for (const batch of batches) {
        const results = await Promise.allSettled(
          batch.map(record => 
            fetch('https://attendance-backend-d4vi.onrender.com/attendance/manual', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(record),
            }).then(res => res.json())
          )
        );

        results.forEach((result, index) => {
          const userId = batch[index].userId;
          if (result.status === 'fulfilled' && !result.value.error) {
            successful++;
            newExisting[userId] = {
              exists: true,
              status: batch[index].isAbsent ? 'absent' : 'present',
              record: result.value.data
            };
          } else {
            failed++;
          }
        });
      }

      setMessage({ 
        text: `Submitted: ${successful} successful, ${failed} failed`, 
        type: successful > 0 ? 'success' : 'error' 
      });
      
      if (successful > 0) {
        setExistingAttendance(newExisting);
        const updatedRecords = { ...attendanceRecords };
        Object.keys(updatedRecords).forEach(userId => {
          if (newExisting[userId]) {
            updatedRecords[userId].alreadyMarked = true;
          }
        });
        setAttendanceRecords(updatedRecords);
        setSelectedUsers([]);
      }
    } catch (err) {
      console.error("Bulk submit error:", err);
      setMessage({ text: 'Error submitting attendance: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const allUsersSelected = () => {
    const usersWithoutAttendance = users.filter(user => !existingAttendance[user.id]);
    return selectedUsers.length === usersWithoutAttendance.length && usersWithoutAttendance.length > 0;
  };

  const getDepartments = () => {
    const departments = new Set();
    users.forEach(user => {
      if (user.department) departments.add(user.department);
    });
    return Array.from(departments);
  };

  const getDesignations = () => {
    const designations = new Set();
    users.forEach(user => {
      if (user.designation) designations.add(user.designation);
    });
    return Array.from(designations);
  };

  const exportToCSV = () => {
    const headers = [
      'Date', 'Employee ID', 'Name', 'Department', 'Designation',
      'Check In', 'Check Out', 'Total Time', 'Status', 'Absence Reason', 'Manual Entry'
    ];

    const csvContent = [
      headers.join(','),
      ...allAttendanceData.map(item => [
        item.date,
        `"${item.user_info?.employee_id || ''}"`,
        `"${item.user_info?.name || ''}"`,
        `"${item.user_info?.department || ''}"`,
        `"${item.user_info?.designation || ''}"`,
        `"${item.check_in_ist || ''}"`,
        `"${item.check_out_ist || ''}"`,
        `"${item.total_time_formatted || ''}"`,
        `"${item.status || ''}"`,
        `"${item.absence_reason || ''}"`,
        `"${item.manual_entry ? 'Yes' : 'No'}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${filters.startDate}_to_${filters.endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const printAttendance = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Attendance Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .header { text-align: center; margin-bottom: 30px; }
            .summary { margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 5px; }
            .status-present { background-color: #d4edda; }
            .status-absent { background-color: #f8d7da; }
            .status-checked-in { background-color: #fff3cd; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Attendance Report</h1>
            <p>Date Range: ${filters.startDate} to ${filters.endDate}</p>
            <p>Total Records: ${allAttendanceData.length}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Total Time</th>
                <th>Status</th>
                <th>Absence Reason</th>
              </tr>
            </thead>
            <tbody>
              ${allAttendanceData.map(item => `
                <tr class="status-${item.status?.toLowerCase().replace(' ', '-')}">
                  <td>${item.date}</td>
                  <td>${item.user_info?.employee_id || ''}</td>
                  <td>${item.user_info?.name || ''}</td>
                  <td>${item.user_info?.department || ''}</td>
                  <td>${item.user_info?.designation || ''}</td>
                  <td>${item.check_in_ist || ''}</td>
                  <td>${item.check_out_ist || ''}</td>
                  <td>${item.total_time_formatted || ''}</td>
                  <td>${item.status || ''}</td>
                  <td>${item.absence_reason || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  return (
    <div className="admin-attendance-marker">
      <div className="header">
        <h1>Attendance Management System</h1>
        <div className="header-actions">
          <button 
            onClick={() => setViewMode('marker')} 
            className={`view-mode-btn ${viewMode === 'marker' ? 'active' : ''}`}
          >
            📝 Mark Attendance
          </button>
          <button 
            onClick={() => setViewMode('viewer')} 
            className={`view-mode-btn ${viewMode === 'viewer' ? 'active' : ''}`}
          >
            👁️ View All Attendance
          </button>
          <button onClick={() => navigate('/admin/attendance/all')} className="view-all-btn">
            📋 View All Records
          </button>
        </div>
      </div>

      {viewMode === 'marker' ? (
        <>
          {/* Date Selection */}
          <div className="date-section">
            <div className="form-group">
              <label>Select Date *</label>
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                className="date-input"
                max={new Date().toISOString().split('T')[0]}
              />
              <small>Cannot select future dates</small>
            </div>
          </div>

          {/* Bulk Actions Panel */}
          <div className="bulk-panel">
            <h2>Bulk Actions</h2>
            <div className="bulk-controls">
              <div className="form-group">
                <label>Action</label>
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="bulk-select"
                  disabled={loading}
                >
                  <option value="present">Mark as Present</option>
                  <option value="absent">Mark as Absent</option>
                </select>
              </div>

              {bulkAction === 'absent' && (
                <div className="form-group">
                  <label>Absence Reason *</label>
                  <input
                    type="text"
                    value={absenceReason}
                    onChange={(e) => setAbsenceReason(e.target.value)}
                    className="reason-input"
                    placeholder="Enter reason for all selected users"
                    disabled={loading}
                  />
                </div>
              )}

              <div className="bulk-buttons">
                <button onClick={selectAllUsers} className="select-all-btn">
                  {allUsersSelected() ? 'Deselect All' : 'Select All Available Users'}
                </button>
                <button 
                  onClick={applyBulkAction}
                  disabled={loading || selectedUsers.length === 0}
                  className="apply-bulk-btn"
                >
                  Apply to {selectedUsers.length} Selected
                </button>
              </div>
            </div>

            <div className="selection-info">
              {selectedUsers.length} of {users.filter(u => !existingAttendance[u.id]).length} available users selected
              {Object.keys(existingAttendance).length > 0 && (
                <span className="already-marked-count">
                  ({Object.keys(existingAttendance).length} already marked)
                </span>
              )}
            </div>
          </div>

          {/* Message Display */}
          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          {/* Users Table */}
          <div className="users-table-section">
            <div className="table-header">
              <h2>Mark Attendance for {selectedDate}</h2>
              <button 
                onClick={submitAllAttendance}
                disabled={loading}
                className="submit-all-btn"
              >
                {loading ? 'Submitting...' : 'Submit All Available'}
              </button>
            </div>

            {usersLoading ? (
              <div className="loading">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="no-users">No users found</div>
            ) : (
              <div className="table-container">
                <table className="attendance-table">
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>
                        <input
                          type="checkbox"
                          checked={allUsersSelected()}
                          onChange={selectAllUsers}
                          disabled={loading || users.filter(u => !existingAttendance[u.id]).length === 0}
                        />
                      </th>
                      <th>Employee ID</th>
                      <th>Name</th>
                      <th>Designation</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                      <th>Absence Reason</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => {
                      const record = attendanceRecords[user.id] || { status: 'pending', alreadyMarked: false };
                      const existing = existingAttendance[user.id];
                      const isAlreadyMarked = existing || record.alreadyMarked;
                      
                      return (
                        <tr 
                          key={user.id} 
                          style={{ backgroundColor: isAlreadyMarked ? '#e8f4f8' : 
                                  record.status === 'present' ? '#d4edda' : 
                                  record.status === 'absent' ? '#f8d7da' : '#e2e3e5' }}
                          className={selectedUsers.includes(user.id) ? 'selected-row' : ''}
                        >
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.id)}
                              onChange={() => toggleUserSelection(user.id)}
                              disabled={loading || isAlreadyMarked}
                              title={isAlreadyMarked ? "Attendance already marked" : ""}
                            />
                          </td>
                          <td>{user.employee_id || 'N/A'}</td>
                          <td>
                            <div className="user-info">
                              {user.profile_url && (
                                <img src={user.profile_url} alt={user.name} className="user-avatar" />
                              )}
                              <span>
                                {user.name}
                                {isAlreadyMarked && <span className="already-badge">✓</span>}
                              </span>
                            </div>
                          </td>
                          <td>{user.designation || 'N/A'}</td>
                          <td>{user.department || 'N/A'}</td>
                          <td>
                            <div className="status-controls">
                              <button
                                onClick={() => handleUserStatusChange(user.id, 'present')}
                                className={`status-btn ${record.status === 'present' ? 'active' : ''}`}
                                disabled={loading || isAlreadyMarked}
                                title={isAlreadyMarked ? "Attendance already marked" : ""}
                              >
                                Present
                              </button>
                              <button
                                onClick={() => handleUserStatusChange(user.id, 'absent')}
                                className={`status-btn ${record.status === 'absent' ? 'active' : ''}`}
                                disabled={loading || isAlreadyMarked}
                                title={isAlreadyMarked ? "Attendance already marked" : ""}
                              >
                                Absent
                              </button>
                            </div>
                            {isAlreadyMarked && (
                              <div className="already-text">Already Marked</div>
                            )}
                          </td>
                          <td>
                            {record.status === 'present' && !isAlreadyMarked ? (
                              <input
                                type="time"
                                value={record.checkIn || '09:00'}
                                onChange={(e) => handleCheckInChange(user.id, e.target.value)}
                                className="time-input"
                                disabled={loading || isAlreadyMarked}
                                title={isAlreadyMarked ? "Attendance already marked" : ""}
                              />
                            ) : (
                              <div className="time-display">
                                {isAlreadyMarked ? 'Locked' : record.checkIn || 'N/A'}
                              </div>
                            )}
                          </td>
                          <td>
                            {record.status === 'present' && !isAlreadyMarked ? (
                              <input
                                type="time"
                                value={record.checkOut || '18:00'}
                                onChange={(e) => handleCheckOutChange(user.id, e.target.value)}
                                className="time-input"
                                disabled={loading || isAlreadyMarked}
                                title={isAlreadyMarked ? "Attendance already marked" : ""}
                              />
                            ) : (
                              <div className="time-display">
                                {isAlreadyMarked ? 'Locked' : record.checkOut || 'N/A'}
                              </div>
                            )}
                          </td>
                          <td>
                            {record.status === 'absent' && !isAlreadyMarked ? (
                              <input
                                type="text"
                                value={record.absenceReason || ''}
                                onChange={(e) => handleAbsenceReasonChange(user.id, e.target.value)}
                                className="reason-input"
                                placeholder="Enter reason"
                                disabled={loading || isAlreadyMarked}
                                title={isAlreadyMarked ? "Attendance already marked" : ""}
                              />
                            ) : (
                              <div className="reason-display">
                                {isAlreadyMarked ? 'Locked' : record.absenceReason || 'N/A'}
                              </div>
                            )}
                          </td>
                          <td>
                            <button
                              onClick={() => submitIndividualAttendance(user.id)}
                              disabled={loading || record.status === 'pending' || isAlreadyMarked}
                              className={`submit-btn ${isAlreadyMarked ? 'disabled-btn' : ''}`}
                              title={isAlreadyMarked ? "Attendance already marked" : ""}
                            >
                              {isAlreadyMarked ? 'Already Marked' : 'Submit'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Attendance Viewer */}
          <div className="viewer-section">
            <div className="filter-panel">
              <h2>Attendance Records Viewer</h2>
              <div className="filter-controls">
                <div className="filter-group">
                  <label>Employee Name</label>
                  <input
                    type="text"
                    name="name"
                    value={filters.name}
                    onChange={handleFilterChange}
                    className="filter-input"
                    placeholder="Search by name..."
                  />
                </div>
                
                <div className="filter-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                    className="filter-input"
                  />
                </div>
                
                <div className="filter-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                    className="filter-input"
                  />
                </div>
                
                <div className="filter-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className="filter-select"
                  >
                    <option value="all">All Status</option>
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="checked-in">Checked In</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                
                <div className="filter-group">
                  <label>Department</label>
                  <select
                    name="department"
                    value={filters.department}
                    onChange={handleFilterChange}
                    className="filter-select"
                  >
                    <option value="all">All Departments</option>
                    {getDepartments().map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                
                <div className="filter-group">
                  <label>Designation</label>
                  <select
                    name="designation"
                    value={filters.designation}
                    onChange={handleFilterChange}
                    className="filter-select"
                  >
                    <option value="all">All Designations</option>
                    {getDesignations().map(desig => (
                      <option key={desig} value={desig}>{desig}</option>
                    ))}
                  </select>
                </div>
                
                <div className="filter-actions">
                  <button onClick={fetchAllAttendance} className="filter-btn" disabled={attendanceLoading}>
                    {attendanceLoading ? 'Loading...' : 'Apply Filters'}
                  </button>
                  <button onClick={exportToCSV} className="export-btn">
                    Export CSV
                  </button>
                  <button onClick={printAttendance} className="print-btn">
                    Print
                  </button>
                </div>
              </div>
            </div>

            {/* Attendance Data Table */}
            <div className="data-table-section">
              <div className="table-header">
                <h3>Attendance Records ({allAttendanceData.length} records found)</h3>
                <div className="stats-summary">
                  <span className="stat-item">📅 {filters.startDate} to {filters.endDate}</span>
                  <span className="stat-item">👥 {new Set(allAttendanceData.map(d => d.user_id)).size} Users</span>
                </div>
              </div>

              {attendanceLoading ? (
                <div className="loading">Loading attendance data...</div>
              ) : allAttendanceData.length === 0 ? (
                <div className="no-data">No attendance records found for the selected filters</div>
              ) : (
                <div className="table-container">
                  <table className="attendance-data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Employee ID</th>
                        <th>Name</th>
                        <th>Department</th>
                        <th>Designation</th>
                        <th>Check In</th>
                        <th>Check Out</th>
                        <th>Total Time</th>
                        <th>Status</th>
                        <th>Absence Reason</th>
                        <th>Manual Entry</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allAttendanceData.map((item, index) => (
                        <tr key={index} className={`status-${item.status?.toLowerCase().replace(' ', '-')}`}>
                          <td>{item.date}</td>
                          <td>{item.user_info?.employee_id || 'N/A'}</td>
                          <td>
                            <div className="user-info">
                              {item.user_info?.profile_url && (
                                <img src={item.user_info.profile_url} alt={item.user_info.name} className="user-avatar" />
                              )}
                              <span>{item.user_info?.name || 'Unknown'}</span>
                            </div>
                          </td>
                          <td>{item.user_info?.department || 'N/A'}</td>
                          <td>{item.user_info?.designation || 'N/A'}</td>
                          <td>{item.check_in_ist || 'N/A'}</td>
                          <td>{item.check_out_ist || 'N/A'}</td>
                          <td>{item.total_time_formatted || 'N/A'}</td>
                          <td>
                            <span className={`status-badge status-${item.status?.toLowerCase().replace(' ', '-')}`}>
                              {item.status || 'Unknown'}
                            </span>
                          </td>
                          <td>{item.absence_reason || 'N/A'}</td>
                          <td>{item.manual_entry ? 'Yes' : 'No'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Instructions */}
      <div className="instructions">
        <h3>How to use:</h3>
        <div className="instructions-grid">
          <div className="instruction-card">
            <h4>📝 Mark Attendance</h4>
            <ul>
              <li>Select date and mark users as Present/Absent</li>
              <li>Use bulk actions for multiple users</li>
              <li>Submit individually or all at once</li>
            </ul>
          </div>
          <div className="instruction-card">
            <h4>👁️ View Attendance</h4>
            <ul>
              <li>Filter records by date range, name, status</li>
              <li>Export data to CSV or print reports</li>
              <li>View detailed attendance information</li>
            </ul>
          </div>
          <div className="instruction-card">
            <h4>🔒 Security Features</h4>
            <ul>
              <li>Users with ✓ are already marked - disabled</li>
              <li>No future date selection allowed</li>
              <li>Prevent duplicate attendance marking</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}