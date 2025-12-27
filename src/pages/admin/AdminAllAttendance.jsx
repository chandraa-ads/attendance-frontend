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

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const token = getToken();

      const res = await fetch('https://attendance-backend-d4vi.onrender.comattendance/all', {
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

      const url = `https://attendance-backend-d4vi.onrender.comattendance/filter?startDate=${startDate}&endDate=${endDate}`;
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

      // ✅ Build minimal payload first
      const payload = {
        reportType: 'detailed',
        startDate: filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: filters.endDate || new Date().toISOString().split('T')[0]
      };

      // Only add filters if they have values
      if (filters.date) {
        payload.day = filters.date;
        delete payload.startDate;
        delete payload.endDate;
      }

      if (filters.employeeId?.trim()) payload.employeeId = filters.employeeId;
      if (filters.designation?.trim()) payload.designation = filters.designation;

      console.log('📄 Backend PDF Payload (simplified):', payload);

      // Test the endpoint first with a simple GET request
      try {
        const testResponse = await fetch('https://attendance-backend-d4vi.onrender.comattendance/test', {
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
        'https://attendance-backend-d4vi.onrender.comattendance/generate-pdf',
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

  // Add this new function for client-side PDF
  // Simple client-side PDF without autoTable plugin
  const handleClientSidePDF = () => {
    try {
      if (filteredAttendance.length === 0) {
        alert('No data to export!');
        return;
      }

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Title
      doc.setFontSize(18);
      doc.setTextColor(40, 40, 40);
      doc.text('ATTENDANCE REPORT', 105, 20, null, null, 'center');

      // Subtitle
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 28, null, null, 'center');

      // Filter info
      let filterInfo = '';
      if (filters.date) filterInfo += `Date: ${filters.date} | `;
      if (filters.startDate && filters.endDate) {
        filterInfo += `Range: ${filters.startDate} to ${filters.endDate} | `;
      }
      if (filters.name) filterInfo += `Name: ${filters.name} | `;
      if (filters.status) filterInfo += `Status: ${filters.status} | `;

      if (filterInfo) {
        filterInfo = filterInfo.slice(0, -3); // Remove last " | "
        doc.setFontSize(9);
        doc.text(filterInfo, 105, 35, null, null, 'center');
      }

      // Table headers
      const headers = [
        { text: 'Date', x: 10, width: 25 },
        { text: 'Emp ID', x: 35, width: 25 },
        { text: 'Name', x: 60, width: 40 },
        { text: 'Dept', x: 100, width: 30 },
        { text: 'Check In', x: 130, width: 25 },
        { text: 'Check Out', x: 155, width: 25 },
        { text: 'Total Time', x: 180, width: 25 },
        { text: 'Status', x: 205, width: 30 },
        { text: 'Type', x: 235, width: 20 }
      ];

      // Draw header background
      doc.setFillColor(41, 128, 185);
      doc.rect(10, 40, 250, 8, 'F');

      // Draw header text
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      headers.forEach(header => {
        doc.text(header.text, header.x + 2, 45);
      });

      // Draw table rows
      let y = 50;
      const rowHeight = 8;
      const pageHeight = doc.internal.pageSize.height;

      filteredAttendance.forEach((record, index) => {
        // Check for page break
        if (y > pageHeight - 20) {
          doc.addPage();
          y = 20;

          // Redraw headers on new page
          doc.setFillColor(41, 128, 185);
          doc.rect(10, y, 250, 8, 'F');
          doc.setTextColor(255, 255, 255);
          headers.forEach(header => {
            doc.text(header.text, header.x + 2, y + 5);
          });
          y += rowHeight + 2;
        }

        // Alternate row colors
        if (index % 2 === 0) {
          doc.setFillColor(245, 245, 245);
          doc.rect(10, y, 250, rowHeight, 'F');
        }

        // Set text color
        doc.setTextColor(40, 40, 40);
        doc.setFontSize(8);

        // Draw row data
        const rowData = [
          record.date,
          record.user_info?.employee_id || '-',
          record.user_info?.name?.substring(0, 15) + (record.user_info?.name?.length > 15 ? '...' : '') || '-',
          record.user_info?.designation?.substring(0, 10) + (record.user_info?.designation?.length > 10 ? '...' : '') || '-',
          formatTime(record.check_in),
          formatTime(record.check_out),
          record.total_time_formatted || '-',
          getStatus(record),
          record.manual_entry ? 'Manual' : 'Auto'
        ];

        headers.forEach((header, i) => {
          const text = String(rowData[i]);
          // Trim text if too long
          const maxChars = Math.floor(header.width / 1.5);
          const displayText = text.length > maxChars ? text.substring(0, maxChars - 1) + '...' : text;

          doc.text(displayText, header.x + 2, y + 5);
        });

        y += rowHeight;
      });

      // Add summary
      const finalY = y + 10;
      if (finalY < pageHeight - 30) {
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'bold');
        doc.text('SUMMARY', 10, finalY);
        doc.setFont(undefined, 'normal');

        const presentCount = filteredAttendance.filter(a => !a.is_absent && a.check_in).length;
        const absentCount = filteredAttendance.filter(a => a.is_absent).length;
        const halfDayCount = filteredAttendance.filter(a => a.check_in && !a.check_out).length;
        const manualCount = filteredAttendance.filter(a => a.manual_entry).length;
        const autoCount = filteredAttendance.filter(a => !a.manual_entry).length;

        doc.setFontSize(9);
        doc.text(`Total Records: ${filteredAttendance.length}`, 10, finalY + 7);
        doc.text(`Present: ${presentCount}`, 60, finalY + 7);
        doc.text(`Absent: ${absentCount}`, 100, finalY + 7);
        doc.text(`Half Days: ${halfDayCount}`, 140, finalY + 7);
        doc.text(`Manual Entries: ${manualCount}`, 180, finalY + 7);
        doc.text(`Auto Entries: ${autoCount}`, 220, finalY + 7);
      }

      // Save the PDF
      const filename = `attendance-report-${filters.date || 'all'}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);

      console.log(`Client PDF exported: ${filteredAttendance.length} records`);
      return true;

    } catch (err) {
      console.error('Client-side PDF error:', err);

      // Try a simpler approach as fallback
      try {
        // Simple text-based PDF as last resort
        const simpleDoc = new jsPDF();
        simpleDoc.text('Attendance Report', 20, 20);
        simpleDoc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);
        simpleDoc.text(`Total Records: ${filteredAttendance.length}`, 20, 40);

        let y = 50;
        filteredAttendance.slice(0, 30).forEach((record, index) => {
          if (y > 280) return; // Stop if page is full
          simpleDoc.text(
            `${record.date} - ${record.user_info?.name || 'Unknown'} - ${getStatus(record)}`,
            20, y
          );
          y += 7;
        });

        const filename = `simple-attendance-${new Date().toISOString().slice(0, 10)}.pdf`;
        simpleDoc.save(filename);
        alert('Generated a simplified PDF report');
        return true;
      } catch (simpleErr) {
        console.error('Simple PDF also failed:', simpleErr);
        alert('Failed to generate PDF. Please try CSV or Excel export instead.');
        return false;
      }
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