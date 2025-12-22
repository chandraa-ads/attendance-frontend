import React, { useState, useEffect } from 'react';
import '../../assets/styles/AdminAllAttendance.css';
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from 'xlsx';

export default function AdminAllAttendance() {
  const [attendance, setAttendance] = useState([]);
  const [filteredAttendance, setFilteredAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    date: '',
    name: '',
    employeeId: '',
    status: '',
    startDate: '',
    endDate: '',
    department: '',
    reportType: 'detailed'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [selectedDates, setSelectedDates] = useState([]);
  const [showDateRange, setShowDateRange] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const getToken = () => {
    const authData = JSON.parse(localStorage.getItem("auth"));
    return authData?.session?.access_token || authData?.access_token || authData?.token || null;
  };

  
  useEffect(() => {
    fetchAttendance();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, attendance]);

  const getYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  };

  const getLastWeekDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 7; i++) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const getDateRange = (startDate, endDate) => {
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const token = getToken();

      const res = await fetch('https://attendance-backend-d4vi.onrender.com/attendance/all', {
        headers: token ? {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        } : {},
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to fetch attendance: ${res.status} ${errorText}`);
      }

      const data = await res.json();
      console.log('Fetched attendance data:', data);
      setAttendance(data);
      setFilteredAttendance(data);
    } catch (err) {
      console.error("Attendance fetch error", err);
      alert('Error fetching attendance: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceByDateRange = async (startDate, endDate) => {
    try {
      setLoading(true);
      const token = getToken();

      const url = `https://attendance-backend-d4vi.onrender.com/attendance/filter?startDate=${startDate}&endDate=${endDate}`;
      const res = await fetch(url, {
        headers: token ? {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        } : {},
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to fetch attendance: ${res.status} ${errorText}`);
      }

      const data = await res.json();
      return data.data || data;
    } catch (err) {
      console.error("Date range fetch error", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // New function to generate PDF via backend
  // ✅ Backend PDF generator (UPDATED)
  const generateBackendPDF = async () => {
    try {
      setGeneratingPDF(true);
      const token = getToken();

      // ✅ Build payload dynamically (NO empty strings)
      const payload = {
        reportType: filters.reportType || 'detailed'
      };

      // Priority: day → month → date range
      if (filters.date) {
        payload.day = filters.date;
      } else if (filters.startDate && filters.endDate) {
        payload.startDate = filters.startDate;
        payload.endDate = filters.endDate;
      }

      if (filters.employeeId) payload.employeeId = filters.employeeId;
      if (filters.department) payload.department = filters.department;

      console.log('📄 Backend PDF Payload:', payload);

      const response = await fetch(
        'https://attendance-backend-d4vi.onrender.com/attendance/generate-pdf',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status} - ${errorText}`);
      }

      // ✅ Download PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');

      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `attendance-report-${new Date().toISOString().slice(0, 10)}.pdf`;

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?(.+)"?/);
        if (match?.[1]) filename = match[1];
      }

      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      alert('✅ PDF generated successfully (Backend)');
    } catch (error) {
      console.error('❌ Backend PDF error:', error);
      alert('Backend PDF failed, using client PDF...');
      handleExportPDF(false); // fallback
    } finally {
      setGeneratingPDF(false);
    }
  };


  // Enhanced PDF export with both options
  const handleExportPDF = async (useBackend = false) => {
    if (filteredAttendance.length === 0) {
      alert('No data to export!');
      return;
    }

    if (useBackend) {
      await generateBackendPDF();
      return;
    }

    // client-side logic remains SAME
    // (no change needed below)
  };


  const handleViewYesterday = async () => {
    const yesterday = getYesterday();
    try {
      const data = await fetchAttendanceByDateRange(yesterday, yesterday);
      setFilteredAttendance(data);
      setFilters(prev => ({
        ...prev,
        date: yesterday,
        startDate: '',
        endDate: ''
      }));
      setSelectedDates([yesterday]);
    } catch (err) {
      alert('Error fetching yesterday\'s attendance: ' + err.message);
    }
  };

  const handleViewLastWeek = async () => {
    const dates = getLastWeekDates();
    const startDate = dates[dates.length - 1];
    const endDate = dates[0];

    try {
      const data = await fetchAttendanceByDateRange(startDate, endDate);
      setFilteredAttendance(data);
      setFilters(prev => ({
        ...prev,
        date: '',
        startDate: startDate,
        endDate: endDate
      }));
      setSelectedDates(dates);
    } catch (err) {
      alert('Error fetching last week\'s attendance: ' + err.message);
    }
  };

  const handleApplyDateRange = async () => {
    if (!filters.startDate || !filters.endDate) {
      alert('Please select both start and end dates');
      return;
    }

    try {
      const data = await fetchAttendanceByDateRange(filters.startDate, filters.endDate);
      setFilteredAttendance(data);
      const dates = getDateRange(filters.startDate, filters.endDate);
      setSelectedDates(dates);
    } catch (err) {
      alert('Error fetching date range attendance: ' + err.message);
    }
  };

  const applyFilters = () => {
    let filtered = [...attendance];

    if (filters.date) {
      filtered = filtered.filter(record => record.date === filters.date);
      setSelectedDates([filters.date]);
    }

    if (filters.startDate && filters.endDate) {
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.date);
        const startDate = new Date(filters.startDate);
        const endDate = new Date(filters.endDate);
        return recordDate >= startDate && recordDate <= endDate;
      });
    }

    if (filters.name) {
      filtered = filtered.filter(record =>
        record.user_info?.name?.toLowerCase().includes(filters.name.toLowerCase())
      );
    }

    if (filters.employeeId) {
      filtered = filtered.filter(record =>
        record.user_info?.employee_id?.toLowerCase().includes(filters.employeeId.toLowerCase())
      );
    }

    if (filters.status) {
      filtered = filtered.filter(record => {
        const status = getStatus(record);
        return status.toLowerCase().replace(' ', '-') === filters.status.toLowerCase();
      });
    }

    setFilteredAttendance(filtered);
    setCurrentPage(1);
  };

  const getStatus = (record) => {
    if (record.is_absent) return 'Absent';
    if (record.check_in && !record.check_out) return 'Checked In';
    if (record.check_in && record.check_out) return 'Checked Out';
    return 'Not Checked In';
  };

  const formatTime = (datetime) => {
    if (!datetime) return "-";
    try {
      const dateObj = new Date(datetime);
      return dateObj.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return "-";
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      date: '',
      name: '',
      employeeId: '',
      status: '',
      startDate: '',
      endDate: '',
      department: '',
      reportType: 'detailed'
    });
    setSelectedDates([]);
    setFilteredAttendance(attendance);
  };

  const handleExportCSV = () => {
    if (filteredAttendance.length === 0) {
      alert('No data to export!');
      return;
    }

    try {
      const csvContent = [
        ['Date', 'Employee ID', 'Name', 'Email', 'Department', 'Designation',
          'Check In (IST)', 'Check Out (IST)', 'Total Time', 'Status',
          'Absence Reason', 'Manual Entry', 'Record Date'],
        ...filteredAttendance.map(record => [
          record.date,
          `"${record.user_info?.employee_id || '-'}"`,
          `"${record.user_info?.name || '-'}"`,
          `"${record.user_info?.email || '-'}"`,
          `"${record.user_info?.department || '-'}"`,
          `"${record.user_info?.designation || '-'}"`,
          `"${formatTime(record.check_in)}"`,
          `"${formatTime(record.check_out)}"`,
          `"${record.total_time_formatted || '-'}"`,
          `"${getStatus(record)}"`,
          `"${record.absence_reason || '-'}"`,
          record.manual_entry ? 'Yes' : 'No',
          `"${new Date().toLocaleDateString()}"`
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const filename = `attendance-report-${filters.date || 'all'}-${new Date().toISOString().split('T')[0]}.csv`;
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      console.log(`CSV exported: ${filteredAttendance.length} records`);
    } catch (err) {
      console.error('CSV export error:', err);
      alert('Error exporting CSV: ' + err.message);
    }
  };

  const handleExportExcel = () => {
    if (filteredAttendance.length === 0) {
      alert('No data to export!');
      return;
    }

    try {
      const dataToExport = filteredAttendance.map(record => ({
        'Date': record.date,
        'Employee ID': record.user_info?.employee_id || '-',
        'Name': record.user_info?.name || '-',
        'Email': record.user_info?.email || '-',
        'Department': record.user_info?.department || '-',
        'Designation': record.user_info?.designation || '-',
        'Check In (IST)': formatTime(record.check_in),
        'Check Out (IST)': formatTime(record.check_out),
        'Total Time': record.total_time_formatted || '-',
        'Status': getStatus(record),
        'Absence Reason': record.absence_reason || '-',
        'Manual Entry': record.manual_entry ? 'Yes' : 'No',
        'Record Date': new Date().toLocaleDateString()
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Attendance");

      const wscols = [
        { wch: 10 }, { wch: 12 }, { wch: 20 }, { wch: 25 },
        { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 12 },
        { wch: 10 }, { wch: 12 }, { wch: 30 }, { wch: 10 }, { wch: 12 }
      ];
      ws['!cols'] = wscols;

      const filename = `attendance-report-${filters.date || 'all'}-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, filename);

      console.log(`Excel exported: ${filteredAttendance.length} records`);
    } catch (err) {
      console.error('Excel export error:', err);
      alert('Error exporting Excel: ' + err.message);
    }
  };

  const handleExportSummary = () => {
    try {
      const doc = new jsPDF();

      doc.setFontSize(20);
      doc.text('Attendance Summary Report', 105, 20, null, null, 'center');

      doc.setFontSize(12);
      doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 105, 30, null, null, 'center');

      doc.setFontSize(14);
      doc.text('Overall Statistics', 20, 50);

      doc.setFontSize(10);
      const stats = getStats();
      const summary = [
        `Total Records: ${stats.totalRecords}`,
        `Today's Records: ${stats.todayRecords}`,
        `Yesterday's Records: ${stats.yesterdayRecords}`,
        `Present Today: ${stats.presentToday}`,
        `Absent Today: ${stats.absentToday}`,
        `Filtered Results: ${stats.filteredRecords}`
      ];

      summary.forEach((item, index) => {
        doc.text(item, 25, 65 + (index * 7));
      });

      const filteredStats = {
        present: filteredAttendance.filter(a => !a.is_absent && a.check_in).length,
        absent: filteredAttendance.filter(a => a.is_absent).length,
        checkedIn: filteredAttendance.filter(a => a.check_in && !a.check_out).length,
        manual: filteredAttendance.filter(a => a.manual_entry).length,
        auto: filteredAttendance.filter(a => !a.manual_entry).length
      };

      doc.setFontSize(14);
      doc.text('Filtered Data Summary', 20, 140);
      doc.setFontSize(10);

      const filteredSummary = [
        `Present: ${filteredStats.present}`,
        `Absent: ${filteredStats.absent}`,
        `Checked In (No Check-out): ${filteredStats.checkedIn}`,
        `Manual Entries: ${filteredStats.manual}`,
        `Auto Entries: ${filteredStats.auto}`
      ];

      filteredSummary.forEach((item, index) => {
        doc.text(item, 25, 155 + (index * 7));
      });

      doc.setFontSize(14);
      doc.text('Active Filters', 20, 200);
      doc.setFontSize(10);

      const activeFilters = [];
      if (filters.date) activeFilters.push(`Date: ${filters.date}`);
      if (filters.startDate && filters.endDate) activeFilters.push(`Date Range: ${filters.startDate} to ${filters.endDate}`);
      if (filters.name) activeFilters.push(`Name: ${filters.name}`);
      if (filters.employeeId) activeFilters.push(`Employee ID: ${filters.employeeId}`);
      if (filters.status) activeFilters.push(`Status: ${filters.status}`);
      if (filters.department) activeFilters.push(`Department: ${filters.department}`);
      if (activeFilters.length === 0) activeFilters.push('No filters applied');

      activeFilters.forEach((item, index) => {
        doc.text(item, 25, 215 + (index * 7));
      });

      const filename = `attendance-summary-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);

    } catch (err) {
      console.error('Summary PDF export error:', err);
      alert('Error exporting summary: ' + err.message);
    }
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAttendance.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAttendance.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const getStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = getYesterday();
    const todayRecords = attendance.filter(a => a.date === today);
    const yesterdayRecords = attendance.filter(a => a.date === yesterday);

    return {
      totalRecords: attendance.length,
      todayRecords: todayRecords.length,
      yesterdayRecords: yesterdayRecords.length,
      presentToday: todayRecords.filter(a => !a.is_absent && a.check_in).length,
      absentToday: todayRecords.filter(a => a.is_absent).length,
      presentYesterday: yesterdayRecords.filter(a => !a.is_absent && a.check_in).length,
      absentYesterday: yesterdayRecords.filter(a => a.is_absent).length,
      filteredRecords: filteredAttendance.length,
      dateRange: selectedDates.length > 0
        ? `${selectedDates.length} day(s): ${selectedDates[0]} ${selectedDates.length > 1 ? `to ${selectedDates[selectedDates.length - 1]}` : ''}`
        : 'No date range selected'
    };
  };

  const stats = getStats();

  return (
    <div className="admin-all-attendance">
      <div className="header">
        <div className="header-main">
          <h1>All Attendance Records</h1>
          <div className="header-actions">
            <button onClick={handleExportCSV} className="export-btn csv" title="Export as CSV">
              📄 Export CSV
            </button>
            <button onClick={handleExportExcel} className="export-btn excel" title="Export as Excel">
              📊 Export Excel
            </button>
            <div className="pdf-export-group">
              {/* <button
                onClick={() => handleExportPDF(false)}
                className="export-btn pdf"
                disabled={generatingPDF}
              >
                📑 Export PDF (Client)
              </button> */}

              <button
                onClick={() => handleExportPDF(true)}
                className="export-btn pdf-backend "
                disabled={generatingPDF}
              >
                {generatingPDF ? '⏳ Generating...' : '🚀 Export PDF (Backend)'}
              </button>

            </div>
            <button onClick={handleExportSummary} className="export-btn summary" title="Export Summary Report">
              📈 Summary Report
            </button>
            <button onClick={fetchAttendance} className="refresh-btn" title="Refresh Data">
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-cards">
        <div className="stat-card">
          <h3>Total Records</h3>
          <p className="stat-value">{stats.totalRecords}</p>
        </div>
        <div className="stat-card">
          <h3>Today's Records</h3>
          <p className="stat-value today">{stats.todayRecords}</p>
          <small>Present: {stats.presentToday} | Absent: {stats.absentToday}</small>
        </div>
        <div className="stat-card">
          <h3>Yesterday's Records</h3>
          <p className="stat-value yesterday">{stats.yesterdayRecords}</p>
          <small>Present: {stats.presentYesterday} | Absent: {stats.absentYesterday}</small>
        </div>
        <div className="stat-card">
          <h3>Filtered Results</h3>
          <p className="stat-value filtered">{stats.filteredRecords}</p>
          <small>{stats.dateRange}</small>
        </div>
      </div>

      {/* Quick Date Actions */}
      <div className="quick-actions">
        <h2>Quick Date Filters</h2>
        <div className="quick-buttons">
          <button onClick={handleViewYesterday} className="quick-btn yesterday">
            📅 View Yesterday ({getYesterday()})
          </button>
          <button onClick={handleViewLastWeek} className="quick-btn week">
            📆 View Last 7 Days
          </button>
          <button
            onClick={() => setShowDateRange(!showDateRange)}
            className={`quick-btn ${showDateRange ? 'active' : ''}`}
          >
            📅 Custom Date Range
          </button>
        </div>

        {showDateRange && (
          <div className="date-range-panel">
            <div className="range-inputs">
              <div className="range-group">
                <label>Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  max={new Date().toISOString().split('T')[0]}
                  className="range-input"
                />
              </div>
              <div className="range-group">
                <label>End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  max={new Date().toISOString().split('T')[0]}
                  className="range-input"
                />
              </div>
              <button onClick={handleApplyDateRange} className="apply-range-btn">
                Apply Date Range
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Filters Section */}
      <div className="filters-section">
        <h2>Filter Records</h2>
        <div className="filters-grid">
          <div className="filter-group">
            <label>Date (Single)</label>
            <input
              type="date"
              name="date"
              value={filters.date}
              onChange={handleFilterChange}
              max={new Date().toISOString().split('T')[0]}
              className="filter-input"
            />
          </div>
          <div className="filter-group">
            <label>Employee Name</label>
            <input
              type="text"
              name="name"
              value={filters.name}
              onChange={handleFilterChange}
              placeholder="Search by name"
              className="filter-input"
            />
          </div>
          <div className="filter-group">
            <label>Employee ID</label>
            <input
              type="text"
              name="employeeId"
              value={filters.employeeId}
              onChange={handleFilterChange}
              placeholder="Search by ID"
              className="filter-input"
            />
          </div>
          <div className="filter-group">
            <label>Department</label>
            <input
              type="text"
              name="department"
              value={filters.department}
              onChange={handleFilterChange}
              placeholder="Search by department"
              className="filter-input"
            />
          </div>
          <div className="filter-group">
            <label>Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="filter-input"
            >
              <option value="">All Status</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="checked-in">Checked In</option>
              <option value="checked-out">Checked Out</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Report Type</label>
            <select
              name="reportType"
              value={filters.reportType}
              onChange={handleFilterChange}
              className="filter-input"
            >
              <option value="detailed">Detailed Report</option>
              <option value="summary">Summary Report</option>
              <option value="daily">Daily Report</option>
            </select>
          </div>
          <div className="filter-actions">
            <button onClick={clearFilters} className="clear-btn">
              Clear All Filters
            </button>
          </div>
        </div>
      </div>

      {/* Date Range Display */}
      {selectedDates.length > 0 && (
        <div className="date-range-display">
          <h3>Selected Date{selectedDates.length > 1 ? 's' : ''}</h3>
          <div className="date-chips">
            {selectedDates.slice(0, 10).map(date => (
              <span key={date} className="date-chip">
                {date}
              </span>
            ))}
            {selectedDates.length > 10 && (
              <span className="date-chip more">+{selectedDates.length - 10} more</span>
            )}
          </div>
        </div>
      )}

      {/* Attendance Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading">Loading attendance records...</div>
        ) : (
          <>
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Total Time</th>
                  <th>Status</th>
                  <th>Absence Reason</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length > 0 ? (
                  currentItems.map((record, index) => (
                    <tr key={`${record.user_id}-${record.date}-${index}`}>
                      <td>{record.date}</td>
                      <td>{record.user_info?.employee_id || '-'}</td>
                      <td>
                        <div className="user-cell">
                          {record.user_info?.profile_url ? (
                            <img src={record.user_info.profile_url} alt={record.user_info.name} />
                          ) : (
                            <div className="avatar-initial">
                              {record.user_info?.name?.charAt(0) || 'U'}
                            </div>
                          )}
                          <span>{record.user_info?.name || '-'}</span>
                        </div>
                      </td>
                      <td>{record.user_info?.department || '-'}</td>
                      <td>{formatTime(record.check_in)}</td>
                      <td>{formatTime(record.check_out)}</td>
                      <td>{record.total_time_formatted || '-'}</td>
                      <td>
                        <span className={`status-badge ${getStatus(record).toLowerCase().replace(' ', '-')}`}>
                          {getStatus(record)}
                        </span>
                      </td>
                      <td className="absence-reason">
                        {record.absence_reason || '-'}
                      </td>
                      <td>
                        <span className={`type-badge ${record.manual_entry ? 'manual' : 'auto'}`}>
                          {record.manual_entry ? 'Manual' : 'Auto'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="no-data">
                      No attendance records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="page-btn"
                >
                  ← Previous
                </button>

                <div className="page-numbers">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => paginate(pageNum)}
                        className={`page-number ${currentPage === pageNum ? 'active' : ''}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="page-btn"
                >
                  Next →
                </button>

                <span className="page-info">
                  Page {currentPage} of {totalPages} • {filteredAttendance.length} records
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Summary Section */}
      <div className="summary-section">
        <h2>Summary</h2>
        <div className="summary-grid">
          <div className="summary-item">
            <h3>Attendance Distribution</h3>
            <p>Present: {filteredAttendance.filter(a => !a.is_absent && a.check_in).length}</p>
            <p>Absent: {filteredAttendance.filter(a => a.is_absent).length}</p>
            <p>Half Days: {filteredAttendance.filter(a => a.check_in && !a.check_out).length}</p>
          </div>
          <div className="summary-item">
            <h3>Manual vs Auto</h3>
            <p>Manual Entries: {filteredAttendance.filter(a => a.manual_entry).length}</p>
            <p>Auto Entries: {filteredAttendance.filter(a => !a.manual_entry).length}</p>
          </div>
          <div className="summary-item">
            <h3>Date Range Analysis</h3>
            <p>
              From: {filteredAttendance.length > 0
                ? filteredAttendance[filteredAttendance.length - 1].date
                : 'N/A'}
            </p>
            <p>
              To: {filteredAttendance.length > 0
                ? filteredAttendance[0].date
                : 'N/A'}
            </p>
            <p>Total Days: {new Set(filteredAttendance.map(a => a.date)).size}</p>
          </div>
        </div>
      </div>

      {/* PDF Generation Status */}
      {generatingPDF && (
        <div className="pdf-generation-status">
          <p>⏳ Generating PDF via backend... This may take a moment.</p>
          <div className="loading-spinner"></div>
        </div>
      )}

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-info">
          <small>
            Data Status: {filteredAttendance.length} filtered records, {attendance.length} total records
            <br />
            Selected Dates: {selectedDates.length}
            <br />
            PDF Backend: {generatingPDF ? 'Processing...' : 'Ready'}
          </small>
        </div>
      )}
    </div>
  );
}