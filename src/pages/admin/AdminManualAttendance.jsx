import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Edit2,
  Download,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  User,
  Building,
  Briefcase,
  Save,
  Trash2,
  AlertCircle,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Upload,
  BarChart2,
  MoreVertical,
  CheckSquare,
  Square
} from 'lucide-react';
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
  const [message, setMessage] = useState({ text: '', type: '', visible: false });
  const [existingAttendance, setExistingAttendance] = useState({});
  const [allAttendanceData, setAllAttendanceData] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [viewMode, setViewMode] = useState('marker'); // 'marker' or 'viewer'

  // Permission states
  const [permissionFrom, setPermissionFrom] = useState('');
  const [permissionTo, setPermissionTo] = useState('');
  const [permissionReason, setPermissionReason] = useState('');
  // Handle permission submission
  const handlePermissionSubmit = async (userId) => {
    if (!permissionFrom || !permissionTo) {
      showMessage('Please provide permission start and end times', 'warning');
      return;
    }

    if (!permissionReason.trim()) {
      showMessage('Please provide permission reason', 'warning');
      return;
    }

    try {
      setLoading(true);
      const token = getToken();
      if (!token) return;

      const user = users.find(u => u.id === userId);
      if (!user) {
        showMessage('User not found', 'error');
        return;
      }

      // Prepare permission payload
      const payload = {
        userId: userId,
        date: selectedDate,
        permissionFrom: permissionFrom,
        permissionTo: permissionTo,
        reason: permissionReason.trim()
      };

      // Optional check-in/out times if user wants to mark them
      const record = attendanceRecords[userId];
      if (record?.checkIn && record?.checkOut) {
        payload.checkIn = record.checkIn;
        payload.checkOut = record.checkOut;
      }

      // Send request to permission endpoint
      const response = await fetch('https://attendance-backend-d4vi.onrender.com/attendance/permission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        showMessage(`Permission recorded for ${user.name}`, 'success');

        // Update local state
        const updatedRecords = { ...attendanceRecords };
        updatedRecords[userId] = {
          ...updatedRecords[userId],
          status: 'permission',
          permissionTime: `${permissionFrom}-${permissionTo}`,
          permissionReason: permissionReason,
          alreadyMarked: true,
          manualEntry: true
        };
        setAttendanceRecords(updatedRecords);

        // Clear permission fields
        setPermissionFrom('');
        setPermissionTo('');
        setPermissionReason('');

        // Refresh data
        fetchExistingAttendance();
      } else {
        const error = await response.json();
        showMessage(error.message || 'Failed to record permission', 'error');
      }
    } catch (err) {
      console.error("Permission error:", err);
      showMessage('Error: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };


  // Handle bulk permission for multiple users
  const handleBulkPermission = async () => {
    if (selectedUsers.length === 0) {
      showMessage('Please select users for permission', 'warning');
      return;
    }

    if (!permissionFrom || !permissionTo) {
      showMessage('Please provide permission start and end times', 'warning');
      return;
    }

    if (!permissionReason.trim()) {
      showMessage('Please provide permission reason', 'warning');
      return;
    }

    try {
      setLoading(true);
      const token = getToken();
      if (!token) return;

      const results = [];
      const errors = [];

      // Process each selected user
      for (const userId of selectedUsers) {
        try {
          const user = users.find(u => u.id === userId);
          if (!user) {
            errors.push({ userId, error: 'User not found' });
            continue;
          }

          // Prepare permission payload for each user
          const payload = {
            userId: userId,
            date: selectedDate,
            permissionFrom: permissionFrom,
            permissionTo: permissionTo,
            reason: permissionReason.trim()
          };

          // Check if record exists to preserve check-in/out times
          const existing = existingAttendance[userId];
          if (existing?.record?.check_in && existing?.record?.check_out) {
            payload.checkIn = new Date(existing.record.check_in).toLocaleTimeString('en-IN', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit'
            });
            payload.checkOut = new Date(existing.record.check_out).toLocaleTimeString('en-IN', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit'
            });
          }

          const response = await fetch('https://attendance-backend-d4vi.onrender.com/attendance/permission', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload),
          });

          if (response.ok) {
            results.push({ userId, userName: user.name, success: true });
          } else {
            const error = await response.json();
            errors.push({ userId, userName: user.name, error: error.message || 'Failed to record permission' });
          }
        } catch (err) {
          errors.push({ userId, error: err.message || 'Unknown error' });
        }
      }

      // Show summary message
      if (results.length > 0) {
        showMessage(`Permission recorded for ${results.length} user(s)`, 'success');

        // Update local state for successful records
        const updatedRecords = { ...attendanceRecords };
        results.forEach(result => {
          if (updatedRecords[result.userId]) {
            updatedRecords[result.userId] = {
              ...updatedRecords[result.userId],
              status: 'permission',
              permissionTime: `${permissionFrom}-${permissionTo}`,
              permissionReason: permissionReason,
              alreadyMarked: true,
              manualEntry: true
            };
          }
        });
        setAttendanceRecords(updatedRecords);

        // Clear permission fields and selections
        setPermissionFrom('');
        setPermissionTo('');
        setPermissionReason('');
        setSelectedUsers([]);

        // Refresh data
        fetchExistingAttendance();
      }

      if (errors.length > 0) {
        console.error('Permission errors:', errors);
        showMessage(`${errors.length} permission(s) failed`, 'error');
      }

    } catch (err) {
      console.error("Bulk permission error:", err);
      showMessage('Error: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

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
    permissionFrom: '',
    permissionTo: '',
    permissionReason: '',
    notes: ''
  });

  // Bulk edit data
  const [bulkEditData, setBulkEditData] = useState({
    date: new Date().toISOString().split('T')[0],
    attendanceType: 'present',
    checkIn: '09:30',
    checkOut: '19:00',
    absenceReason: '',
    halfDayType: 'morning',
    halfDayCheckIn: '09:30',
    halfDayCheckOut: '13:00',
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

  // UI states
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [expandedUsers, setExpandedUsers] = useState({});
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    halfDay: 0,
    permission: 0,
    pending: 0
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

  // Show message with timeout
  const showMessage = (text, type) => {
    setMessage({ text, type, visible: true });
    setTimeout(() => setMessage(prev => ({ ...prev, visible: false })), 5000);
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

      // Initialize attendance records
      initializeAttendanceRecords([], data);

      // Calculate initial stats
      calculateStats(data);
    } catch (err) {
      console.error("Users fetch error", err);
      showMessage('Error fetching users: ' + err.message, 'error');
    } finally {
      setUsersLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (usersData) => {
    const newStats = {
      present: 0,
      absent: 0,
      halfDay: 0,
      permission: 0,
      pending: 0,
      total: usersData.length
    };

    Object.values(attendanceRecords).forEach(record => {
      switch (record.status) {
        case 'present':
          newStats.present++;
          break;
        case 'absent':
          newStats.absent++;
          break;
        case 'half-day-morning':
        case 'half-day-afternoon':
          newStats.halfDay++;
          break;
        case 'permission':
          newStats.permission++;
          break;
        case 'pending':
          newStats.pending++;
          break;
      }
    });

    setStats(newStats);
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
  const initializeAttendanceRecords = (existingData = [], usersData = users) => {
    const records = {};
    usersData.forEach(user => {
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
    calculateStats(usersData);
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
      showMessage('Error fetching attendance data: ' + err.message, 'error');
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
      showMessage('Please select users for bulk edit', 'warning');
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

      // Validation based on attendance type
      if (editAttendanceData.attendanceType === 'absent') {
        if (!editAttendanceData.absenceReason.trim()) {
          showMessage('Please provide absence reason', 'warning');
          return;
        }
      } else if (editAttendanceData.attendanceType === 'permission') {
        if (!editAttendanceData.permissionFrom || !editAttendanceData.permissionTo) {
          showMessage('Please provide permission start and end times', 'warning');
          return;
        }
        if (!editAttendanceData.permissionReason.trim()) {
          showMessage('Please provide permission reason', 'warning');
          return;
        }
      } else if (editAttendanceData.attendanceType === 'present') {
        if (!editAttendanceData.checkIn || !editAttendanceData.checkOut) {
          showMessage('Please provide check-in and check-out times', 'warning');
          return;
        }
      } else if (editAttendanceData.attendanceType === 'half-day') {
        if (!editAttendanceData.halfDayCheckIn || !editAttendanceData.halfDayCheckOut) {
          showMessage('Please provide half-day start and end times', 'warning');
          return;
        }
      }

      // Check if date is in future
      const today = new Date().toISOString().split('T')[0];
      if (editAttendanceData.date > today) {
        showMessage('Cannot mark attendance for future dates', 'warning');
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
          payload.checkIn = editAttendanceData.checkIn;
          payload.checkOut = editAttendanceData.checkOut;
          payload.isAbsent = false;
          payload.absenceReason = null;
          payload.halfDayType = null;
          payload.permissionTime = null;
          payload.permissionReason = null;
          break;

        case 'absent':
          payload.isAbsent = true;
          payload.absenceReason = editAttendanceData.absenceReason.trim();
          payload.checkIn = null; // No time needed for absent
          payload.checkOut = null; // No time needed for absent
          payload.halfDayType = null;
          payload.permissionTime = null;
          payload.permissionReason = null;
          break;

        case 'half-day':
          payload.isAbsent = false;
          payload.halfDayType = editAttendanceData.halfDayType;
          payload.checkIn = editAttendanceData.halfDayCheckIn;
          payload.checkOut = editAttendanceData.halfDayCheckOut;
          payload.permissionTime = null;
          payload.permissionReason = null;
          break;

        case 'permission':
          payload.isAbsent = false;
          payload.checkIn = null; // Not required for permission
          payload.checkOut = null; // Not required for permission
          payload.permissionTime = `${editAttendanceData.permissionFrom}-${editAttendanceData.permissionTo}`;
          payload.permissionReason = editAttendanceData.permissionReason.trim();
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
        // Create new record
        if (editAttendanceData.attendanceType === 'permission') {
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
              reason: editAttendanceData.permissionReason.trim(),
              notes: editAttendanceData.notes || ''
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
        showMessage(`Attendance ${existingRecordId ? 'updated' : 'added'} for ${editAttendanceData.userName}`, 'success');
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
        showMessage(error.message || 'Failed to update attendance', 'error');
      }
    } catch (err) {
      showMessage('Error: ' + err.message, 'error');
    }
  };

  // Submit bulk edit
  const handleBulkEditSubmit = async () => {
    try {
      const token = getToken();
      if (!token) return;

      // Validation
      if (bulkEditData.attendanceType === 'permission') {
        if (!bulkEditData.permissionFrom || !bulkEditData.permissionTo) {
          showMessage('Please provide permission start and end times', 'warning');
          return;
        }
        if (!bulkEditData.permissionReason.trim()) {
          showMessage('Please provide permission reason', 'warning');
          return;
        }
      }

      const results = [];
      const errors = [];

      for (const userId of selectedUsers) {
        try {
          const user = users.find(u => u.id === userId);
          if (!user) continue;

          // Prepare payload
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
            response = await fetch(`https://attendance-backend-d4vi.onrender.com/attendance/update/${existingRecordId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(payload),
            });
          } else {
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

      showMessage(`Bulk edit: ${results.length} successful, ${errors.length} failed`, results.length > 0 ? 'success' : 'error');

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
      showMessage('Error: ' + err.message, 'error');
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

  // Apply bulk action
  const applyBulkAction = () => {
    if (selectedUsers.length === 0) {
      showMessage('Please select users for bulk action', 'warning');
      return;
    }

    if (bulkAction === 'absent' && !absenceReason.trim()) {
      showMessage('Please provide absence reason', 'warning');
      return;
    }

    if (bulkAction === 'permission') {
      if (!permissionFrom || !permissionTo) {
        showMessage('Please provide permission start and end times', 'warning');
        return;
      }
      if (!permissionReason.trim()) {
        showMessage('Please provide permission reason', 'warning');
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
    calculateStats(users);
    showMessage(`Applied ${bulkAction} to ${selectedUsers.length} user(s)`, 'success');
  };

  // Submit individual attendance
  const submitIndividualAttendance = async (userId) => {
    const record = attendanceRecords[userId];
    if (!record || record.status === 'pending') {
      showMessage('Please set attendance status first', 'warning');
      return;
    }

    // Handle different statuses
    if (record.status === 'absent') {
      if (!record.absenceReason || !record.absenceReason.trim()) {
        showMessage('Please provide absence reason', 'warning');
        return;
      }
    } else if (record.status === 'permission') {
      if (!record.permissionTime) {
        showMessage('Please set permission time', 'warning');
        return;
      }
      if (!record.permissionReason || !record.permissionReason.trim()) {
        showMessage('Please provide permission reason', 'warning');
        return;
      }
    } else if (record.status === 'present' || record.status.includes('half-day')) {
      // For present/half-day, validate time inputs
      if (!record.checkIn || !record.checkOut) {
        showMessage('Please provide check-in and check-out times', 'warning');
        return;
      }
    }

    try {
      setLoading(true);
      const token = getToken();
      if (!token) return;

      // Prepare payload based on status
      let payload = {
        userId: userId,
        date: selectedDate,
        manualEntry: true
      };

      switch (record.status) {
        case 'present':
          payload.checkIn = record.checkIn;
          payload.checkOut = record.checkOut;
          payload.isAbsent = false;
          payload.absenceReason = null;
          payload.halfDayType = null;
          payload.permissionTime = null;
          payload.permissionReason = null;
          break;

        case 'absent':
          payload.isAbsent = true;
          payload.absenceReason = record.absenceReason.trim();
          payload.checkIn = null;
          payload.checkOut = null;
          payload.halfDayType = null;
          payload.permissionTime = null;
          payload.permissionReason = null;
          break;

        case 'half-day-morning':
        case 'half-day-afternoon':
          payload.isAbsent = false;
          payload.halfDayType = record.status.includes('morning') ? 'morning' : 'afternoon';
          payload.checkIn = record.checkIn;
          payload.checkOut = record.checkOut;
          payload.absenceReason = null;
          payload.permissionTime = null;
          payload.permissionReason = null;
          break;

        case 'permission':
          payload.isAbsent = false;
          payload.permissionTime = record.permissionTime;
          payload.permissionReason = record.permissionReason.trim();
          payload.checkIn = null; // Not required for permission
          payload.checkOut = null; // Not required for permission
          payload.absenceReason = null;
          payload.halfDayType = null;
          break;
      }

      // Check if record exists
      const existing = existingAttendance[userId];
      let response;

      if (existing && existing.recordId) {
        response = await fetch(`https://attendance-backend-d4vi.onrender.com/attendance/update/${existing.recordId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload),
        });
      } else {
        // For permission, use permission endpoint
        if (record.status === 'permission') {
          const [permissionFrom, permissionTo] = record.permissionTime.split('-');
          response = await fetch('https://attendance-backend-d4vi.onrender.com/attendance/permission', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              userId: userId,
              date: selectedDate,
              permissionFrom: permissionFrom?.trim(),
              permissionTo: permissionTo?.trim(),
              reason: record.permissionReason.trim()
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
        showMessage(`Attendance recorded for ${users.find(u => u.id === userId)?.name || 'user'}`, 'success');
        fetchExistingAttendance();
      } else {
        const error = await response.json();
        showMessage(error.message || 'Failed to record attendance', 'error');
      }
    } catch (err) {
      console.error("Submit error:", err);
      showMessage('Error: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Submit all attendance
  const submitAllAttendance = async () => {
    try {
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      // Check pending users
      const pendingUsers = Object.entries(attendanceRecords)
        .filter(([userId, record]) => record.status === 'pending')
        .map(([userId]) => users.find(u => u.id === userId)?.name || userId);

      if (pendingUsers.length > 0) {
        showMessage(`${pendingUsers.length} users still have "pending" status`, 'warning');
        return;
      }

      // Prepare records
      const recordsToSubmit = Object.entries(attendanceRecords)
        .filter(([userId, record]) => {
          if (record.alreadyMarked) return false;
          if (record.status === 'absent') {
            return record.absenceReason && record.absenceReason.trim() !== '';
          }
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

      if (recordsToSubmit.length === 0) {
        showMessage('No new records to submit', 'info');
        return;
      }

      // Validate absence reasons
      const missingReasons = recordsToSubmit.filter(record =>
        record.isAbsent && (!record.absenceReason || record.absenceReason.trim() === '')
      );

      if (missingReasons.length > 0) {
        showMessage(`${missingReasons.length} absent records missing reason`, 'warning');
        return;
      }

      // Confirmation
      const confirmSubmit = window.confirm(
        `Submit attendance for ${recordsToSubmit.length} user(s) on ${selectedDate}?`
      );

      if (!confirmSubmit) {
        showMessage('Submission cancelled', 'info');
        return;
      }

      setLoading(true);

      // Bulk API call
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
        showMessage(`Submitted ${result.successful || recordsToSubmit.length} attendance record(s)`, 'success');
        fetchExistingAttendance();
        setSelectedUsers([]);

        const updatedRecords = { ...attendanceRecords };
        recordsToSubmit.forEach(record => {
          if (updatedRecords[record.userId]) {
            updatedRecords[record.userId].alreadyMarked = true;
          }
        });
        setAttendanceRecords(updatedRecords);

      } else {
        const errorMessage = result.message || result.error || 'Failed to submit';
        showMessage(`${errorMessage} (${result.failed || 0} failed)`, 'error');
      }
    } catch (err) {
      console.error("Bulk submit error:", err);
      showMessage(`Network error: ${err.message}`, 'error');
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
    showMessage('Export started', 'success');
  };

  // Toggle user expansion
  const toggleUserExpansion = (userId) => {
    setExpandedUsers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = users.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(users.length / itemsPerPage);

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

  // Update stats when attendance records change
  useEffect(() => {
    calculateStats(users);
  }, [attendanceRecords]);

  return (
    <div className="attendance-management">
      {/* Toast Message */}
      {message.visible && (
        <div className={`toast-message ${message.type}`}>
          <div className="toast-content">
            {message.type === 'success' && <CheckCircle size={20} />}
            {message.type === 'error' && <XCircle size={20} />}
            {message.type === 'warning' && <AlertCircle size={20} />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(prev => ({ ...prev, visible: false }))}>×</button>
        </div>
      )}

      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Attendance Management</h1>
          <p>Manage and track employee attendance records</p>
        </div>
        <div className="header-right">
          <button className="btn-stats" onClick={() => setShowStatsModal(true)}>
            <BarChart2 size={20} />
            <span>Statistics</span>
          </button>
          {/* <button className="btn-import" onClick={() => setShowImportModal(true)}>
            <Upload size={20} />
            <span>Import</span>
          </button> */}
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* View Mode Toggle */}
        <div className="view-mode-toggle">
          <button
            className={`toggle-btn ${viewMode === 'marker' ? 'active' : ''}`}
            onClick={() => setViewMode('marker')}
          >
            <Calendar size={20} />
            <span>Mark Attendance</span>
          </button>
          {/* <button
            className={`toggle-btn ${viewMode === 'viewer' ? 'active' : ''}`}
            onClick={() => setViewMode('viewer')}
          >
            <Eye size={20} />
            <span>View Records</span>
          </button> */}
        </div>

        {/* Statistics Cards */}
        <div className="stats-cards">
          <div className="stat-card stat-present">
            <div className="stat-icon">
              <CheckCircle size={24} />
            </div>
            <div className="stat-content">
              <h3>{stats.present}</h3>
              <p>Present</p>
            </div>
          </div>
          <div className="stat-card stat-absent">
            <div className="stat-icon">
              <XCircle size={24} />
            </div>
            <div className="stat-content">
              <h3>{stats.absent}</h3>
              <p>Absent</p>
            </div>
          </div>
          <div className="stat-card stat-halfday">
            <div className="stat-icon">
              <Clock size={24} />
            </div>
            <div className="stat-content">
              <h3>{stats.halfDay}</h3>
              <p>Half Day</p>
            </div>
          </div>
          <div className="stat-card stat-pending">
            <div className="stat-icon">
              <AlertCircle size={24} />
            </div>
            <div className="stat-content">
              <h3>{stats.pending}</h3>
              <p>Pending</p>
            </div>
          </div>
          <div className="stat-card stat-total">
            <div className="stat-icon">
              <Users size={24} />
            </div>
            <div className="stat-content">
              <h3>{stats.total}</h3>
              <p>Total Users</p>
            </div>
          </div>
        </div>

        {viewMode === 'marker' ? (
          <>
            {/* Date Selection */}
            <div className="date-selection-card">
              <div className="card-header">
                <h3>Select Date</h3>
                <Calendar size={20} />
              </div>
              <div className="card-body">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="date-input"
                  max={new Date().toISOString().split('T')[0]}
                />
                <p className="date-hint">Select any previous date to mark/edit attendance</p>
              </div>
            </div>

            {/* Bulk Actions */}
            <div className="bulk-actions-card">
              <div className="card-header">
                <h3>Bulk Actions</h3>
                <span className="selection-count">{selectedUsers.length} selected</span>
              </div>
              <div className="card-body">
                <div className="bulk-form">
                  <div className="form-group">
                    <label>Action Type</label>
                    <div className="action-buttons">
                      <button
                        className={`action-btn ${bulkAction === 'present' ? 'active' : ''}`}
                        onClick={() => setBulkAction('present')}
                      >
                        <CheckCircle size={16} />
                        <span>Present</span>
                      </button>
                      <button
                        className={`action-btn ${bulkAction === 'absent' ? 'active' : ''}`}
                        onClick={() => setBulkAction('absent')}
                      >
                        <XCircle size={16} />
                        <span>Absent</span>
                      </button>
                      <button
                        className={`action-btn ${bulkAction === 'half-day' ? 'active' : ''}`}
                        onClick={() => setBulkAction('half-day')}
                      >
                        <Clock size={16} />
                        <span>Half Day</span>
                      </button>
                      <button
                        className={`action-btn ${bulkAction === 'permission' ? 'active' : ''}`}
                        onClick={() => setBulkAction('permission')}
                      >
                        <Calendar size={16} />
                        <span>Permission</span>
                      </button>
                    </div>
                  </div>

                  {bulkAction === 'absent' && (
                    <div className="form-group">
                      <label>Absence Reason (Required)</label>
                      <input
                        type="text"
                        value={absenceReason}
                        onChange={(e) => setAbsenceReason(e.target.value)}
                        className="form-input"
                        placeholder="Enter reason for absence"
                      />
                    </div>
                  )}

                  {bulkAction === 'permission' && (
                    <div className="permission-fields">
                      <div className="form-row">
                        <div className="form-group">
                          <label>From (HH:mm)</label>
                          <input
                            type="time"
                            value={permissionFrom}
                            onChange={(e) => setPermissionFrom(e.target.value)}
                            className="form-input"
                            required
                          />
                          <small className="input-hint">24-hour format (09:30, 14:45)</small>
                        </div>
                        <div className="form-group">
                          <label>To (HH:mm)</label>
                          <input
                            type="time"
                            value={permissionTo}
                            onChange={(e) => setPermissionTo(e.target.value)}
                            className="form-input"
                            required
                          />
                          <small className="input-hint">24-hour format (12:30, 17:15)</small>
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Reason</label>
                        <textarea
                          value={permissionReason}
                          onChange={(e) => setPermissionReason(e.target.value)}
                          className="form-input"
                          placeholder="Enter reason for permission leave"
                          rows="2"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <button
                          className="btn-apply-permission"
                          onClick={handleBulkPermission}
                          disabled={selectedUsers.length === 0 || loading}
                        >
                          {loading ? 'Processing...' : `Apply Permission to ${selectedUsers.length} User(s)`}
                        </button>
                        <small className="info-hint">
                          Note: Permission time will be deducted from total working hours if check-in/check-out exists
                        </small>
                      </div>
                    </div>
                  )}


                  <div className="bulk-controls">
                    <button className="btn-select-all" onClick={selectAllUsers}>
                      {selectedUsers.length === users.length ? (
                        <>
                          <Square size={16} />
                          <span>Deselect All</span>
                        </>
                      ) : (
                        <>
                          <CheckSquare size={16} />
                          <span>Select All ({users.length})</span>
                        </>
                      )}
                    </button>
                    <button
                      className="btn-apply-bulk"
                      onClick={applyBulkAction}
                      disabled={selectedUsers.length === 0}
                    >
                      Apply to Selected
                    </button>
                    <button
                      className="btn-bulk-edit"
                      onClick={handleBulkEditClick}
                      disabled={selectedUsers.length === 0}
                    >
                      <Edit2 size={16} />
                      <span>Bulk Edit</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance Table */}
            <div className="attendance-table-card">
              <div className="card-header">
                <h3>Attendance for {selectedDate}</h3>
                <div className="header-actions">
                  <button
                    className={`btn-filter ${showFilters ? 'active' : ''}`}
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter size={16} />
                    <span>Filters</span>
                  </button>
                  <button
                    className="btn-submit-all"
                    onClick={submitAllAttendance}
                    disabled={loading}
                  >
                    <Save size={16} />
                    <span>{loading ? 'Submitting...' : 'Submit All'}</span>
                  </button>
                </div>
              </div>

              {showFilters && (
                <div className="filter-section">
                  <div className="filter-group">
                    <label>
                      <Search size={16} />
                      <span>Search</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Search by name..."
                      className="filter-input"
                    />
                  </div>
                </div>
              )}

              {usersLoading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading users...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="empty-state">
                  <Users size={48} />
                  <h3>No Users Found</h3>
                  <p>Add users to start managing attendance</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="attendance-table">
                    <thead>
                      <tr>
                        <th style={{ width: '60px' }}>
                          <input
                            type="checkbox"
                            checked={selectedUsers.length === users.length}
                            onChange={selectAllUsers}
                          />
                        </th>
                        <th>Employee</th>
                        <th>Designation</th>
                        <th>Department</th>
                        <th>Status</th>
                        <th>Time</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map(user => {
                        const record = attendanceRecords[user.id] || {
                          status: 'pending',
                          checkIn: '09:30',
                          checkOut: '19:00',
                          absenceReason: '',
                          alreadyMarked: false
                        };
                        const existing = existingAttendance[user.id];
                        const isAlreadyMarked = existing || record.alreadyMarked;
                        const isExpanded = expandedUsers[user.id];

                        return (
                          <React.Fragment key={user.id}>
                            <tr className={`user-row ${isAlreadyMarked ? 'marked' : ''} ${record.status}`}>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={selectedUsers.includes(user.id)}
                                  onChange={() => toggleUserSelection(user.id)}
                                />
                              </td>
                              <td>
                                <div className="user-cell">
                                  <div className="user-avatar">
                                    {user.profile_url ? (
                                      <img src={user.profile_url} alt={user.name} />
                                    ) : (
                                      <User size={20} />
                                    )}
                                  </div>
                                  <div className="user-info">
                                    <strong>{user.name}</strong>
                                    <small>{user.employee_id || 'N/A'}</small>
                                  </div>
                                  <button
                                    className="expand-btn"
                                    onClick={() => toggleUserExpansion(user.id)}
                                  >
                                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                  </button>
                                </div>
                              </td>
                              <td>
                                <div className="designation-cell">
                                  <Briefcase size={14} />
                                  <span>{user.designation || 'N/A'}</span>
                                </div>
                              </td>
                              <td>
                                <div className="department-cell">
                                  <Building size={14} />
                                  <span>{user.mobile || 'N/A'}</span>
                                </div>
                              </td>
                              <td>
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
                                  disabled={isAlreadyMarked}
                                >
                                  <option value="pending">-- Select --</option>
                                  <option value="present">Present</option>
                                  <option value="absent">Absent</option>
                                  <option value="half-day-morning">Half Day (AM)</option>
                                  <option value="half-day-afternoon">Half Day (PM)</option>
                                  <option value="permission">Permission</option>
                                </select>
                              </td>
                              <td>
                                <div className="time-controls">
                                  {['present', 'half-day-morning', 'half-day-afternoon'].includes(record.status) ? (
                                    <>
                                      <input
                                        type="time"
                                        value={record.checkIn || ''}
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
                                        disabled={isAlreadyMarked}
                                      />
                                      <span className="time-separator">-</span>
                                      <input
                                        type="time"
                                        value={record.checkOut || ''}
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
                                        disabled={isAlreadyMarked}
                                      />
                                    </>
                                  ) : record.status === 'absent' ? (
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
                                      placeholder="Absence reason"
                                      disabled={isAlreadyMarked}
                                    />
                                  ) : record.status === 'permission' ? (
                                    <div className="permission-inputs">
                                      <input
                                        type="time"
                                        value={permissionFrom}
                                        onChange={(e) => setPermissionFrom(e.target.value)}
                                        className="time-input"
                                        placeholder="From"
                                        disabled={isAlreadyMarked}
                                      />
                                      <span className="time-separator">to</span>
                                      <input
                                        type="time"
                                        value={permissionTo}
                                        onChange={(e) => setPermissionTo(e.target.value)}
                                        className="time-input"
                                        placeholder="To"
                                        disabled={isAlreadyMarked}
                                      />
                                      <input
                                        type="text"
                                        value={permissionReason}
                                        onChange={(e) => setPermissionReason(e.target.value)}
                                        className="reason-input"
                                        placeholder="Permission reason"
                                        disabled={isAlreadyMarked}
                                      />
                                    </div>
                                  ) : (
                                    <span className="no-time">--:--</span>
                                  )}
                                </div>
                              </td>
                              <td>
                                <div className="action-buttons">
                                  <button
                                    className="btn-submit"
                                    onClick={() => submitIndividualAttendance(user.id)}
                                    disabled={isAlreadyMarked || record.status === 'pending'}
                                    title={isAlreadyMarked ? "Already marked" : "Submit attendance"}
                                  >
                                    <Save size={14} />
                                  </button>
                                  <button
                                    className="btn-edit"
                                    onClick={() => handleEditAttendance(user)}
                                    title="Edit attendance"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr className="details-row">
                                <td colSpan="7">
                                  <div className="user-details">
                                    <div className="detail-section">
                                      <h4>Attendance Details</h4>
                                      <div className="detail-grid">
                                        <div className="detail-item">
                                          <span className="detail-label">Status:</span>
                                          <span className={`detail-value status-${record.status}`}>
                                            {record.status.replace('-', ' ').toUpperCase()}
                                          </span>
                                        </div>
                                        {record.status === 'absent' && (
                                          <div className="detail-item">
                                            <span className="detail-label">Reason:</span>
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
                                              className="detail-input"
                                              placeholder="Absence reason"
                                            />
                                          </div>
                                        )}
                                        {record.status === 'permission' && (
                                          <div className="detail-item">
                                            <span className="detail-label">Permission:</span>
                                            <div className="permission-details">
                                              <input
                                                type="time"
                                                value={permissionFrom}
                                                onChange={(e) => setPermissionFrom(e.target.value)}
                                                className="detail-input"
                                                placeholder="HH:mm"
                                              />
                                              <span className="time-separator">to</span>
                                              <input
                                                type="time"
                                                value={permissionTo}
                                                onChange={(e) => setPermissionTo(e.target.value)}
                                                className="detail-input"
                                                placeholder="HH:mm"
                                              />
                                              <input
                                                type="text"
                                                value={permissionReason}
                                                onChange={(e) => setPermissionReason(e.target.value)}
                                                className="detail-input"
                                                placeholder="Reason"
                                              />
                                              <button
                                                className="btn-save-permission"
                                                onClick={() => {
                                                  // Update the record with permission data
                                                  const updated = { ...attendanceRecords };
                                                  updated[user.id] = {
                                                    ...updated[user.id],
                                                    permissionTime: `${permissionFrom}-${permissionTo}`,
                                                    permissionReason: permissionReason,
                                                    alreadyMarked: false
                                                  };
                                                  setAttendanceRecords(updated);
                                                  handlePermissionSubmit(user.id);
                                                }}
                                                disabled={!permissionFrom || !permissionTo || !permissionReason.trim()}
                                              >
                                                Save
                                              </button>
                                            </div>
                                          </div>
                                        )}


                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="pagination">
                      <button
                        className="pagination-btn"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNumber;
                        if (totalPages <= 5) {
                          pageNumber = i + 1;
                        } else if (currentPage <= 3) {
                          pageNumber = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNumber = totalPages - 4 + i;
                        } else {
                          pageNumber = currentPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNumber}
                            className={`pagination-btn ${currentPage === pageNumber ? 'active' : ''}`}
                            onClick={() => setCurrentPage(pageNumber)}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}
                      <button
                        className="pagination-btn"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Viewer Mode */}
            <div className="viewer-card">
              <div className="card-header">
                <h3>Attendance Records Viewer</h3>
                <div className="header-actions">
                  <button className="btn-export" onClick={exportToCSV}>
                    <Download size={16} />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              <div className="filter-panel">
                <div className="filter-grid">
                  <div className="form-group">
                    <label>Employee Name</label>
                    <div className="input-with-icon">
                      <Search size={16} />
                      <input
                        type="text"
                        name="name"
                        value={filters.name}
                        onChange={handleFilterChange}
                        placeholder="Search by name..."
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Date Range</label>
                    <div className="date-range">
                      <input
                        type="date"
                        name="startDate"
                        value={filters.startDate}
                        onChange={handleFilterChange}
                      />
                      <span>to</span>
                      <input
                        type="date"
                        name="endDate"
                        value={filters.endDate}
                        onChange={handleFilterChange}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      name="status"
                      value={filters.status}
                      onChange={handleFilterChange}
                    >
                      <option value="all">All Status</option>
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="half-day">Half Day</option>
                      <option value="permission">Permission</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Department</label>
                    <select
                      name="department"
                      value={filters.department}
                      onChange={handleFilterChange}
                    >
                      <option value="all">All Departments</option>
                      {getDepartments().map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <button className="btn-apply-filters" onClick={fetchAllAttendance}>
                      Apply Filters
                    </button>
                  </div>
                </div>
              </div>

              {attendanceLoading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading attendance data...</p>
                </div>
              ) : allAttendanceData.length === 0 ? (
                <div className="empty-state">
                  <FileText size={48} />
                  <h3>No Records Found</h3>
                  <p>Try adjusting your filters</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="records-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Employee</th>
                        <th>Department</th>
                        <th>Check In</th>
                        <th>Check Out</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allAttendanceData.slice(0, 50).map((item, index) => {
                        const user = users.find(u => u.id === item.user_id) || item.user_info;
                        return (
                          <tr key={index} className={`status-${item.status?.toLowerCase().replace(' ', '-')}`}>
                            <td>{item.date}</td>
                            <td>
                              <div className="user-cell">
                                <div className="user-avatar">
                                  {item.user_info?.profile_url ? (
                                    <img src={item.user_info.profile_url} alt={item.user_info.name} />
                                  ) : (
                                    <User size={20} />
                                  )}
                                </div>
                                <div className="user-info">
                                  <strong>{item.user_info?.name || 'Unknown'}</strong>
                                  <small>{item.user_info?.employee_id || 'N/A'}</small>
                                </div>
                              </div>
                            </td>
                            <td>{item.user_info?.department || 'N/A'}</td>
                            <td>{item.check_in_ist || '--:--'}</td>
                            <td>{item.check_out_ist || '--:--'}</td>
                            <td>
                              <span className={`status-badge status-${item.status?.toLowerCase().replace(' ', '-')}`}>
                                {item.status || 'Unknown'}
                              </span>
                            </td>
                            <td>
                              <button
                                className="btn-edit"
                                onClick={() => user && handleEditAttendance(user, item.date)}
                                title="Edit record"
                              >
                                <Edit2 size={14} />
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
        )}
      </main>

      {/* Edit Attendance Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Edit Attendance</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Employee</label>
                <div className="employee-display">
                  <div className="user-avatar large">
                    {editAttendanceData.userName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h4>{editAttendanceData.userName}</h4>
                    <p>Employee ID: {users.find(u => u.id === editAttendanceData.userId)?.employee_id || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={editAttendanceData.date}
                  onChange={(e) => setEditAttendanceData(prev => ({ ...prev, date: e.target.value }))}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="form-group">
                <label>Attendance Type</label>
                <div className="type-selector">
                  {['present', 'absent', 'half-day', 'permission'].map(type => (
                    <button
                      key={type}
                      className={`type-option ${editAttendanceData.attendanceType === type ? 'active' : ''}`}
                      onClick={() => setEditAttendanceData(prev => ({
                        ...prev,
                        attendanceType: type,
                        // Set default times when selecting half-day
                        ...(type === 'half-day' ? {
                          halfDayType: 'morning',
                          halfDayCheckIn: '09:30',
                          halfDayCheckOut: '13:00'
                        } : {}),
                        // Set default times for present
                        ...(type === 'present' ? {
                          checkIn: '09:30',
                          checkOut: '19:00'
                        } : {})
                      }))}
                    >
                      {type === 'present' && <CheckCircle size={18} />}
                      {type === 'absent' && <XCircle size={18} />}
                      {type === 'half-day' && <Clock size={18} />}
                      {type === 'permission' && <Calendar size={18} />}
                      <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional fields based on type */}
              {editAttendanceData.attendanceType === 'present' && (
                <div className="time-fields">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Check In</label>
                      <input
                        type="time"
                        value={editAttendanceData.checkIn}
                        onChange={(e) => setEditAttendanceData(prev => ({ ...prev, checkIn: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label>Check Out</label>
                      <input
                        type="time"
                        value={editAttendanceData.checkOut}
                        onChange={(e) => setEditAttendanceData(prev => ({ ...prev, checkOut: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              )}

              {editAttendanceData.attendanceType === 'absent' && (
                <div className="form-group">
                  <label>Absence Reason</label>
                  <input
                    type="text"
                    value={editAttendanceData.absenceReason}
                    onChange={(e) => setEditAttendanceData(prev => ({ ...prev, absenceReason: e.target.value }))}
                    placeholder="Enter reason for absence"
                  />
                </div>
              )}

              {editAttendanceData.attendanceType === 'half-day' && (
                <div className="halfday-fields">
                  <div className="form-group">
                    <label>Half Day Type</label>
                    <div className="halfday-type-selector">
                      <button
                        className={`halfday-option ${editAttendanceData.halfDayType === 'morning' ? 'active' : ''}`}
                        onClick={() => setEditAttendanceData(prev => ({
                          ...prev,
                          halfDayType: 'morning',
                          halfDayCheckIn: '09:30',
                          halfDayCheckOut: '13:00'
                        }))}
                      >
                        <div className="halfday-icon">☀️</div>
                        <span>Morning</span>
                        <small>09:30 - 01:00</small>
                      </button>
                      <button
                        className={`halfday-option ${editAttendanceData.halfDayType === 'afternoon' ? 'active' : ''}`}
                        onClick={() => setEditAttendanceData(prev => ({
                          ...prev,
                          halfDayType: 'afternoon',
                          halfDayCheckIn: '13:30',
                          halfDayCheckOut: '19:00'
                        }))}
                      >
                        <div className="halfday-icon">🌅</div>
                        <span>Afternoon</span>
                        <small>01:30 - 07:00</small>
                      </button>
                    </div>
                  </div>

                  <div className="time-fields">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Start Time</label>
                        <input
                          type="time"
                          value={editAttendanceData.halfDayCheckIn}
                          onChange={(e) => setEditAttendanceData(prev => ({ ...prev, halfDayCheckIn: e.target.value }))}
                          className="time-input"
                        />
                        <small className="input-hint">
                          {editAttendanceData.halfDayType === 'morning' ? 'Morning shift start' : 'Afternoon shift start'}
                        </small>
                      </div>
                      <div className="form-group">
                        <label>End Time</label>
                        <input
                          type="time"
                          value={editAttendanceData.halfDayCheckOut}
                          onChange={(e) => setEditAttendanceData(prev => ({ ...prev, halfDayCheckOut: e.target.value }))}
                          className="time-input"
                        />
                        <small className="input-hint">
                          {editAttendanceData.halfDayType === 'morning' ? 'Morning shift end' : 'Afternoon shift end'}
                        </small>
                      </div>
                    </div>
                  </div>

                  <div className="halfday-info">
                    <AlertCircle size={16} />
                    <small>
                      Half day attendance: {editAttendanceData.halfDayType === 'morning' ? 'Morning (4 hours)' : 'Afternoon (4 hours)'}
                    </small>
                  </div>
                </div>
              )}

              {editAttendanceData.attendanceType === 'permission' && (
                <div className="permission-fields">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Permission From (IST)</label>
                      <input
                        type="time"
                        value={editAttendanceData.permissionFrom}
                        onChange={(e) => setEditAttendanceData(prev => ({ ...prev, permissionFrom: e.target.value }))}
                        required
                      />
                      <small className="input-hint">Time in IST (24-hour format)</small>
                    </div>
                    <div className="form-group">
                      <label>Permission To (IST)</label>
                      <input
                        type="time"
                        value={editAttendanceData.permissionTo}
                        onChange={(e) => setEditAttendanceData(prev => ({ ...prev, permissionTo: e.target.value }))}
                        required
                      />
                      <small className="input-hint">Time in IST (24-hour format)</small>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Permission Reason</label>
                    <textarea
                      value={editAttendanceData.permissionReason}
                      onChange={(e) => setEditAttendanceData(prev => ({ ...prev, permissionReason: e.target.value }))}
                      placeholder="Reason for permission leave"
                      rows="2"
                      required
                    />
                  </div>
                  <div className="permission-info">
                    <AlertCircle size={16} />
                    <small>
                      Permission time will be stored in IST timezone and automatically deducted from total working hours if check-in/check-out exists.
                    </small>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={editAttendanceData.notes}
                  onChange={(e) => setEditAttendanceData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes..."
                  rows="3"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowEditModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleEditSubmit}>
                Save Changes
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
              <h2>Bulk Edit Attendance</h2>
              <button className="modal-close" onClick={() => setShowBulkEditModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="bulk-info">
                <Users size={24} />
                <span>{selectedUsers.length} users selected</span>
              </div>

              <div className="form-group">
                <label>Apply to Date</label>
                <input
                  type="date"
                  value={bulkEditData.date}
                  onChange={(e) => setBulkEditData(prev => ({ ...prev, date: e.target.value }))}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="form-group">
                <label>Attendance Type</label>
                <div className="type-selector">
                  {['present', 'absent', 'half-day', 'permission'].map(type => (
                    <button
                      key={type}
                      className={`type-option ${bulkEditData.attendanceType === type ? 'active' : ''}`}
                      onClick={() => setBulkEditData(prev => ({ ...prev, attendanceType: type }))}
                    >
                      {type === 'present' && <CheckCircle size={18} />}
                      {type === 'absent' && <XCircle size={18} />}
                      {type === 'half-day' && <Clock size={18} />}
                      {type === 'permission' && <Calendar size={18} />}
                      <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional fields based on type */}
              {bulkEditData.attendanceType === 'absent' && (
                <div className="form-group">
                  <label>Absence Reason</label>
                  <input
                    type="text"
                    value={bulkEditData.absenceReason}
                    onChange={(e) => setBulkEditData(prev => ({ ...prev, absenceReason: e.target.value }))}
                    placeholder="Reason for all selected users"
                  />
                </div>
              )}

              {bulkEditData.attendanceType === 'permission' && (
                <div className="permission-fields">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Permission From (IST)</label>
                      <input
                        type="time"
                        value={bulkEditData.permissionFrom}
                        onChange={(e) => setBulkEditData(prev => ({ ...prev, permissionFrom: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Permission To (IST)</label>
                      <input
                        type="time"
                        value={bulkEditData.permissionTo}
                        onChange={(e) => setBulkEditData(prev => ({ ...prev, permissionTo: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Permission Reason</label>
                    <textarea
                      value={bulkEditData.permissionReason}
                      onChange={(e) => setBulkEditData(prev => ({ ...prev, permissionReason: e.target.value }))}
                      placeholder="Reason for permission leave"
                      rows="2"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Notes (Optional)</label>
                <textarea
                  value={bulkEditData.notes}
                  onChange={(e) => setBulkEditData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes for all users..."
                  rows="3"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowBulkEditModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleBulkEditSubmit}>
                Apply to {selectedUsers.length} Users
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="dashboard-footer">
        <p>© {new Date().getFullYear()} Attendance Management System</p>
        <div className="footer-links">
          <span>•</span>
          <a href="#help">Help</a>
          <span>•</span>
          <a href="#docs">Documentation</a>
          <span>•</span>
          <a href="#support">Support</a>
        </div>
      </footer>
    </div>
  );
}