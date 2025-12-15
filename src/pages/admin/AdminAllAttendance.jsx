import React, { useState, useEffect } from 'react';
import '../../assets/styles/AdminAllAttendance.css';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function AdminAllAttendance() {
  const [attendance, setAttendance] = useState([]);
  const [filteredAttendance, setFilteredAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    date: '',
    name: '',
    employeeId: '',
    status: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

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

  const applyFilters = () => {
    let filtered = [...attendance];

    if (filters.date) {
      filtered = filtered.filter(record => record.date === filters.date);
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
      status: ''
    });
  };

  // ✅ FIXED: Enhanced CSV Export
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

  // ✅ FIXED: Working Excel Export
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
      
      // Auto-size columns
      const wscols = [
        {wch: 10}, {wch: 12}, {wch: 20}, {wch: 25}, 
        {wch: 15}, {wch: 15}, {wch: 12}, {wch: 12}, 
        {wch: 10}, {wch: 12}, {wch: 30}, {wch: 10}, {wch: 12}
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

  // ✅ FIXED: Working PDF Export
  const handleExportPDF = () => {
    if (filteredAttendance.length === 0) {
      alert('No data to export!');
      return;
    }

    try {
      const doc = new jsPDF('landscape');
      
      // Title
      doc.setFontSize(18);
      doc.text('Attendance Report', 14, 22);
      
      // Subtitle with filters info
      doc.setFontSize(10);
      let subtitle = `Generated on: ${new Date().toLocaleDateString()} • Total Records: ${filteredAttendance.length}`;
      if (filters.date) subtitle += ` • Date: ${filters.date}`;
      if (filters.status) subtitle += ` • Status: ${filters.status}`;
      doc.text(subtitle, 14, 30);
      
      // Prepare table data
      const tableData = filteredAttendance.map(record => [
        record.date,
        record.user_info?.employee_id || '-',
        record.user_info?.name || '-',
        formatTime(record.check_in),
        formatTime(record.check_out),
        record.total_time_formatted || '-',
        getStatus(record),
        record.absence_reason ? record.absence_reason.substring(0, 30) + (record.absence_reason.length > 30 ? '...' : '') : '-',
        record.manual_entry ? 'Manual' : 'Auto'
      ]);
      
      // Create table
      doc.autoTable({
        startY: 40,
        head: [['Date', 'Emp ID', 'Name', 'Check In', 'Check Out', 'Total Time', 'Status', 'Absence Reason', 'Type']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 15 },
          2: { cellWidth: 25 },
          3: { cellWidth: 15 },
          4: { cellWidth: 15 },
          5: { cellWidth: 15 },
          6: { cellWidth: 15 },
          7: { cellWidth: 30 },
          8: { cellWidth: 12 }
        },
        margin: { top: 40 },
        styles: { overflow: 'linebreak' },
        didDrawPage: (data) => {
          // Footer
          doc.setFontSize(8);
          doc.text(
            `Page ${data.pageNumber} of ${doc.internal.getNumberOfPages()}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
          );
        }
      });
      
      // Summary section
      const finalY = doc.lastAutoTable.finalY + 10;
      if (finalY < 200) {
        doc.setFontSize(12);
        doc.text('Summary', 14, finalY);
        
        doc.setFontSize(9);
        const summaryY = finalY + 10;
        const present = filteredAttendance.filter(a => !a.is_absent && a.check_in).length;
        const absent = filteredAttendance.filter(a => a.is_absent).length;
        const manual = filteredAttendance.filter(a => a.manual_entry).length;
        const auto = filteredAttendance.filter(a => !a.manual_entry).length;
        
        doc.text(`Present: ${present}`, 14, summaryY);
        doc.text(`Absent: ${absent}`, 60, summaryY);
        doc.text(`Manual Entries: ${manual}`, 106, summaryY);
        doc.text(`Auto Entries: ${auto}`, 172, summaryY);
      }
      
      const filename = `attendance-report-${filters.date || 'all'}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      
      console.log(`PDF exported: ${filteredAttendance.length} records`);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Error exporting PDF: ' + err.message);
    }
  };

  // ✅ Export Summary Report (Combined)
  const handleExportSummary = () => {
    try {
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(20);
      doc.text('Attendance Summary Report', 105, 20, null, null, 'center');
      
      doc.setFontSize(12);
      doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 105, 30, null, null, 'center');
      
      // Overall Statistics
      doc.setFontSize(14);
      doc.text('Overall Statistics', 20, 50);
      
      doc.setFontSize(10);
      const stats = getStats();
      const summary = [
        `Total Records: ${stats.totalRecords}`,
        `Today's Records: ${stats.todayRecords}`,
        `Present Today: ${stats.presentToday}`,
        `Absent Today: ${stats.absentToday}`,
        `Filtered Results: ${stats.filteredRecords}`
      ];
      
      summary.forEach((item, index) => {
        doc.text(item, 25, 65 + (index * 7));
      });
      
      // Filtered Data Summary
      const filteredStats = {
        present: filteredAttendance.filter(a => !a.is_absent && a.check_in).length,
        absent: filteredAttendance.filter(a => a.is_absent).length,
        checkedIn: filteredAttendance.filter(a => a.check_in && !a.check_out).length,
        manual: filteredAttendance.filter(a => a.manual_entry).length,
        auto: filteredAttendance.filter(a => !a.manual_entry).length
      };
      
      doc.setFontSize(14);
      doc.text('Filtered Data Summary', 20, 110);
      doc.setFontSize(10);
      
      const filteredSummary = [
        `Present: ${filteredStats.present}`,
        `Absent: ${filteredStats.absent}`,
        `Checked In (No Check-out): ${filteredStats.checkedIn}`,
        `Manual Entries: ${filteredStats.manual}`,
        `Auto Entries: ${filteredStats.auto}`
      ];
      
      filteredSummary.forEach((item, index) => {
        doc.text(item, 25, 125 + (index * 7));
      });
      
      // Active Filters
      doc.setFontSize(14);
      doc.text('Active Filters', 20, 170);
      doc.setFontSize(10);
      
      const activeFilters = [];
      if (filters.date) activeFilters.push(`Date: ${filters.date}`);
      if (filters.name) activeFilters.push(`Name: ${filters.name}`);
      if (filters.employeeId) activeFilters.push(`Employee ID: ${filters.employeeId}`);
      if (filters.status) activeFilters.push(`Status: ${filters.status}`);
      if (activeFilters.length === 0) activeFilters.push('No filters applied');
      
      activeFilters.forEach((item, index) => {
        doc.text(item, 25, 185 + (index * 7));
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
    const todayRecords = attendance.filter(a => a.date === today);
    
    return {
      totalRecords: attendance.length,
      todayRecords: todayRecords.length,
      presentToday: todayRecords.filter(a => !a.is_absent && a.check_in).length,
      absentToday: todayRecords.filter(a => a.is_absent).length,
      filteredRecords: filteredAttendance.length
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
          <button onClick={handleExportPDF} className="export-btn pdf" title="Export as PDF">
            📑 Export PDF
          </button>
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
        </div>
        <div className="stat-card">
          <h3>Present Today</h3>
          <p className="stat-value present">{stats.presentToday}</p>
        </div>
        <div className="stat-card">
          <h3>Absent Today</h3>
          <p className="stat-value absent">{stats.absentToday}</p>
        </div>
        <div className="stat-card">
          <h3>Filtered Results</h3>
          <p className="stat-value filtered">{stats.filteredRecords}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <h2>Filter Records</h2>
        <div className="filters-grid">
          <div className="filter-group">
            <label>Date</label>
            <input
              type="date"
              name="date"
              value={filters.date}
              onChange={handleFilterChange}
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
          <div className="filter-actions">
            <button onClick={clearFilters} className="clear-btn">
              Clear Filters
            </button>
          </div>
        </div>
      </div>

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
                    <td colSpan="9" className="no-data">
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

      {/* Summary */}
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
            <h3>Date Range</h3>
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
          </div>
        </div>
      </div>

      {/* Debug Info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-info">
          <small>
            Data Status: {filteredAttendance.length} filtered records, {attendance.length} total records
          </small>
        </div>
      )}
    </div>
  );
}