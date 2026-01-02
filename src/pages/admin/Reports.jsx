import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Download, 
  FileText, 
  PieChart, 
  Users, 
  Calendar, 
  Filter, 
  Clock, 
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart2,
  Settings,
  ChevronRight,
  Sparkles,
  FileDown,
  Zap,
  TrendingUp,
  ChevronLeft
} from 'lucide-react';
import '../../assets/styles/Reports.css';
import { useNavigate } from 'react-router-dom'; // Add this import

export default function Reportss() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('detailed');
  const [format, setFormat] = useState('pdf');
    const navigate = useNavigate(); // Add this line

  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [filters, setFilters] = useState({
    employeeId: '',
    department: '',
    includeSummary: true,
    includeCharts: false,
    groupByDepartment: false,
    lateArrivalsOnly: false,
    earlyDeparturesOnly: false
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [quickReportLoading, setQuickReportLoading] = useState(null);
  const [availableDepartments, setAvailableDepartments] = useState([]);

  const API_BASE_URL = 'https://attendance-backend-d4vi.onrender.com';

  // Fetch available departments on component mount
  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const authData = localStorage.getItem('auth');
      if (!authData) return;

      const parsedAuth = JSON.parse(authData);
      const token = parsedAuth.session?.access_token || parsedAuth.access_token || parsedAuth.token;

      if (!token) return;

      // Fetch all users to extract departments
      const response = await fetch(`${API_BASE_URL}/auth/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (response.ok) {
        const users = await response.json();
        const departments = [...new Set(users.map(user => user.department).filter(Boolean))];
        setAvailableDepartments(departments);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Helper function to show notifications
  const showNotification = (type, message) => {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        ${type === 'success' ? '✅' : '❌'}
        <span>${message}</span>
      </div>
    `;
    
    const container = document.querySelector('.notifications-container') || createNotificationContainer();
    container.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 5000);
  };

  const createNotificationContainer = () => {
    const container = document.createElement('div');
    container.className = 'notifications-container';
    document.body.appendChild(container);
    return container;
  };

  // Test API connection before generating report
  const testAPIConnection = async (token) => {
    try {
      const testResponse = await fetch(`${API_BASE_URL}/attendance/all?date=${dateRange.startDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (testResponse.ok) {
        const testData = await testResponse.json();
        console.log('Test API response:', testData);
        return testData.length > 0;
      }
      return false;
    } catch (error) {
      console.error('API test failed:', error);
      return false;
    }
  };

  // Generate filtered report
  const generateFilteredReport = async (reportData) => {
    const { dateRange, reportType, format, filters, reportName } = reportData;
    
    setLoading(true);
    setQuickReportLoading(reportName);
    
    try {
      const authData = localStorage.getItem('auth');
      if (!authData) throw new Error('No authentication data found');

      const parsedAuth = JSON.parse(authData);
      const token = parsedAuth.session?.access_token || parsedAuth.access_token || parsedAuth.token;

      if (!token) {
        throw new Error('No authentication token found');
      }

      // Validate date range
      if (dateRange.startDate && dateRange.endDate) {
        const start = new Date(dateRange.startDate);
        const end = new Date(dateRange.endDate);
        if (start > end) {
          showNotification('error', 'Start date cannot be after end date');
          return;
        }
      }

      console.log('Generating report with:', { dateRange, reportType, format, filters });

      // Test if there's data for the selected date range
      const hasData = await testAPIConnection(token);
      if (!hasData) {
        showNotification('warning', `No attendance data found for ${dateRange.startDate}. Trying with different date...`);
        // Try with current date instead
        const today = new Date().toISOString().split('T')[0];
        if (dateRange.startDate !== today) {
          dateRange.startDate = today;
          dateRange.endDate = today;
          showNotification('info', `Generating report for today (${today}) instead.`);
        }
      }

      let endpoint, response, filename;
      const today = new Date().toISOString().slice(0, 10);
      const start = dateRange.startDate ? dateRange.startDate.replace(/-/g, '') : 'all';
      const end = dateRange.endDate ? dateRange.endDate.replace(/-/g, '') : 'all';

      if (format === 'pdf') {
        // Generate PDF report with exact filters
        endpoint = '/attendance/generate-pdf';
        filename = `attendance_${reportName.toLowerCase().replace(/\s+/g, '_')}_${start}_to_${end}_${today}.pdf`;
        
        const pdfData = {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          reportType: reportType,
          employeeId: filters.employeeId || undefined,
          department: filters.department || undefined,
        };

        // Remove undefined values
        Object.keys(pdfData).forEach(key => {
          if (pdfData[key] === undefined) {
            delete pdfData[key];
          }
        });

        console.log('Generating PDF with data:', pdfData);

        response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(pdfData)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('PDF generation failed:', { status: response.status, statusText: response.statusText, errorText });
          
          // If PDF fails, try to get CSV data instead
          showNotification('warning', 'PDF generation failed, trying to get data as CSV...');
          return await generateCSVReport(dateRange, filters, reportName, token);
        }

        const blob = await response.blob();
        if (blob.size === 0) {
          showNotification('warning', 'Generated PDF is empty, trying CSV format...');
          return await generateCSVReport(dateRange, filters, reportName, token);
        }
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showNotification('success', `${reportName} generated: ${filename}`);

      } else if (format === 'excel' || format === 'csv') {
        await generateCSVReport(dateRange, filters, reportName, token, format);
      }

    } catch (error) {
      console.error('Error generating report:', error);
      showNotification('error', `Failed to generate ${reportName}: ${error.message}`);
    } finally {
      setLoading(false);
      setQuickReportLoading(null);
    }
  };

  // Generate CSV/Excel report (fallback for when PDF fails)
  const generateCSVReport = async (dateRange, filters, reportName, token, format = 'csv') => {
    try {
      const endpoint = '/attendance/filter';
      
      // Build query parameters with exact filters
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);
      if (filters.employeeId) params.append('employeeId', filters.employeeId);
      if (filters.department) params.append('department', filters.department);
      
      // For absent report, add status filter
      if (reportName === 'Absent Report') {
        params.append('status', 'absent');
      }

      console.log('Fetching CSV data with params:', params.toString());

      const response = await fetch(`${API_BASE_URL}${endpoint}?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch data: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data || data.length === 0) {
        // Try to get data from /attendance/all endpoint as fallback
        const fallbackResponse = await fetch(`${API_BASE_URL}/attendance/all?date=${dateRange.startDate || new Date().toISOString().split('T')[0]}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          if (fallbackData && fallbackData.length > 0) {
            console.log('Got data from fallback endpoint:', fallbackData.length);
            await processAndDownloadData(fallbackData, dateRange, filters, reportName, format);
            return;
          }
        }
        
        throw new Error('No attendance data found for the selected period');
      }

      await processAndDownloadData(data, dateRange, filters, reportName, format);

    } catch (error) {
      console.error('Error generating CSV report:', error);
      throw error;
    }
  };

  // Process data and download
  const processAndDownloadData = async (data, dateRange, filters, reportName, format) => {
    // Filter data based on report type
    let filteredData = data;
    
    if (reportName === 'Absent Report') {
      filteredData = data.filter(item => item.is_absent);
    }
    
    if (reportName === 'Today\'s Report') {
      // Filter for today's data only
      const today = new Date().toISOString().split('T')[0];
      filteredData = data.filter(item => item.date === today);
    }

    if (filteredData.length === 0) {
      showNotification('info', `No ${reportName.toLowerCase()} data found. Downloading all available data.`);
      filteredData = data; // Fallback to all data
    }

    // Convert to CSV
    const csvContent = convertToCSV(filteredData);
    
    // Create and download file
    const blob = new Blob([csvContent], { 
      type: format === 'excel' ? 'application/vnd.ms-excel' : 'text/csv' 
    });
    const today = new Date().toISOString().slice(0, 10);
    const start = dateRange.startDate ? dateRange.startDate.replace(/-/g, '') : 'all';
    const end = dateRange.endDate ? dateRange.endDate.replace(/-/g, '') : 'all';
    const fileExt = format === 'excel' ? 'xls' : 'csv';
    const filename = `attendance_${reportName.toLowerCase().replace(/\s+/g, '_')}_${start}_to_${end}_${today}.${fileExt}`;
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    showNotification('success', `${reportName} (${format.toUpperCase()}) generated: ${filename}`);
  };

  // Convert data to CSV format
  const convertToCSV = (data) => {
    if (!data || !data.length) return 'Date,Status,Message\n"2025-12-24","No Data","No attendance data found for the selected period"';
    
    // Define CSV headers
    const headers = [
      'Date', 'Employee ID', 'Name', 'Department', 'Designation',
      'Check In', 'Check Out', 'Status', 'Absence Reason', 'Half Day Type',
      'Permission Time', 'Permission Reason', 'Total Hours', 'Notes'
    ];

    // Process each row
    const rows = data.map(item => {
      const userInfo = item.user_info || {};
      const status = item.is_absent ? 'Absent' : 
                    item.half_day_type ? `Half Day (${item.half_day_type})` :
                    item.permission_time ? 'Permission' :
                    item.check_in && !item.check_out ? 'Checked In' :
                    item.check_in && item.check_out ? 'Present' : 'Pending';

      // Format total hours
      const totalHours = item.total_time_minutes 
        ? (item.total_time_minutes / 60).toFixed(2) 
        : '0.00';

      // Escape quotes in text fields
      const escapeQuotes = (text) => {
        if (!text) return '';
        return text.toString().replace(/"/g, '""');
      };

      return [
        item.date,
        `"${escapeQuotes(userInfo.employee_id)}"`,
        `"${escapeQuotes(userInfo.name)}"`,
        `"${escapeQuotes(userInfo.department)}"`,
        `"${escapeQuotes(userInfo.designation)}"`,
        `"${item.check_in_ist || ''}"`,
        `"${item.check_out_ist || ''}"`,
        `"${status}"`,
        `"${escapeQuotes(item.absence_reason)}"`,
        `"${item.half_day_type || ''}"`,
        `"${item.permission_time || ''}"`,
        `"${escapeQuotes(item.permission_reason)}"`,
        totalHours,
        `"${escapeQuotes(item.notes)}"`
      ];
    });

    // Combine headers and rows
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  };

  // Quick Reports function - Now with exact filtering
  const handleQuickReport = async (reportConfig) => {
    const { title } = reportConfig;
    
    // Show loading state for this specific report
    setQuickReportLoading(title);
    
    // Generate report with exact configuration
    await generateFilteredReport({
      ...reportConfig,
      format: 'pdf', // Quick reports default to PDF
      reportName: title
    });
  };

  // Quick Reports configuration - Updated with exact filters
  const quickReports = [
    {
      id: 1,
      title: "Today's Report",
      description: 'Download today\'s attendance',
      icon: <Calendar size={24} />,
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      dateRange: {
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      },
      reportType: 'detailed',
      filters: {
        employeeId: '',
        department: '',
        includeSummary: true
      }
    },
    {
      id: 2,
      title: 'Weekly Summary',
      description: 'Last 7 days overview',
      icon: <BarChart2 size={24} />,
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
      dateRange: {
        startDate: new Date(new Date().setDate(new Date().getDate() - 6)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      },
      reportType: 'summary',
      filters: {
        employeeId: '',
        department: '',
        includeSummary: true,
        includeCharts: true,
        groupByDepartment: true
      }
    },
    {
      id: 3,
      title: 'Monthly Report',
      description: 'Complete monthly analysis',
      icon: <TrendingUp size={24} />,
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      dateRange: {
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      },
      reportType: 'detailed',
      filters: {
        employeeId: '',
        department: '',
        includeSummary: true,
        groupByDepartment: true
      }
    },
    {
      id: 4,
      title: 'Absent Report',
      description: 'Absent employees analysis',
      icon: <XCircle size={24} />,
      color: '#ef4444',
      gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      dateRange: {
        startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      },
      reportType: 'detailed',
      filters: {
        employeeId: '',
        department: '',
        includeSummary: true,
        groupByDepartment: true
      }
    }
  ];

  // Regular generate report function (for custom builder)
  const generateReport = async () => {
    await generateFilteredReport({
      dateRange,
      reportType,
      format,
      filters,
      reportName: 'Custom Report'
    });
  };

  const reportTypes = [
    {
      value: 'detailed',
      label: 'Detailed Report',
      description: 'Complete attendance data with all columns',
      icon: <FileText size={20} />
    },
    {
      value: 'summary',
      label: 'Summary Report',
      description: 'Aggregated statistics and overview',
      icon: <PieChart size={20} />
    }
  ];

  const formatTypes = [
    {
      value: 'pdf',
      label: 'PDF Document',
      description: 'Professional formatted document',
      icon: <FileDown size={20} />
    },
    // {
    //   value: 'excel',
    //   label: 'Excel Spreadsheet',
    //   description: 'Data in spreadsheet format',
    //   icon: <BarChart2 size={20} />
    // },
    // {
    //   value: 'csv',
    //   label: 'CSV Data',
    //   description: 'Raw data for analysis',
    //   icon: <Settings size={20} />
    // }
  ];

  return (
    <div className="reports-container">
      {/* Notification container */}
      <div className="notifications-container"></div>

      {/* Header */}
      <div className="header-left">
  {/* Simple Icon Back Button */}
{/* Header */}
<div className="reports-header">
  <div className="header-left">
    {/* Add Back Button Here */}
    <button 
      className="btn-back"
      onClick={() => navigate(-1)}
      title="Go back"
    >
      <ChevronLeft size={20} />
      <span>Back</span>
    </button>
    
    <div className="header-icon">
      <FileText size={32} />
    </div>
    
    <div className="header-title">
      <h1>Attendance Reports</h1>
      <p className="subtitle">Generate, analyze and download attendance reports</p>
    </div>
  </div>
  <div className="header-right">
    <div className="user-welcome">
      <div className="user-avatar">
        {user?.name?.charAt(0) || 'A'}
      </div>
      <div className="user-info">
        <span className="greeting">Welcome back,</span>
        <span className="username">{user?.name || 'Admin'}</span>
      </div>
    </div>
  </div>
</div>
  
  <div className="header-icon">
    <FileText size={32} />
  </div>
  
  <div className="header-title">
    <h1>Attendance Reports</h1>
    <p className="subtitle">Generate, analyze and download attendance reports</p>
  </div>
</div>

      <div className="reports-content">
        {/* Left Column - Quick Reports */}
        <div className="quick-reports-section">
          <div className="section-header">
            <div className="section-title">
              <Zap size={24} />
              <h2>Quick Reports</h2>
            </div>
            <p className="section-description">Generate reports with one click</p>
          </div>
          
          <div className="quick-reports-grid">
            {quickReports.map((report) => (
              <div 
                key={report.id} 
                className="quick-report-card"
                onClick={() => handleQuickReport(report)}
                style={{ 
                  background: report.gradient,
                  cursor: (loading && quickReportLoading === report.title) ? 'not-allowed' : 'pointer',
                  opacity: (loading && quickReportLoading === report.title) ? 0.7 : 1
                }}
              >
                <div className="quick-report-icon" style={{ color: 'white' }}>
                  {report.icon}
                </div>
                <div className="quick-report-content">
                  <h3 style={{ color: 'white' }}>{report.title}</h3>
                  <p style={{ color: 'rgba(255, 255, 255, 0.9)' }}>{report.description}</p>
                </div>
                <div className="quick-report-arrow">
                  {quickReportLoading === report.title ? (
                    <div className="quick-report-spinner"></div>
                  ) : (
                    <ChevronRight size={20} color="white" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Stats Preview */}
          <div className="stats-preview">
            <div className="stat-item">
              <div className="stat-icon" style={{ background: '#dbeafe' }}>
                <Users size={18} color="#3b82f6" />
              </div>
              <div className="stat-info">
                <span className="stat-label">Quick Reports</span>
                <span className="stat-value">{quickReports.length}</span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon" style={{ background: '#f0f9ff' }}>
                <Clock size={18} color="#0ea5e9" />
              </div>
              <div className="stat-info">
                <span className="stat-label">Default Range</span>
                <span className="stat-value">30 Days</span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon" style={{ background: '#fef3c7' }}>
                <Sparkles size={18} color="#f59e0b" />
              </div>
              <div className="stat-info">
                <span className="stat-label">Formats</span>
                <span className="stat-value">{formatTypes.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Custom Report Builder */}
        <div className="custom-report-section">
          <div className="section-header">
            <div className="section-title">
              <Settings size={24} />
              <h2>Custom Report Builder</h2>
            </div>
            <p className="section-description">Build your own report with advanced filters</p>
          </div>

          <div className="report-builder">
            {/* Report Type Selection */}
            <div className="form-section card">
              <div className="form-header">
                <FileText size={20} />
                <label>Report Type</label>
              </div>
              <div className="radio-group">
                {reportTypes.map((type) => (
                  <label 
                    key={type.value}
                    className={`radio-option ${reportType === type.value ? 'active' : ''}`}
                    onClick={() => setReportType(type.value)}
                  >
                    <div className="radio-content">
                      <div className="radio-icon">{type.icon}</div>
                      <div className="radio-text">
                        <span className="radio-label">{type.label}</span>
                        <span className="radio-description">{type.description}</span>
                      </div>
                      <div className="radio-check">
                        <div className={`radio-circle ${reportType === type.value ? 'checked' : ''}`}>
                          {reportType === type.value && <div className="radio-dot"></div>}
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Format Selection */}
            <div className="form-section card">
              <div className="form-header">
                <FileDown size={20} />
                <label>Output Format</label>
              </div>
              <div className="radio-group">
                {formatTypes.map((formatType) => (
                  <label 
                    key={formatType.value}
                    className={`radio-option ${format === formatType.value ? 'active' : ''}`}
                    onClick={() => setFormat(formatType.value)}
                  >
                    <div className="radio-content">
                      <div className="radio-icon">{formatType.icon}</div>
                      <div className="radio-text">
                        <span className="radio-label">{formatType.label}</span>
                        <span className="radio-description">{formatType.description}</span>
                      </div>
                      <div className="radio-check">
                        <div className={`radio-circle ${format === formatType.value ? 'checked' : ''}`}>
                          {format === formatType.value && <div className="radio-dot"></div>}
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div className="form-section card">
              <div className="form-header">
                <Calendar size={20} />
                <label>Date Range</label>
              </div>
              <div className="date-range-inputs">
                <div className="input-group">
                  <span className="input-label">Start Date</span>
                  <input
                    type="date"
                    name="startDate"
                    value={dateRange.startDate}
                    onChange={handleDateChange}
                    className="date-input"
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="input-group">
                  <span className="input-label">End Date</span>
                  <input
                    type="date"
                    name="endDate"
                    value={dateRange.endDate}
                    onChange={handleDateChange}
                    className="date-input"
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              <div className="date-range-hint">
                Selected: {dateRange.startDate} to {dateRange.endDate}
                <br />
                <small style={{ color: '#666', fontSize: '12px' }}>
                  Note: If no data is found, the report will automatically use today's date
                </small>
              </div>
            </div>

            {/* Filters */}
            <div className="form-section card">
              <div className="form-header">
                <Filter size={20} />
                <label>Filters</label>
                <button 
                  className="advanced-toggle"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                >
                  {showAdvancedFilters ? 'Hide' : 'Show'} Advanced
                </button>
              </div>
              
              <div className="filter-inputs">
                <div className="input-group">
                  <span className="input-label">Employee ID</span>
                  <input
                    type="text"
                    name="employeeId"
                    placeholder="Enter employee ID"
                    value={filters.employeeId}
                    onChange={handleFilterChange}
                    className="filter-input"
                  />
                </div>
                <div className="input-group">
                  <span className="input-label">Department</span>
                  <select
                    name="department"
                    value={filters.department}
                    onChange={handleFilterChange}
                    className="filter-input"
                  >
                    <option value="">All Departments</option>
                    {availableDepartments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              {showAdvancedFilters && (
                <div className="advanced-filters">
                  <div className="checkbox-group">
                    <label className="checkbox-option">
                      <input
                        type="checkbox"
                        name="includeSummary"
                        checked={filters.includeSummary}
                        onChange={handleFilterChange}
                      />
                      <span className="checkbox-label">
                        <CheckCircle size={16} />
                        Include Summary Statistics
                      </span>
                    </label>
                    <label className="checkbox-option">
                      <input
                        type="checkbox"
                        name="includeCharts"
                        checked={filters.includeCharts}
                        onChange={handleFilterChange}
                      />
                      <span className="checkbox-label">
                        <PieChart size={16} />
                        Include Charts (PDF only)
                      </span>
                    </label>
                    <label className="checkbox-option">
                      <input
                        type="checkbox"
                        name="groupByDepartment"
                        checked={filters.groupByDepartment}
                        onChange={handleFilterChange}
                      />
                      <span className="checkbox-label">
                        <Users size={16} />
                        Group by Department
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Generate Button */}
            <div className="form-section">
              <button
                className="generate-btn"
                onClick={generateReport}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    Generating Report...
                  </>
                ) : (
                  <>
                    <Download size={20} />
                    Generate & Download Report
                  </>
                )}
              </button>
              
              <div className="generate-hint">
                <AlertCircle size={16} />
                <span>
                  {format === 'pdf' 
                    ? 'PDF reports will be downloaded directly. Large reports may take a moment to generate.'
                    : `${format.toUpperCase()} files will be downloaded directly with raw data.`
                  }
                </span>
              </div>
            </div>

            {/* Report Preview */}
            <div className="report-preview card">
              <div className="preview-header">
                <h3>Report Preview</h3>
                <span className="preview-badge">Preview</span>
              </div>
              <div className="preview-content">
                <div className="preview-item">
                  <span className="preview-label">Type:</span>
                  <span className="preview-value">{reportType === 'detailed' ? 'Detailed Report' : 'Summary Report'}</span>
                </div>
                <div className="preview-item">
                  <span className="preview-label">Format:</span>
                  <span className="preview-value">{format.toUpperCase()}</span>
                </div>
                <div className="preview-item">
                  <span className="preview-label">Date Range:</span>
                  <span className="preview-value">{dateRange.startDate} to {dateRange.endDate}</span>
                </div>
                <div className="preview-item">
                  <span className="preview-label">Filters Applied:</span>
                  <span className="preview-value">
                    {[filters.employeeId && 'Employee ID', filters.department && 'Department']
                      .filter(Boolean)
                      .join(', ') || 'None'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}