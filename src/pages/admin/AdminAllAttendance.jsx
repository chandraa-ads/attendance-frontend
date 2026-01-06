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
    designation: '',
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
  // Add these helper functions before the return statement:


const handleExportUserSummaryPDF = () => {
  try {
    if (filteredAttendance.length === 0) {
      alert('No data to export!');
      return;
    }

    const perUserSummary = calculatePerUserSummary();
    const overallStats = calculateOverallStats();

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Title
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text('ATTENDANCE DETAILED REPORT', 145, 20, null, null, 'center');

    // Subtitle
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 145, 28, null, null, 'center');

    // Filter info
    let dateRange = '';
    if (filters.date) {
      dateRange = `Date: ${filters.date}`;
    } else if (filters.startDate && filters.endDate) {
      dateRange = `Date Range: ${filters.startDate} to ${filters.endDate}`;
    } else {
      dateRange = 'All Dates';
    }
    doc.text(dateRange, 145, 35, null, null, 'center');

    // ==================== ATTENDANCE DETAILED TABLE ====================
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('ATTENDANCE RECORDS', 20, 50);

    // Table headers for detailed records
    const headers = [
      'Date', 'Emp ID', 'Name', 'Designation', 
      'Check In', 'Check Out', 'Total Time', 'Status', 'Absence Reason', 'Type'
    ];
    
    const colWidths = [18, 25, 35, 30, 20, 20, 20, 20, 35, 15];

    let y = 60;

    // Draw header
    doc.setFillColor(52, 152, 219);
    doc.rect(20, y, colWidths.reduce((a, b) => a + b), 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);

    let xPos = 20;
    headers.forEach((header, i) => {
      doc.text(header, xPos + 2, y + 5);
      xPos += colWidths[i];
    });

    y += 10;

    // Draw attendance data
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(7);

    filteredAttendance.forEach((record, index) => {
      // Check for page break
      if (y > doc.internal.pageSize.height - 20) {
        doc.addPage();
        y = 20;

        // Redraw header on new page
        doc.setFillColor(52, 152, 219);
        doc.rect(20, y, colWidths.reduce((a, b) => a + b), 8, 'F');
        doc.setTextColor(255, 255, 255);

        xPos = 20;
        headers.forEach((header, i) => {
          doc.text(header, xPos + 2, y + 5);
          xPos += colWidths[i];
        });

        y += 10;
        doc.setTextColor(40, 40, 40);
      }

      // Alternate row colors
      if (index % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(20, y, colWidths.reduce((a, b) => a + b), 7, 'F');
      }

      // Get status
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

      const recordData = [
        record.date || '-',
        record.user_info?.employee_id || '-',
        record.user_info?.name?.substring(0, 15) || '-',
        record.user_info?.designation?.substring(0, 12) || '-',
        formatTime(record.check_in),
        formatTime(record.check_out),
        record.total_time_formatted?.substring(0, 8) || '-',
        getStatus(record),
        record.absence_reason?.substring(0, 20) || '-',
        record.manual_entry ? 'Manual' : 'Auto'
      ];

      xPos = 20;
      recordData.forEach((cell, i) => {
        // Color code status
        if (i === 7) {
          const status = cell.toLowerCase();
          if (status.includes('absent')) {
            doc.setTextColor(211, 47, 47); // Red
          } else if (status.includes('present') || status.includes('checked out')) {
            doc.setTextColor(46, 125, 50); // Green
          } else if (status.includes('checked in')) {
            doc.setTextColor(245, 124, 0); // Orange
          } else {
            doc.setTextColor(100, 100, 100); // Gray
          }
        } else {
          doc.setTextColor(40, 40, 40);
        }

        doc.text(cell.toString(), xPos + 2, y + 5);
        xPos += colWidths[i];
      });

      y += 7;
    });

    // ==================== EMPLOYEE SUMMARY (Optional - Add as separate page) ====================
    if (perUserSummary.length > 0) {
      doc.addPage();
      
      // Employee Summary Title
      doc.setFontSize(16);
      doc.setTextColor(40, 40, 40);
      doc.text('EMPLOYEE SUMMARY STATISTICS', 105, 20, null, null, 'center');
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Total Employees: ${perUserSummary.length}`, 105, 28, null, null, 'center');
      
      // Summary Table
      const summaryHeaders = ['Employee Name', 'Emp ID', 'Present', 'Absent', 'Half Days', 'Permission', 'Attendance %'];
      const summaryColWidths = [45, 25, 15, 15, 25, 20, 25];
      
      let summaryY = 40;
      
      // Draw summary header
      doc.setFillColor(41, 128, 185);
      doc.rect(20, summaryY, summaryColWidths.reduce((a, b) => a + b), 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      
      xPos = 20;
      summaryHeaders.forEach((header, i) => {
        doc.text(header, xPos + 2, summaryY + 5);
        xPos += summaryColWidths[i];
      });
      
      summaryY += 10;
      doc.setTextColor(40, 40, 40);
      doc.setFontSize(7);
      
      perUserSummary.forEach((user, index) => {
        if (summaryY > doc.internal.pageSize.height - 20) {
          doc.addPage();
          summaryY = 20;
          
          // Redraw header
          doc.setFillColor(41, 128, 185);
          doc.rect(20, summaryY, summaryColWidths.reduce((a, b) => a + b), 8, 'F');
          doc.setTextColor(255, 255, 255);
          
          xPos = 20;
          summaryHeaders.forEach((header, i) => {
            doc.text(header, xPos + 2, summaryY + 5);
            xPos += summaryColWidths[i];
          });
          
          summaryY += 10;
          doc.setTextColor(40, 40, 40);
        }
        
        // Alternate row colors
        if (index % 2 === 0) {
          doc.setFillColor(245, 245, 245);
          doc.rect(20, summaryY, summaryColWidths.reduce((a, b) => a + b), 7, 'F');
        }
        
        // Format half days
        const halfDaysText = user.halfDays > 0 ?
          `${user.halfDays} (${user.halfDayFN}FN/${user.halfDayAN}AN)` :
          '0';
        
        const userData = [
          user.name.length > 15 ? user.name.substring(0, 14) + '...' : user.name,
          user.employeeId,
          user.present.toString(),
          user.absent.toString(),
          halfDaysText,
          user.permission.toString(),
          user.attendanceRate === 'N/A' ? 'N/A' : `${user.attendanceRate}%`
        ];
        
        xPos = 20;
        userData.forEach((cell, i) => {
          // Color code attendance percentage
          if (i === 6 && user.attendanceRate !== 'N/A') {
            const rate = parseFloat(user.attendanceRate);
            if (rate >= 90) {
              doc.setTextColor(46, 125, 50);
            } else if (rate >= 70) {
              doc.setTextColor(245, 124, 0);
            } else {
              doc.setTextColor(211, 47, 47);
            }
          } else if (i === 6 && user.attendanceRate === 'N/A') {
            doc.setTextColor(100, 100, 100);
          } else {
            doc.setTextColor(40, 40, 40);
          }
          
          doc.text(cell.toString(), xPos + 2, summaryY + 5);
          xPos += summaryColWidths[i];
        });
        
        summaryY += 7;
      });
      
      // Overall Statistics
      summaryY += 10;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text('Overall Statistics:', 20, summaryY);
      
      summaryY += 7;
      doc.setFontSize(8);
      
      const statsLines = [
        `• Total Employees: ${perUserSummary.length}`,
        `• Total Present Days: ${overallStats.totalPresent}`,
        `• Total Absent Days: ${overallStats.totalAbsent}`,
        `• Total Half Days: ${overallStats.totalHalfDays} (FN: ${overallStats.halfDayFN}, AN: ${overallStats.halfDayAN})`,
        `• Total Permission Days: ${overallStats.totalPermission}`,
        `• Average Attendance Rate: ${overallStats.averageAttendanceRate}`,
        `• Date Range: ${filters.startDate && filters.endDate ? 
          `${filters.startDate} to ${filters.endDate}` : filters.date || 'All dates'}`
      ];
      
      statsLines.forEach((line, idx) => {
        doc.text(line, 25, summaryY + (idx * 4));
      });
    }

    // Footer
    const totalY = doc.internal.pageSize.height - 10;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Page ${doc.internal.getNumberOfPages()} | Generated on: ${new Date().toLocaleDateString()}`, 145, totalY, null, null, 'center');

    // Save PDF
    const filename = `attendance-detailed-report-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);

  } catch (err) {
    console.error('Detailed PDF error:', err);
    alert('Error generating detailed PDF: ' + err.message);
  }
};
  // Calculate per-user statistics
// Calculate per-user statistics - FIXED VERSION
const calculatePerUserSummary = () => {
  const userMap = {};

  // Group data by user
  filteredAttendance.forEach(record => {
    const userId = record.user_id;
    const userName = record.user_info?.name || 'Unknown';
    const employeeId = record.user_info?.employee_id || 'N/A';

    if (!userMap[userId]) {
      userMap[userId] = {
        name: userName,
        employeeId: employeeId,
        department: record.user_info?.designation || 'N/A',
        present: 0,
        absent: 0,
        halfDays: 0,
        halfDayFN: 0,
        halfDayAN: 0,
        permission: 0,
        totalDaysWithRecords: 0,
        totalWorkMinutes: 0,
        uniqueDates: new Set()
      };
    }

    const user = userMap[userId];

    // Add date to unique dates set
    if (record.date) {
      user.uniqueDates.add(record.date);
    }

    user.totalDaysWithRecords++;

    // Check status
    if (record.is_absent) {
      user.absent++;
    } else if (record.half_day_type) {
      user.halfDays++;
      if (record.half_day_type.includes('morning') || record.half_day_type.includes('FN') ||
        record.half_day_type.includes('forenoon')) {
        user.halfDayFN++;
      } else if (record.half_day_type.includes('afternoon') || record.half_day_type.includes('AN')) {
        user.halfDayAN++;
      }
    } else if (record.permission_time) {
      user.permission++;
    } else if (record.check_in && record.check_out) {
      user.present++;
      if (record.total_time_minutes) {
        user.totalWorkMinutes += record.total_time_minutes;
      }
    }
  });

  // Convert to array and calculate statistics
  return Object.values(userMap).map(user => {
    // FIX 1: Correct attendance percentage calculation
    // Only count present, absent, half-days, and permission as working days
    const totalWorkingDays = user.present + user.absent + user.halfDays + user.permission;
    
    // If no working days at all, show N/A
    if (totalWorkingDays === 0) {
      return {
        ...user,
        attendanceRate: 'N/A',
        totalWorkingDays: 0,
        uniqueDateCount: user.uniqueDates.size
      };
    }

    // Calculate percentage based on actual working days
    const attendanceRate = ((user.present + (user.halfDays * 0.5) + (user.permission * 0.75)) / totalWorkingDays * 100).toFixed(1);
    
    return {
      ...user,
      attendanceRate,
      totalWorkingDays,
      uniqueDateCount: user.uniqueDates.size
    };
  }).sort((a, b) => {
    // Sort with N/A at the bottom
    if (a.attendanceRate === 'N/A') return 1;
    if (b.attendanceRate === 'N/A') return -1;
    return parseFloat(b.attendanceRate) - parseFloat(a.attendanceRate);
  });
};
  // Calculate overall statistics
  const calculateOverallStats = () => {
    const perUserSummary = calculatePerUserSummary();

    const totalPresent = perUserSummary.reduce((sum, user) => sum + user.present, 0);
    const totalAbsent = perUserSummary.reduce((sum, user) => sum + user.absent, 0);
    const totalHalfDays = perUserSummary.reduce((sum, user) => sum + user.halfDays, 0);
    const halfDayFN = perUserSummary.reduce((sum, user) => sum + user.halfDayFN, 0);
    const halfDayAN = perUserSummary.reduce((sum, user) => sum + user.halfDayAN, 0);
    const totalPermission = perUserSummary.reduce((sum, user) => sum + user.permission, 0);
    const totalDaysWithRecords = perUserSummary.reduce((sum, user) => sum + user.totalDays, 0);
    const uniqueDatesCount = new Set(
      filteredAttendance.map(record => record.date)
    ).size;

    return {
      totalPresent,
      totalAbsent,
      totalHalfDays,
      halfDayFN,
      halfDayAN,
      totalPermission,
      totalDaysWithRecords,
      uniqueDatesCount,
      averageAttendanceRate: perUserSummary.length > 0
        ? (perUserSummary.reduce((sum, user) => sum + parseFloat(user.attendanceRate), 0) / perUserSummary.length).toFixed(1) + '%'
        : '0%'
    };
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
  // Backend PDF generator (IMPROVED)
  const generateBackendPDF = async () => {
    try {
      setGeneratingPDF(true);
      const token = getToken();

      if (!token) {
        alert('Authentication required. Please login again.');
        setGeneratingPDF(false);
        return;
      }

      // ✅ Update the payload in generateBackendPDF function
      const payload = {
        reportType: 'detailed',
        startDate: filters.startDate || '',
        endDate: filters.endDate || '',
        // Add these for proper date range filtering
        ...(filters.date && { day: filters.date }),
        ...(filters.employeeId?.trim() && { employeeId: filters.employeeId }),
        ...(filters.designation?.trim() && { designation: filters.designation }),
        ...(filters.name?.trim() && { name: filters.name }),
        ...(filters.status?.trim() && { status: filters.status }),
        // Ensure we get user statistics
        includeSummary: true,
        groupByDepartment: false,
        includeCharts: false
      };

      // Remove the default date if specific filters are set
      if (filters.date) {
        delete payload.startDate;
        delete payload.endDate;
      }

      if (!payload.startDate && !payload.endDate && !payload.day) {
        // Default to last 30 days if no date specified
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        payload.startDate = startDate.toISOString().split('T')[0];
        payload.endDate = endDate.toISOString().split('T')[0];
      }

      console.log('📄 Backend PDF Payload:', payload);
      // Test the endpoint first with a simple GET request
      try {
        const testResponse = await fetch('https://attendance-backend-d4vi.onrender.com/attendance/test', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!testResponse.ok) {
          console.warn('Test endpoint failed, but continuing...');
        }
      } catch (testErr) {
        console.warn('Test request failed:', testErr);
      }

      // Show user we're starting
      const userConfirmed = window.confirm(
        'Generate detailed PDF report via backend? This may take a few moments.'
      );

      if (!userConfirmed) {
        setGeneratingPDF(false);
        return;
      }

      const response = await fetch(
        'https://attendance-backend-d4vi.onrender.com/attendance/generate-pdf',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      console.log('Response status:', response.status, response.statusText);

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status} ${response.statusText}`;

        try {
          const errorData = await response.json();
          console.error('Error details:', errorData);
          errorMessage = errorData.message || errorMessage;

          // Check for specific backend errors
          if (errorData.message?.includes('No attendance data found')) {
            alert('No data found for the selected filters. Try different dates or filters.');
            setGeneratingPDF(false);
            return;
          }
        } catch (parseError) {
          // If not JSON, try text
          try {
            const errorText = await response.text();
            console.error('Error text:', errorText);
            errorMessage = errorText || errorMessage;
          } catch (textError) {
            console.error('Could not read error response:', textError);
          }
        }

        throw new Error(errorMessage);
      }

      // Check content type
      const contentType = response.headers.get('content-type');
      console.log('Content-Type:', contentType);

      if (!contentType || !contentType.includes('application/pdf')) {
        console.warn('Response is not PDF. Headers:', Object.fromEntries(response.headers.entries()));

        // Try to read as text to see what we got
        const responseText = await response.text();
        console.log('Response text (first 500 chars):', responseText.substring(0, 500));

        throw new Error('Server did not return a PDF file');
      }

      // Get the blob
      const blob = await response.blob();
      console.log('Blob size:', blob.size, 'type:', blob.type);

      if (blob.size === 0) {
        throw new Error('Received empty PDF file');
      }

      // Create filename
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `attendance-report-${payload.startDate || payload.day || 'all'}-to-${payload.endDate || payload.day || 'all'}.pdf`;

      if (contentDisposition) {
        // Try to extract filename
        const matches = contentDisposition.match(/filename="?([^"]+)"?/i);
        if (matches && matches[1]) {
          filename = matches[1];
        }
      }

      // Download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        a.remove();
      }, 100);

      alert(`✅ PDF downloaded: ${filename}`);

    } catch (error) {
      console.error('❌ Backend PDF error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });

      // Offer fallback options
      const fallbackChoice = confirm(
        `Backend PDF failed: ${error.message}\n\n` +
        'Choose an alternative:\n' +
        '• OK = Try browser PDF (simpler format)\n' +
        '• Cancel = Export CSV instead'
      );

      if (fallbackChoice) {
        // Try client-side PDF
        const clientSuccess = handleClientSidePDF();
        if (!clientSuccess) {
          // If client PDF also fails, offer CSV
          if (confirm('Browser PDF also failed. Export as CSV instead?')) {
            handleExportCSV();
          }
        }
      } else {
        // Export CSV
        handleExportCSV();
      }
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

    // Client-side PDF fallback
    handleClientSidePDF();
  };

  // Simplified PDF with per-user summary
  const handleClientSidePDF = () => {
    try {
      if (filteredAttendance.length === 0) {
        alert('No data to export!');
        return false;
      }

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Title
      doc.setFontSize(18);
      doc.setTextColor(40, 40, 40);
      doc.text('EMPLOYEE ATTENDANCE SUMMARY REPORT', 105, 20, null, null, 'center');

      // Date info
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 28, null, null, 'center');

      // Filter info
      let filterInfo = '';
      if (filters.date) filterInfo += `Date: ${filters.date} | `;
      if (filters.startDate && filters.endDate) {
        filterInfo += `Range: ${filters.startDate} to ${filters.endDate} | `;
      }

      if (filterInfo) {
        filterInfo = filterInfo.slice(0, -3);
        doc.setFontSize(9);
        doc.text(filterInfo, 105, 35, null, null, 'center');
      }

      // ==================== PER-USER SUMMARY TABLE ====================
      const perUserSummary = calculatePerUserSummary();
      const overallStats = calculateOverallStats();

      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'bold');
      doc.text('EMPLOYEE-WISE ATTENDANCE SUMMARY', 20, 50);

      // Table headers
      const headers = ['Employee Name', 'Emp ID', 'Present', 'Absent', 'Half Days', 'Permission', 'Attendance %'];
      const colWidths = [50, 25, 15, 15, 25, 20, 25];

      let y = 60;

      // Draw header
      doc.setFillColor(52, 152, 219);
      doc.rect(20, y, colWidths.reduce((a, b) => a + b), 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);

      let xPos = 20;
      headers.forEach((header, i) => {
        doc.text(header, xPos + 2, y + 5);
        xPos += colWidths[i];
      });

      y += 10;

      // Draw user data
      doc.setTextColor(40, 40, 40);
      doc.setFontSize(8);

      perUserSummary.forEach((user, index) => {
        // Check for page break
        if (y > doc.internal.pageSize.height - 20) {
          doc.addPage();
          y = 20;

          // Redraw header on new page
          doc.setFillColor(52, 152, 219);
          doc.rect(20, y, colWidths.reduce((a, b) => a + b), 8, 'F');
          doc.setTextColor(255, 255, 255);

          xPos = 20;
          headers.forEach((header, i) => {
            doc.text(header, xPos + 2, y + 5);
            xPos += colWidths[i];
          });

          y += 10;
          doc.setTextColor(40, 40, 40);
        }

        // Alternate row colors
        if (index % 2 === 0) {
          doc.setFillColor(245, 245, 245);
          doc.rect(20, y, colWidths.reduce((a, b) => a + b), 8, 'F');
        }

        // Format half days as "FN/AN"
        const halfDaysText = user.halfDays > 0 ?
          `${user.halfDays} (${user.halfDayFN}FN/${user.halfDayAN}AN)` :
          user.halfDays.toString();

        const userData = [
          user.name.length > 15 ? user.name.substring(0, 14) + '...' : user.name,
          user.employeeId,
          user.present.toString(),
          user.absent.toString(),
          halfDaysText,
          user.permission.toString(),
          `${user.attendanceRate}%`
        ];

        xPos = 20;
        userData.forEach((cell, i) => {
          // Color code attendance percentage
          if (i === 6) {
            const rate = parseFloat(user.attendanceRate);
            if (rate >= 90) {
              doc.setTextColor(46, 125, 50); // Green
            } else if (rate >= 70) {
              doc.setTextColor(245, 124, 0); // Orange
            } else {
              doc.setTextColor(211, 47, 47); // Red
            }
          } else {
            doc.setTextColor(40, 40, 40);
          }

          doc.text(cell.toString(), xPos + 2, y + 5);
          xPos += colWidths[i];
        });

        y += 8;
      });

      // ==================== OVERALL SUMMARY ====================
      y += 10;
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'bold');
      doc.text('OVERALL SUMMARY STATISTICS', 20, y);

      y += 10;
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');

      const summaryLines = [
        `• Total Employees: ${perUserSummary.length}`,
        `• Date Range: ${filters.startDate && filters.endDate ? `${filters.startDate} to ${filters.endDate}` : filters.date || 'All dates'}`,
        `• Total Present Days: ${overallStats.totalPresent}`,
        `• Total Absent Days: ${overallStats.totalAbsent}`,
        `• Total Half Days: ${overallStats.totalHalfDays} (FN: ${overallStats.halfDayFN}, AN: ${overallStats.halfDayAN})`,
        `• Total Permission Days: ${overallStats.totalPermission}`,
        `• Total Records Analyzed: ${filteredAttendance.length}`
      ];

      summaryLines.forEach((line, index) => {
        doc.text(line, 25, y + (index * 6));
      });

      // Save the PDF
      const filename = `employee-attendance-summary-${filters.date || 'all'}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);

      return true;

    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Error generating PDF: ' + err.message);
      return false;
    }
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
      designation: '',
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
        ['Date', 'Employee ID', 'Name', 'Email', 'designation', 'Designation',
          'Check In (IST)', 'Check Out (IST)', 'Total Time', 'Status',
          'Absence Reason', 'Manual Entry', 'Record Date'],
        ...filteredAttendance.map(record => [
          record.date,
          `"${record.user_info?.employee_id || '-'}"`,
          `"${record.user_info?.name || '-'}"`,
          `"${record.user_info?.email || '-'}"`,
          `"${record.user_info?.designation || '-'}"`,
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
        'designation': record.user_info?.designation || '-',
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
      if (filters.designation) activeFilters.push(`designation: ${filters.designation}`);
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

      <div className="header-main">
        {/* Add Back Button Here */}
        <div className="header-left">
          <button
            className="btn-back"
            onClick={() => window.history.back()} // Or navigate(-1) if using React Router
            title="Go back to previous page"
          >
            ← Back
          </button>
          <div className="header-title">
            <h1>All Attendance Records</h1>
            <p>View and manage all attendance records</p>
          </div>
        </div>
        <div className="header-actions">
          <button onClick={handleExportCSV} className="export-btn csv" title="Export as CSV">
            📄 Export CSV
          </button>
          <button onClick={handleExportExcel} className="export-btn excel" title="Export as Excel">
            📊 Export Excel
          </button>
          <div className="pdf-export-group">
            <button
              onClick={() => handleExportPDF(true)}
              className="export-btn pdf-backend"
              disabled={generatingPDF || filteredAttendance.length === 0}
              title={filteredAttendance.length === 0 ? 'No data to export' : 'Generate PDF via backend'}
            >
              {generatingPDF ? (
                <>
                  <span className="spinner"></span>
                  Generating PDF...
                </>
              ) : (
                '📊 Export PDF (Backend)'
              )}
            </button>

            {/* Add a client-side PDF button as backup */}
            <button
              onClick={() => handleClientSidePDF()}
              className="export-btn pdf-client"
              disabled={filteredAttendance.length === 0}
              title="Generate PDF using browser (faster, simpler)"
            >
              📄 Quick PDF
            </button>
            <button onClick={handleExportUserSummaryPDF} className="export-btn summary-pdf" title="Export Employee Summary PDF">
              👥 Employee Summary PDF
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
            <label>Mobile Number</label>
            <input
              type="text"
              name="mobileNumber"
              value={filters.mobileNumber}
              onChange={handleFilterChange}
              placeholder="Search by mobile number"
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
      {
        selectedDates.length > 0 && (
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
        )
      }

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
                  <th>designation</th>
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
                      <td>{record.user_info?.designation || '-'}</td>
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

     {/* Per-User Summary Section - Updated */}
<div className="per-user-summary-section">
  <h2>📊 Employee-wise Summary</h2>
  <div className="per-user-summary-table">
    <table className="summary-table">
      <thead>
        <tr>
          <th>Employee Name</th>
          <th>Emp ID</th>
          <th>Present</th>
          <th>Absent</th>
          <th>Half Days</th>
          <th>Permission</th>
          <th>Attendance %</th>
        </tr>
      </thead>
      <tbody>
        {filteredAttendance.length > 0 ? (
          calculatePerUserSummary().slice(0, 10).map((user, index) => (
            <tr key={`${user.employeeId}-${index}`}>
              <td>{user.name}</td>
              <td>{user.employeeId}</td>
              <td className={user.present > 0 ? 'present-cell' : ''}>{user.present}</td>
              <td className={user.absent > 0 ? 'absent-cell' : ''}>{user.absent}</td>
              <td className={user.halfDays > 0 ? 'halfday-cell' : ''}>
                {/* FIX 2: Show simple "0" instead of "0 (0FN/0AN)" for no half days */}
                {user.halfDays > 0 ? `${user.halfDays} (${user.halfDayFN}FN/${user.halfDayAN}AN)` : '0'}
              </td>
              <td className={user.permission > 0 ? 'permission-cell' : ''}>{user.permission}</td>
              <td className={`attendance-cell ${user.attendanceRate === 'N/A' ? 'na' : user.attendanceRate >= 90 ? 'excellent' : user.attendanceRate >= 70 ? 'good' : 'poor'}`}>
                {user.attendanceRate === 'N/A' ? 'N/A' : `${user.attendanceRate}%`}
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="7" className="no-data">
              No data available
            </td>
          </tr>
        )}
        {calculatePerUserSummary().length > 10 && (
          <tr>
            <td colSpan="7" className="more-users">
              ... and {calculatePerUserSummary().length - 10} more employees
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
</div>

      {/* PDF Generation Status */}
      {
        generatingPDF && (
          <div className="pdf-generation-status">
            <p>⏳ Generating PDF via backend... This may take a moment.</p>
            <div className="loading-spinner"></div>
          </div>
        )
      }

      {/* Debug Info */}
      {
        process.env.NODE_ENV === 'development' && (
          <div className="debug-info">
            <small>
              Data Status: {filteredAttendance.length} filtered records, {attendance.length} total records
              <br />
              Selected Dates: {selectedDates.length}
              <br />
              PDF Backend: {generatingPDF ? 'Processing...' : 'Ready'}
            </small>
          </div>
        )
      }
    </div >
  );
}