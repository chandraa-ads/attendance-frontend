import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../assets/styles/AdminManualAttendance.css';

export default function AdminManualAttendance() {
  const navigate = useNavigate();

  // State variables
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


  const [permissionFrom, setPermissionFrom] = useState('');
  const [permissionTo, setPermissionTo] = useState('');
  const [permissionReason, setPermissionReason] = useState('');
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);

  // Edit form data
  const [editAttendanceData, setEditAttendanceData] = useState({
    userId: '',
    userName: '',
    date: new Date().toISOString().split('T')[0],
    attendanceType: 'present',
    checkIn: '09:30',
    checkOut: '19:00',
    absenceReason: '',
    halfDayType: 'morning',
    halfDayCheckIn: '09:30',
    halfDayCheckOut: '13:00',
    // Add permission fields
    permissionFrom: '',
    permissionTo: '',
    permissionReason: '',
    notes: ''
  });

  // Bulk edit data - add permission fields
  const [bulkEditData, setBulkEditData] = useState({
    date: new Date().toISOString().split('T')[0],
    attendanceType: 'present',
    checkIn: '09:30',
    checkOut: '19:00',
    absenceReason: '',
    halfDayType: 'morning',
    halfDayCheckIn: '09:30',
    halfDayCheckOut: '13:00',
    // Add permission fields
    permissionFrom: '',
    permissionTo: '',
    permissionReason: '',
    notes: ''
  });
  // Filters
  const [filters, setFilters] = useState({
    name: '',
    status: 'all',
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    department: 'all',
    designation: 'all'
  });

  // Get token from localStorage
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

  // Fetch users
  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const token = getToken();
      if (!token) return;

      const res = await fetch('https://attendance-backend-d4vi.onrender.com/auth/users', {
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

  // Fetch existing attendance for selected date
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
            id: record.id,
            exists: true,
            status: record.is_absent ? 'absent' :
              record.half_day_type ? `half-day-${record.half_day_type}` :
                record.permission_time ? 'permission' :
                  (record.check_in && !record.check_out ? 'checked-in' :
                    (record.check_in && record.check_out ? 'present' : 'pending')),
            record: record,
            half_day_type: record.half_day_type,
            permission_time: record.permission_time,
            permission_reason: record.permission_reason,
            notes: record.notes
          };
        });
        setExistingAttendance(attendanceMap);

        // Initialize attendance records
        initializeAttendanceRecords(data);
      }
    } catch (err) {
      console.error("Error fetching existing attendance:", err);
    }
  };

  // Initialize attendance records
  const initializeAttendanceRecords = (existingData = []) => {
    const records = {};
    users.forEach(user => {
      const existing = existingData.find(record => record.user_id === user.id);
      if (existing) {
        records[user.id] = {
          status: existing.is_absent ? 'absent' :
            existing.half_day_type ? `half-day-${existing.half_day_type}` : 'present',
          checkIn: existing.check_in ?
            new Date(existing.check_in).toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit' }) :
            '09:30',
          checkOut: existing.check_out ?
            new Date(existing.check_out).toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit' }) :
            '19:00',
          absenceReason: existing.absence_reason || '',
          halfDayType: existing.half_day_type || '',
          permissionTime: existing.permission_time || '',
          permissionReason: existing.permission_reason || '',
          notes: existing.notes || '',
          manualEntry: existing.manual_entry || true,
          alreadyMarked: true,
          recordId: existing.id
        };
      } else {
        records[user.id] = {
          status: 'pending',
          checkIn: '09:30',
          checkOut: '19:00',
          absenceReason: '',
          halfDayType: '',
          permissionTime: '',
          permissionReason: '',
          notes: '',
          manualEntry: true,
          alreadyMarked: false,
          recordId: null
        };
      }
    });
    setAttendanceRecords(records);
  };

  // Fetch all attendance for viewer mode
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

  // Handle edit attendance button click
  const handleEditAttendance = (user, specificDate = null) => {
    const existing = existingAttendance[user.id];
    const editDate = specificDate || selectedDate;

    setEditAttendanceData({
      userId: user.id,
      userName: user.name,
      date: editDate,
      attendanceType: existing ?
        (existing.record.is_absent ? 'absent' :
          existing.record.permission_time ? 'permission' :
            existing.record.half_day_type ? 'half-day' : 'present') : 'present',
      checkIn: existing?.record.check_in ?
        new Date(existing.record.check_in).toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit' }) : '09:30',
      checkOut: existing?.record.check_out ?
        new Date(existing.record.check_out).toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit' }) : '19:00',
      absenceReason: existing?.record.absence_reason || '',
      halfDayType: existing?.record.half_day_type || 'morning',
      halfDayCheckIn: existing?.record.check_in ?
        new Date(existing.record.check_in).toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit' }) : '09:30',
      halfDayCheckOut: existing?.record.check_out ?
        new Date(existing.record.check_out).toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit' }) : '13:00',
      // Add permission data
      permissionFrom: existing?.record.permission_time ?
        existing.record.permission_time.split('-')[0]?.trim() : '',
      permissionTo: existing?.record.permission_time ?
        existing.record.permission_time.split('-')[1]?.trim() : '',
      permissionReason: existing?.record.permission_reason || '',
      notes: existing?.record.notes || ''
    });

    setShowEditModal(true);
  };
  // Handle bulk edit click
  const handleBulkEditClick = () => {
    if (selectedUsers.length === 0) {
      setMessage({ text: 'Please select users for bulk edit', type: 'warning' });
      return;
    }

    setBulkEditData({
      date: selectedDate,
      attendanceType: 'present',
      checkIn: '09:30',
      checkOut: '19:00',
      absenceReason: '',
      halfDayType: 'morning',
      halfDayCheckIn: '09:30',
      halfDayCheckOut: '13:00',
      notes: ''
    });

    setShowBulkEditModal(true);
  };

  // Submit edit attendance
  const handleEditSubmit = async () => {
    try {
      const token = getToken();
      if (!token) return;

      // Validation for permission
      if (editAttendanceData.attendanceType === 'permission') {
        if (!editAttendanceData.permissionFrom || !editAttendanceData.permissionTo) {
          setMessage({ text: 'Please provide permission start and end times', type: 'warning' });
          return;
        }
        if (!editAttendanceData.permissionReason.trim()) {
          setMessage({ text: 'Please provide permission reason', type: 'warning' });
          return;
        }
      }

      // Check if date is in future
      const today = new Date().toISOString().split('T')[0];
      if (editAttendanceData.date > today) {
        setMessage({ text: 'Cannot mark attendance for future dates', type: 'warning' });
        return;
      }

      // Prepare payload
      let payload = {
        userId: editAttendanceData.userId,
        date: editAttendanceData.date,
        manualEntry: true
      };

      switch (editAttendanceData.attendanceType) {
        case 'present':
          payload.checkIn = editAttendanceData.checkIn || null;
          payload.checkOut = editAttendanceData.checkOut || null;
          payload.isAbsent = false;
          payload.absenceReason = null;
          payload.halfDayType = null;
          payload.permissionTime = null;
          payload.permissionReason = null;
          break;

        case 'absent':
          payload.isAbsent = true;
          payload.absenceReason = editAttendanceData.absenceReason;
          payload.checkIn = null;
          payload.checkOut = null;
          payload.halfDayType = null;
          payload.permissionTime = null;
          payload.permissionReason = null;
          break;

        case 'half-day':
          payload.isAbsent = false;
          payload.halfDayType = editAttendanceData.halfDayType;
          if (editAttendanceData.halfDayType === 'morning') {
            payload.checkIn = editAttendanceData.halfDayCheckIn || '09:30';
            payload.checkOut = editAttendanceData.halfDayCheckOut || '13:00';
          } else {
            payload.checkIn = editAttendanceData.halfDayCheckIn || '14:00';
            payload.checkOut = editAttendanceData.halfDayCheckOut || '19:00';
          }
          payload.permissionTime = null;
          payload.permissionReason = null;
          break;

        case 'permission':
          payload.isAbsent = false;
          payload.checkIn = editAttendanceData.checkIn || null;
          payload.checkOut = editAttendanceData.checkOut || null;
          payload.permissionTime = `${editAttendanceData.permissionFrom}-${editAttendanceData.permissionTo}`;
          payload.permissionReason = editAttendanceData.permissionReason;
          payload.halfDayType = null;
          break;
      }

      // Add optional notes
      if (editAttendanceData.notes.trim()) {
        payload.notes = editAttendanceData.notes;
      }

      // Check if record already exists
      let existingRecordId = null;
      const resCheck = await fetch(`https://attendance-backend-d4vi.onrender.com/attendance/all?date=${editAttendanceData.date}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      if (resCheck.ok) {
        const existingData = await resCheck.json();
        const existingRecord = existingData.find(record => record.user_id === editAttendanceData.userId);
        if (existingRecord) {
          existingRecordId = existingRecord.id;
        }
      }

      let response;
      if (existingRecordId) {
        // Update existing record
        response = await fetch(`https://attendance-backend-d4vi.onrender.com/attendance/update/${existingRecordId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new record - check if it's permission
        if (editAttendanceData.attendanceType === 'permission') {
          // Use permission endpoint
          response = await fetch('https://attendance-backend-d4vi.onrender.com/attendance/permission', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              userId: editAttendanceData.userId,
              date: editAttendanceData.date,
              permissionFrom: editAttendanceData.permissionFrom,
              permissionTo: editAttendanceData.permissionTo,
              reason: editAttendanceData.permissionReason,
              checkIn: editAttendanceData.checkIn || null,
              checkOut: editAttendanceData.checkOut || null,
              notes: editAttendanceData.notes || ''
            }),
          });
        } else {
          // Use regular attendance endpoint
          response = await fetch('https://attendance-backend-d4vi.onrender.com/attendance/manual', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload),
          });
        }
      }

      if (response.ok) {
        setMessage({
          text: `Attendance ${existingRecordId ? 'updated' : 'added'} for ${editAttendanceData.userName} on ${editAttendanceData.date}`,
          type: 'success'
        });
        setShowEditModal(false);

        // Refresh data
        if (editAttendanceData.date === selectedDate) {
          fetchExistingAttendance();
        }

        if (viewMode === 'viewer') {
          fetchAllAttendance();
        }

      } else {
        const error = await response.json();
        setMessage({ text: error.message || 'Failed to update attendance', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Error: ' + err.message, type: 'error' });
    }
  };

  // Submit bulk edit
  const handleBulkEditSubmit = async () => {
    try {
      const token = getToken();
      if (!token) return;

      // Validation for permission in bulk edit
      if (bulkEditData.attendanceType === 'permission') {
        if (!bulkEditData.permissionFrom || !bulkEditData.permissionTo) {
          setMessage({ text: 'Please provide permission start and end times', type: 'warning' });
          return;
        }
        if (!bulkEditData.permissionReason.trim()) {
          setMessage({ text: 'Please provide permission reason', type: 'warning' });
          return;
        }
      }

      const results = [];
      const errors = [];

      for (const userId of selectedUsers) {
        try {
          const user = users.find(u => u.id === userId);
          if (!user) continue;

          // Prepare payload for each user
          let payload = {
            userId: userId,
            date: bulkEditData.date,
            manualEntry: true
          };

          switch (bulkEditData.attendanceType) {
            case 'present':
              payload.checkIn = bulkEditData.checkIn || null;
              payload.checkOut = bulkEditData.checkOut || null;
              payload.isAbsent = false;
              payload.absenceReason = null;
              payload.halfDayType = null;
              payload.permissionTime = null;
              payload.permissionReason = null;
              break;

            case 'absent':
              payload.isAbsent = true;
              payload.absenceReason = bulkEditData.absenceReason;
              payload.checkIn = null;
              payload.checkOut = null;
              payload.halfDayType = null;
              payload.permissionTime = null;
              payload.permissionReason = null;
              break;

            case 'half-day':
              payload.isAbsent = false;
              payload.halfDayType = bulkEditData.halfDayType;
              if (bulkEditData.halfDayType === 'morning') {
                payload.checkIn = bulkEditData.halfDayCheckIn || '09:30';
                payload.checkOut = bulkEditData.halfDayCheckOut || '13:00';
              } else {
                payload.checkIn = bulkEditData.halfDayCheckIn || '14:00';
                payload.checkOut = bulkEditData.halfDayCheckOut || '19:00';
              }
              payload.permissionTime = null;
              payload.permissionReason = null;
              break;

            case 'permission':
              payload.isAbsent = false;
              payload.checkIn = bulkEditData.checkIn || null;
              payload.checkOut = bulkEditData.checkOut || null;
              payload.permissionTime = `${bulkEditData.permissionFrom}-${bulkEditData.permissionTo}`;
              payload.permissionReason = bulkEditData.permissionReason;
              payload.halfDayType = null;
              break;
          }

          // Check if record exists
          let existingRecordId = null;
          const resCheck = await fetch(`https://attendance-backend-d4vi.onrender.com/attendance/all?date=${bulkEditData.date}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            },
          });

          if (resCheck.ok) {
            const existingData = await resCheck.json();
            const existingRecord = existingData.find(record => record.user_id === userId);
            if (existingRecord) {
              existingRecordId = existingRecord.id;
            }
          }

          let response;
          if (existingRecordId) {
            // Update existing record
            response = await fetch(`https://attendance-backend-d4vi.onrender.com/attendance/update/${existingRecordId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(payload),
            });
          } else {
            // Create new record - check if permission
            if (bulkEditData.attendanceType === 'permission') {
              response = await fetch('https://attendance-backend-d4vi.onrender.com/attendance/permission', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  userId: userId,
                  date: bulkEditData.date,
                  permissionFrom: bulkEditData.permissionFrom,
                  permissionTo: bulkEditData.permissionTo,
                  reason: bulkEditData.permissionReason,
                  checkIn: bulkEditData.checkIn || null,
                  checkOut: bulkEditData.checkOut || null,
                  notes: bulkEditData.notes || ''
                }),
              });
            } else {
              response = await fetch('https://attendance-backend-d4vi.onrender.com/attendance/manual', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload),
              });
            }
          }

          if (response.ok) {
            results.push({ userId, userName: user.name, success: true });
          } else {
            const error = await response.json();
            errors.push({ userId, userName: user.name, error: error.message || 'Failed to update' });
          }
        } catch (err) {
          errors.push({ userId, error: err.message || 'Unknown error' });
        }
      }

      setMessage({
        text: `Bulk edit completed: ${results.length} successful, ${errors.length} failed`,
        type: results.length > 0 ? 'success' : 'error'
      });

      setShowBulkEditModal(false);
      setSelectedUsers([]);

      // Refresh data
      if (bulkEditData.date === selectedDate) {
        fetchExistingAttendance();
      }

      if (viewMode === 'viewer') {
        fetchAllAttendance();
      }

    } catch (err) {
      setMessage({ text: 'Error: ' + err.message, type: 'error' });
    }
  };


  // Handle date change
  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setSelectedUsers([]);
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Toggle user selection
  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Select all users
  const selectAllUsers = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.id));
    }
  };

  // Handle bulk action
  const applyBulkAction = () => {
    if (selectedUsers.length === 0) {
      setMessage({ text: 'Please select users for bulk action', type: 'warning' });
      return;
    }

    if (bulkAction === 'absent' && !absenceReason.trim()) {
      setMessage({ text: 'Please provide absence reason', type: 'warning' });
      return;
    }

    if (bulkAction === 'permission') {
      if (!permissionFrom || !permissionTo) {
        setMessage({ text: 'Please provide permission start and end times', type: 'warning' });
        return;
      }
      if (!permissionReason.trim()) {
        setMessage({ text: 'Please provide permission reason', type: 'warning' });
        return;
      }
    }

    const updatedRecords = { ...attendanceRecords };
    selectedUsers.forEach(userId => {
      updatedRecords[userId] = {
        ...updatedRecords[userId],
        status: bulkAction,
        checkIn: bulkAction === 'present' ? '09:30' : '',
        checkOut: bulkAction === 'present' ? '19:00' : '',
        absenceReason: bulkAction === 'absent' ? absenceReason : '',
        permissionTime: bulkAction === 'permission' ? `${permissionFrom}-${permissionTo}` : '',
        permissionReason: bulkAction === 'permission' ? permissionReason : '',
        manualEntry: true,
        alreadyMarked: false
      };
    });

    setAttendanceRecords(updatedRecords);
    setMessage({
      text: `Applied ${bulkAction} status to ${selectedUsers.length} user(s)`,
      type: 'success'
    });
  };

  // Submit individual attendance
  const submitIndividualAttendance = async (userId) => {
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

      // Check if record exists
      const existing = existingAttendance[userId];
      let response;

      if (existing && existing.recordId) {
        // Update existing
        response = await fetch(`https://attendance-backend-d4vi.onrender.com/attendance/update/${existing.recordId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new
        response = await fetch('https://attendance-backend-d4vi.onrender.com/attendance/manual', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        setMessage({
          text: `Attendance recorded for ${users.find(u => u.id === userId)?.name || 'user'}`,
          type: 'success'
        });

        // Refresh existing attendance
        fetchExistingAttendance();
      } else {
        const error = await response.json();
        setMessage({ text: error.message || 'Failed to record attendance', type: 'error' });
      }
    } catch (err) {
      console.error("Submit error:", err);
      setMessage({ text: 'Error: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Submit all attendance
  const submitAllAttendance = async () => {
    try {
      // Get token first
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      // First, check if any users are in "pending" status
      const pendingUsers = Object.entries(attendanceRecords)
        .filter(([userId, record]) => record.status === 'pending')
        .map(([userId]) => users.find(u => u.id === userId)?.name || userId);

      if (pendingUsers.length > 0) {
        setMessage({
          text: `${pendingUsers.length} users still have "pending" status: ${pendingUsers.slice(0, 3).join(', ')}${pendingUsers.length > 3 ? '...' : ''}. Please set their attendance first.`,
          type: 'warning'
        });
        return;
      }

      // Prepare records to submit
      const recordsToSubmit = Object.entries(attendanceRecords)
        .filter(([userId, record]) => {
          // Skip if already marked
          if (record.alreadyMarked) return false;

          // Validate required fields based on status
          if (record.status === 'absent') {
            return record.absenceReason && record.absenceReason.trim() !== '';
          }

          // For present/half-day, times are optional but status must be set
          return record.status !== 'pending';
        })
        .map(([userId, record]) => {
          const user = users.find(u => u.id === userId);
          return {
            userId: userId,
            date: selectedDate,
            isAbsent: record.status === 'absent',
            absenceReason: record.status === 'absent' ? record.absenceReason.trim() : null,
            checkIn: ['present', 'half-day-morning', 'half-day-afternoon'].includes(record.status) ? record.checkIn || null : null,
            checkOut: ['present', 'half-day-morning', 'half-day-afternoon'].includes(record.status) ? record.checkOut || null : null
          };
        });

      console.log('Records to submit:', recordsToSubmit);

      if (recordsToSubmit.length === 0) {
        // Check why there are no records to submit
        const totalUsers = users.length;
        const alreadyMarkedCount = Object.values(attendanceRecords).filter(r => r.alreadyMarked).length;
        const pendingCount = Object.values(attendanceRecords).filter(r => r.status === 'pending').length;

        let messageText = '';
        if (alreadyMarkedCount === totalUsers) {
          messageText = 'All users already have attendance marked for today';
        } else if (alreadyMarkedCount > 0 && pendingCount === 0) {
          messageText = `No new records to submit. ${alreadyMarkedCount}/${totalUsers} users already marked.`;
        } else if (pendingCount > 0) {
          messageText = `${pendingCount} users still have "pending" status`;
        } else {
          messageText = 'No valid attendance records to submit';
        }

        setMessage({ text: messageText, type: 'info' });
        return;
      }

      // Validate absence reasons for absent records
      const missingReasons = recordsToSubmit.filter(record =>
        record.isAbsent && (!record.absenceReason || record.absenceReason.trim() === '')
      );

      if (missingReasons.length > 0) {
        const userNames = missingReasons.map(record => {
          const user = users.find(u => u.id === record.userId);
          return user?.name || record.userId;
        }).slice(0, 3);

        setMessage({
          text: `${missingReasons.length} absent records missing reason: ${userNames.join(', ')}${missingReasons.length > 3 ? '...' : ''}`,
          type: 'warning'
        });
        return;
      }

      // Show confirmation dialog
      const confirmSubmit = window.confirm(
        `Submit attendance for ${recordsToSubmit.length} user(s) on ${selectedDate}?\n\n` +
        `• Present: ${recordsToSubmit.filter(r => !r.isAbsent).length}\n` +
        `• Absent: ${recordsToSubmit.filter(r => r.isAbsent).length}\n\n` +
        `Click OK to proceed.`
      );

      if (!confirmSubmit) {
        setMessage({ text: 'Submission cancelled', type: 'info' });
        return;
      }

      setLoading(true);

      // Call the bulk API endpoint
      const response = await fetch('https://attendance-backend-d4vi.onrender.com/attendance/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(recordsToSubmit),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({
          text: `✅ Successfully submitted ${result.successful || recordsToSubmit.length} attendance record(s)`,
          type: 'success'
        });

        // Refresh data to show updated status
        await fetchExistingAttendance();

        // Clear selected users
        setSelectedUsers([]);

        // Update attendance records state
        const updatedRecords = { ...attendanceRecords };
        recordsToSubmit.forEach(record => {
          if (updatedRecords[record.userId]) {
            updatedRecords[record.userId].alreadyMarked = true;
          }
        });
        setAttendanceRecords(updatedRecords);

      } else {
        // Handle errors from backend
        const errorMessage = result.message || result.error || 'Failed to submit attendance';
        const failedCount = result.failed || 0;

        if (result.errors && result.errors.length > 0) {
          const errorDetails = result.errors.slice(0, 3).map((err, idx) =>
            `${idx + 1}. ${err.userId}: ${err.error}`
          ).join('\n');

          setMessage({
            text: `Submitted with ${failedCount} error(s):\n${errorDetails}${result.errors.length > 3 ? '\n...' : ''}`,
            type: 'error'
          });
        } else {
          setMessage({
            text: `${errorMessage} (${failedCount} failed)`,
            type: 'error'
          });
        }
      }
    } catch (err) {
      console.error("Bulk submit error:", err);
      setMessage({
        text: `Network error: ${err.message || 'Failed to connect to server'}. Please check your connection.`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Get departments
  const getDepartments = () => {
    const departments = new Set();
    users.forEach(user => {
      if (user.department) departments.add(user.department);
    });
    return Array.from(departments);
  };

  // Get designations
  const getDesignations = () => {
    const designations = new Set();
    users.forEach(user => {
      if (user.designation) designations.add(user.designation);
    });
    return Array.from(designations);
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      'Date', 'Employee ID', 'Name', 'Department', 'Designation',
      'Check In', 'Check Out', 'Status', 'Absence Reason', 'Half Day Type',
      'Permission Time', 'Permission Reason', 'Notes'
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
        `"${item.status || ''}"`,
        `"${item.absence_reason || ''}"`,
        `"${item.half_day_type || ''}"`,
        `"${item.permission_time || ''}"`,
        `"${item.permission_reason || ''}"`,
        `"${item.notes || ''}"`
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

  // Initialize on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch existing attendance when date or users change
  useEffect(() => {
    if (selectedDate && users.length > 0) {
      fetchExistingAttendance();
    }
  }, [selectedDate, users]);

  // Fetch all attendance when in viewer mode or filters change
  useEffect(() => {
    if (viewMode === 'viewer') {
      fetchAllAttendance();
    }
  }, [viewMode, filters]);

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
        </div>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

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
              <small>Select any previous date to mark/edit attendance</small>
            </div>
          </div>

          {/* Bulk Actions Panel */}
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
                  <option value="half-day">Mark as Half Day</option>
                  <option value="permission">Mark as Permission</option>
                </select>
              </div>

              {/* Permission fields for bulk action */}
              {bulkAction === 'permission' && (
                <>
                  <div className="form-group">
                    <label>Permission From *</label>
                    <input
                      type="time"
                      value={permissionFrom}
                      onChange={(e) => setPermissionFrom(e.target.value)}
                      className="time-input"
                      placeholder="HH:mm"
                    />
                  </div>
                  <div className="form-group">
                    <label>Permission To *</label>
                    <input
                      type="time"
                      value={permissionTo}
                      onChange={(e) => setPermissionTo(e.target.value)}
                      className="time-input"
                      placeholder="HH:mm"
                    />
                  </div>
                  <div className="form-group">
                    <label>Permission Reason *</label>
                    <input
                      type="text"
                      value={permissionReason}
                      onChange={(e) => setPermissionReason(e.target.value)}
                      className="reason-input"
                      placeholder="Enter permission reason"
                    />
                  </div>
                </>
              )}

              {/* REMOVE THIS SECTION - it's causing the error */}
              {/* {record.status === 'permission' && (
      <td>
        <div className="permission-info">
          <div>Time: {record.permissionTime}</div>
          <div>Reason: {record.permissionReason}</div>
        </div>
      </td>
    )} */}

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
                  {selectedUsers.length === users.length ? 'Deselect All' : 'Select All Users'}
                </button>
                <button
                  onClick={applyBulkAction}
                  disabled={loading || selectedUsers.length === 0}
                  className="apply-bulk-btn"
                >
                  Apply to {selectedUsers.length} Selected
                </button>
                <button
                  onClick={handleBulkEditClick}
                  disabled={loading || selectedUsers.length === 0}
                  className="bulk-edit-btn"
                >
                  ✏️ Bulk Edit for Selected Date
                </button>
              </div>
            </div>

            <div className="selection-info">
              {selectedUsers.length} of {users.length} users selected
            </div>
          </div>

          {/* Users Table */}
          <div className="users-table-section">
            <div className="table-header">
              <h2>Mark Attendance for {selectedDate}</h2>
              <div className="table-header-actions">
                <button
                  onClick={() => {
                    // Allow editing for previous dates
                    const today = new Date().toISOString().split('T')[0];
                    if (selectedDate <= today) {
                      submitAllAttendance();
                    } else {
                      setMessage({ text: 'Cannot submit attendance for future dates', type: 'warning' });
                    }
                  }}
                  disabled={loading}
                  className="submit-all-btn"
                >
                  {loading ? 'Submitting...' : 'Submit All'}
                </button>
              </div>
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
                          checked={selectedUsers.length === users.length}
                          onChange={selectAllUsers}
                          disabled={loading}
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
                      const record = attendanceRecords[user.id] || {
                        status: 'pending',
                        checkIn: '09:30',
                        checkOut: '19:00',
                        absenceReason: '',
                        alreadyMarked: false
                      };
                      const existing = existingAttendance[user.id];
                      const isAlreadyMarked = existing || record.alreadyMarked;

                      return (
                        <tr
                          key={user.id}
                          style={{
                            backgroundColor: isAlreadyMarked ? '#e8f4f8' :
                              record.status === 'present' ? '#d4edda' :
                                record.status === 'absent' ? '#f8d7da' :
                                  record.status.includes('half-day') ? '#fff3cd' : '#e2e3e5'
                          }}
                          className={selectedUsers.includes(user.id) ? 'selected-row' : ''}
                        >
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.id)}
                              onChange={() => toggleUserSelection(user.id)}
                              disabled={loading}
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
                              <select
                                value={record.status}
                                onChange={(e) => {
                                  const updated = { ...attendanceRecords };
                                  updated[user.id] = {
                                    ...updated[user.id],
                                    status: e.target.value,
                                    alreadyMarked: false
                                  };
                                  setAttendanceRecords(updated);
                                }}
                                className="status-select"
                                disabled={loading}
                              >
                                <option value="pending">-- Select --</option>
                                <option value="present">Present</option>
                                <option value="absent">Absent</option>
                                <option value="half-day-morning">Half Day (Morning)</option>
                                <option value="half-day-afternoon">Half Day (Afternoon)</option>
                                <option value="permission">Permission</option>
                              </select>

                              {/* REMOVE THIS - it doesn't belong here */}
                              {/* {editAttendanceData.attendanceType === 'permission' && (
      <>
        <div className="form-group">
          <label>Check In Time (Optional)</label>
          <input
            type="time"
            value={editAttendanceData.checkIn}
            onChange={(e) => setEditAttendanceData(prev => ({ ...prev, checkIn: e.target.value }))}
            className="form-control"
          />
        </div>
        ... other permission fields ...
      </>
    )} */}

                              {isAlreadyMarked && (
                                <div className="already-text">Already Marked</div>
                              )}
                            </div>
                          </td>
                          <td>
                            {record.status === 'present' || record.status.includes('half-day') ? (
                              <input
                                type="time"
                                value={record.checkIn || '09:30'}
                                onChange={(e) => {
                                  const updated = { ...attendanceRecords };
                                  updated[user.id] = {
                                    ...updated[user.id],
                                    checkIn: e.target.value,
                                    alreadyMarked: false
                                  };
                                  setAttendanceRecords(updated);
                                }}
                                className="time-input"
                                disabled={loading || isAlreadyMarked}
                              />
                            ) : (
                              <div className="time-display">N/A</div>
                            )}
                          </td>
                          <td>
                            {record.status === 'present' || record.status.includes('half-day') ? (
                              <input
                                type="time"
                                value={record.checkOut || '19:00'}
                                onChange={(e) => {
                                  const updated = { ...attendanceRecords };
                                  updated[user.id] = {
                                    ...updated[user.id],
                                    checkOut: e.target.value,
                                    alreadyMarked: false
                                  };
                                  setAttendanceRecords(updated);
                                }}
                                className="time-input"
                                disabled={loading || isAlreadyMarked}
                              />
                            ) : (
                              <div className="time-display">N/A</div>
                            )}
                          </td>
                          <td>
                            {record.status === 'absent' ? (
                              <input
                                type="text"
                                value={record.absenceReason || ''}
                                onChange={(e) => {
                                  const updated = { ...attendanceRecords };
                                  updated[user.id] = {
                                    ...updated[user.id],
                                    absenceReason: e.target.value,
                                    alreadyMarked: false
                                  };
                                  setAttendanceRecords(updated);
                                }}
                                className="reason-input"
                                placeholder="Enter reason"
                                disabled={loading || isAlreadyMarked}
                              />
                            ) : (
                              <div className="reason-display">N/A</div>
                            )}
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                onClick={() => submitIndividualAttendance(user.id)}
                                disabled={loading || record.status === 'pending' || isAlreadyMarked}
                                className={`submit-btn ${isAlreadyMarked ? 'disabled-btn' : ''}`}
                                title={isAlreadyMarked ? "Attendance already marked" : ""}
                              >
                                {isAlreadyMarked ? 'Marked' : 'Submit'}
                              </button>
                              <button
                                onClick={() => handleEditAttendance(user)}
                                className="edit-btn"
                                title="Edit attendance for any date"
                              >
                                ✏️ Edit
                              </button>
                            </div>
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
                    <option value="half-day">Half Day</option>
                    <option value="permission">Permission</option>
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
                </div>
              </div>
            </div>

            {/* Attendance Data Table */}
            <div className="data-table-section">
              <div className="table-header">
                <h3>Attendance Records ({allAttendanceData.length} records found)</h3>
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
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allAttendanceData.map((item, index) => {
                        const user = users.find(u => u.id === item.user_id) || item.user_info;
                        return (
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
                            <td>
                              <button
                                onClick={() => {
                                  if (user) {
                                    handleEditAttendance(user, item.date);
                                  } else {
                                    setMessage({ text: 'User information not available', type: 'warning' });
                                  }
                                }}
                                className="edit-btn"
                                title="Edit attendance"
                              >
                                ✏️ Edit
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
          </div>
        </>
      )}

      {/* Edit Attendance Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Edit Attendance for {editAttendanceData.userName}</h3>
              <button onClick={() => setShowEditModal(false)} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  value={editAttendanceData.date}
                  onChange={(e) => setEditAttendanceData(prev => ({ ...prev, date: e.target.value }))}
                  className="form-control"
                  max={new Date().toISOString().split('T')[0]}
                />
                <small>You can select any previous date</small>
              </div>

              <div className="form-group">
                <label>Attendance Type *</label>
                <div className="attendance-type-selector">
                  <button
                    type="button"
                    className={`type-btn ${editAttendanceData.attendanceType === 'present' ? 'active' : ''}`}
                    onClick={() => setEditAttendanceData(prev => ({ ...prev, attendanceType: 'present' }))}
                  >
                    ✅ Present
                  </button>
                  <button
                    type="button"
                    className={`type-btn ${editAttendanceData.attendanceType === 'absent' ? 'active' : ''}`}
                    onClick={() => setEditAttendanceData(prev => ({ ...prev, attendanceType: 'absent' }))}
                  >
                    ❌ Absent
                  </button>
                  <button
                    type="button"
                    className={`type-btn ${editAttendanceData.attendanceType === 'half-day' ? 'active' : ''}`}
                    onClick={() => setEditAttendanceData(prev => ({ ...prev, attendanceType: 'half-day' }))}
                  >
                    ⏰ Half Day
                  </button>
                  <button
                    type="button"
                    className={`type-btn ${editAttendanceData.attendanceType === 'permission' ? 'active' : ''}`}
                    onClick={() => setEditAttendanceData(prev => ({ ...prev, attendanceType: 'permission' }))}
                  >
                    🕒 Permission
                  </button>
                </div>
              </div>

              {editAttendanceData.attendanceType === 'present' && (
                <>
                  <div className="form-group">
                    <label>Check In Time</label>
                    <input
                      type="time"
                      value={editAttendanceData.checkIn}
                      onChange={(e) => setEditAttendanceData(prev => ({ ...prev, checkIn: e.target.value }))}
                      className="form-control"
                    />
                  </div>
                  <div className="form-group">
                    <label>Check Out Time</label>
                    <input
                      type="time"
                      value={editAttendanceData.checkOut}
                      onChange={(e) => setEditAttendanceData(prev => ({ ...prev, checkOut: e.target.value }))}
                      className="form-control"
                    />
                  </div>
                </>
              )}

              {editAttendanceData.attendanceType === 'absent' && (
                <div className="form-group">
                  <label>Absence Reason *</label>
                  <input
                    type="text"
                    value={editAttendanceData.absenceReason}
                    onChange={(e) => setEditAttendanceData(prev => ({ ...prev, absenceReason: e.target.value }))}
                    className="form-control"
                    placeholder="Enter reason for absence"
                    required
                  />
                </div>
              )}

              {editAttendanceData.attendanceType === 'half-day' && (
                <>
                  <div className="form-group">
                    <label>Half Day Type *</label>
                    <div className="half-day-selector">
                      <button
                        type="button"
                        className={`half-day-btn ${editAttendanceData.halfDayType === 'morning' ? 'active' : ''}`}
                        onClick={() => setEditAttendanceData(prev => ({ ...prev, halfDayType: 'morning' }))}
                      >
                        ☀️ Morning Half Day
                      </button>
                      <button
                        type="button"
                        className={`half-day-btn ${editAttendanceData.halfDayType === 'afternoon' ? 'active' : ''}`}
                        onClick={() => setEditAttendanceData(prev => ({ ...prev, halfDayType: 'afternoon' }))}
                      >
                        🌇 Afternoon Half Day
                      </button>
                    </div>
                  </div>

                  {editAttendanceData.halfDayType === 'morning' && (
                    <>
                      <div className="form-group">
                        <label>Check In Time (Morning)</label>
                        <input
                          type="time"
                          value={editAttendanceData.halfDayCheckIn}
                          onChange={(e) => setEditAttendanceData(prev => ({ ...prev, halfDayCheckIn: e.target.value }))}
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>Check Out Time (Lunch Time)</label>
                        <input
                          type="time"
                          value={editAttendanceData.halfDayCheckOut}
                          onChange={(e) => setEditAttendanceData(prev => ({ ...prev, halfDayCheckOut: e.target.value }))}
                          className="form-control"
                        />
                      </div>
                    </>
                  )}

                  {editAttendanceData.halfDayType === 'afternoon' && (
                    <>
                      <div className="form-group">
                        <label>Check In Time (After Lunch)</label>
                        <input
                          type="time"
                          value={editAttendanceData.halfDayCheckIn}
                          onChange={(e) => setEditAttendanceData(prev => ({ ...prev, halfDayCheckIn: e.target.value }))}
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>Check Out Time (Evening)</label>
                        <input
                          type="time"
                          value={editAttendanceData.halfDayCheckOut}
                          onChange={(e) => setEditAttendanceData(prev => ({ ...prev, halfDayCheckOut: e.target.value }))}
                          className="form-control"
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              <div className="form-group">
                <label>Notes (Optional)</label>
                <textarea
                  value={editAttendanceData.notes}
                  onChange={(e) => setEditAttendanceData(prev => ({ ...prev, notes: e.target.value }))}
                  className="form-control"
                  placeholder="Additional notes or remarks..."
                  rows="2"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowEditModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                className="btn btn-primary"
              >
                Save Attendance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Edit Modal */}
      {showBulkEditModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Bulk Edit Attendance for {selectedUsers.length} Users</h3>
              <button onClick={() => setShowBulkEditModal(false)} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  value={bulkEditData.date}
                  onChange={(e) => setBulkEditData(prev => ({ ...prev, date: e.target.value }))}
                  className="form-control"
                  max={new Date().toISOString().split('T')[0]}
                />
                <small>Select date to apply attendance for all selected users</small>
              </div>

              <div className="form-group">
                <label>Attendance Type *</label>
                <div className="attendance-type-selector">
                  <button
                    type="button"
                    className={`type-btn ${bulkEditData.attendanceType === 'present' ? 'active' : ''}`}
                    onClick={() => setBulkEditData(prev => ({ ...prev, attendanceType: 'present' }))}
                  >
                    ✅ Present
                  </button>
                  <button
                    type="button"
                    className={`type-btn ${bulkEditData.attendanceType === 'absent' ? 'active' : ''}`}
                    onClick={() => setBulkEditData(prev => ({ ...prev, attendanceType: 'absent' }))}
                  >
                    ❌ Absent
                  </button>
                  <button
                    type="button"
                    className={`type-btn ${bulkEditData.attendanceType === 'half-day' ? 'active' : ''}`}
                    onClick={() => setBulkEditData(prev => ({ ...prev, attendanceType: 'half-day' }))}
                  >
                    ⏰ Half Day
                  </button>
                  <button
                    type="button"
                    className={`type-btn ${bulkEditData.attendanceType === 'permission' ? 'active' : ''}`}
                    onClick={() => setBulkEditData(prev => ({ ...prev, attendanceType: 'permission' }))}
                  >
                    🕒 Permission
                  </button>
                </div>
              </div>

              {bulkEditData.attendanceType === 'present' && (
                <>
                  <div className="form-group">
                    <label>Check In Time</label>
                    <input
                      type="time"
                      value={bulkEditData.checkIn}
                      onChange={(e) => setBulkEditData(prev => ({ ...prev, checkIn: e.target.value }))}
                      className="form-control"
                    />
                  </div>
                  <div className="form-group">
                    <label>Check Out Time</label>
                    <input
                      type="time"
                      value={bulkEditData.checkOut}
                      onChange={(e) => setBulkEditData(prev => ({ ...prev, checkOut: e.target.value }))}
                      className="form-control"
                    />
                  </div>
                </>
              )}

              {bulkEditData.attendanceType === 'absent' && (
                <div className="form-group">
                  <label>Absence Reason *</label>
                  <input
                    type="text"
                    value={bulkEditData.absenceReason}
                    onChange={(e) => setBulkEditData(prev => ({ ...prev, absenceReason: e.target.value }))}
                    className="form-control"
                    placeholder="Enter reason for absence"
                    required
                  />
                </div>
              )}

              {bulkEditData.attendanceType === 'half-day' && (
                <>
                  <div className="form-group">
                    <label>Half Day Type *</label>
                    <div className="half-day-selector">
                      <button
                        type="button"
                        className={`half-day-btn ${bulkEditData.halfDayType === 'morning' ? 'active' : ''}`}
                        onClick={() => setBulkEditData(prev => ({ ...prev, halfDayType: 'morning' }))}
                      >
                        ☀️ Morning Half Day
                      </button>
                      <button
                        type="button"
                        className={`half-day-btn ${bulkEditData.halfDayType === 'afternoon' ? 'active' : ''}`}
                        onClick={() => setBulkEditData(prev => ({ ...prev, halfDayType: 'afternoon' }))}
                      >
                        🌇 Afternoon Half Day
                      </button>
                    </div>
                  </div>

                  {bulkEditData.halfDayType === 'morning' && (
                    <>
                      <div className="form-group">
                        <label>Check In Time (Morning)</label>
                        <input
                          type="time"
                          value={bulkEditData.halfDayCheckIn}
                          onChange={(e) => setBulkEditData(prev => ({ ...prev, halfDayCheckIn: e.target.value }))}
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>Check Out Time (Lunch Time)</label>
                        <input
                          type="time"
                          value={bulkEditData.halfDayCheckOut}
                          onChange={(e) => setBulkEditData(prev => ({ ...prev, halfDayCheckOut: e.target.value }))}
                          className="form-control"
                        />
                      </div>
                    </>
                  )}

                  {bulkEditData.halfDayType === 'afternoon' && (
                    <>
                      <div className="form-group">
                        <label>Check In Time (After Lunch)</label>
                        <input
                          type="time"
                          value={bulkEditData.halfDayCheckIn}
                          onChange={(e) => setBulkEditData(prev => ({ ...prev, halfDayCheckIn: e.target.value }))}
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>Check Out Time (Evening)</label>
                        <input
                          type="time"
                          value={bulkEditData.halfDayCheckOut}
                          onChange={(e) => setBulkEditData(prev => ({ ...prev, halfDayCheckOut: e.target.value }))}
                          className="form-control"
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              <div className="form-group">
                <label>Notes (Optional)</label>
                <textarea
                  value={bulkEditData.notes}
                  onChange={(e) => setBulkEditData(prev => ({ ...prev, notes: e.target.value }))}
                  className="form-control"
                  placeholder="Additional notes or remarks..."
                  rows="2"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowBulkEditModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkEditSubmit}
                className="btn btn-primary"
              >
                Apply to {selectedUsers.length} Users
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="instructions">
        <h3>How to use:</h3>
        <div className="instructions-grid">
          <div className="instruction-card">
            <h4>📝 Mark Attendance</h4>
            <ul>
              <li>Select any date (past dates only)</li>
              <li>Mark users as Present/Absent/Half-day</li>
              <li>Use bulk actions for multiple users</li>
              <li>Click "Edit" button for individual user to mark attendance for any date</li>
            </ul>
          </div>
          <div className="instruction-card">
            <h4>👁️ View & Edit Attendance</h4>
            <ul>
              <li>Filter records by date range, name, status</li>
              <li>Export data to CSV</li>
              <li>Click "Edit" button to modify any attendance record</li>
              <li>Edit attendance for any date in the modal</li>
            </ul>
          </div>
          <div className="instruction-card">
            <h4>✏️ Edit Features</h4>
            <ul>
              <li>Single user edit: Click edit button for any user</li>
              <li>Bulk edit: Select multiple users and click "Bulk Edit"</li>
              <li>Edit for any previous date</li>
              <li>Full support for Present, Absent, Half-day types</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}