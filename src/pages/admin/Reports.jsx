import React, { useState } from 'react';
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
  TrendingUp
} from 'lucide-react';
import '../../assets/styles/Reports.css';

export default function Reportss() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('detailed');
  const [format, setFormat] = useState('pdf');
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

  const API_BASE_URL = 'https://attendance-backend-d4vi.onrender.com';

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

const generateReport = async () => {
  // Validate date range
  if (dateRange.startDate && dateRange.endDate) {
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    if (start > end) {
      showNotification('error', 'Start date cannot be after end date');
      return;
    }
    
    // Check if date range is too large
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 365) {
      const confirm = window.confirm(`You're generating a report for ${diffDays} days. This may take a while. Continue?`);
      if (!confirm) return;
    }
  }

  setLoading(true);
  try {
    const authData = localStorage.getItem('auth');
    if (!authData) throw new Error('No authentication data found');

    const parsedAuth = JSON.parse(authData);
    const token = parsedAuth.session?.access_token || parsedAuth.access_token || parsedAuth.token;

    if (!token) {
      throw new Error('No authentication token found');
    }

    // Prepare report data for PDF endpoint
    const reportData = {
      startDate: dateRange.startDate || undefined,
      endDate: dateRange.endDate || undefined,
      reportType, // 'detailed' or 'summary'
      employeeId: filters.employeeId || undefined,
      department: filters.department || undefined,
    };

    // Remove undefined values
    Object.keys(reportData).forEach(key => {
      if (reportData[key] === undefined) {
        delete reportData[key];
      }
    });

    console.log('Generating report with data:', reportData);

    const response = await fetch(`${API_BASE_URL}/attendance/generate-pdf`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reportData)
    });

    if (!response.ok) {
      let errorMessage = `Failed to generate report: ${response.status} ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // If response is not JSON, use default message
      }
      
      if (response.status === 401) {
        localStorage.removeItem('auth');
        window.location.href = '/login';
        return;
      }
      throw new Error(errorMessage);
    }

    // Get the blob data
    const blob = await response.blob();
    
    if (blob.size === 0) {
      throw new Error('Generated PDF is empty');
    }
    
    // Create a filename with date and type
    const today = new Date().toISOString().slice(0, 10);
    const start = dateRange.startDate ? dateRange.startDate.replace(/-/g, '') : 'all';
    const end = dateRange.endDate ? dateRange.endDate.replace(/-/g, '') : 'all';
    const filename = `attendance_${reportType}_${start}_to_${end}_${today}.pdf`;

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    // Show success message
    showNotification('success', `Report generated successfully! File: ${filename}`);
    
  } catch (error) {
    console.error('Error generating report:', error);
    showNotification('error', `Failed to generate report: ${error.message}`);
  } finally {
    setLoading(false);
  }
};

// Also, add a showNotification helper function if not already present:
const showNotification = (type, message) => {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      ${type === 'success' ? '✅' : '❌'}
      <span>${message}</span>
    </div>
  `;
  
  // Add to container
  const container = document.querySelector('.notifications-container') || createNotificationContainer();
  container.appendChild(notification);
  
  // Show animation
  setTimeout(() => notification.classList.add('show'), 10);
  
  // Remove after 5 seconds
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
 

  const quickReports = [
    {
      id: 1,
      title: "Today's Report",
      description: 'Download today\'s attendance',
      icon: <Calendar size={24} />,
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      action: () => {
        const today = new Date().toISOString().split('T')[0];
        setDateRange({
          startDate: today,
          endDate: today
        });
        setReportType('detailed');
        setFilters(prev => ({ ...prev, employeeId: '', department: '' }));
        setTimeout(() => generateReport(), 300);
      }
    },
    {
      id: 2,
      title: 'Weekly Summary',
      description: 'Last 7 days overview',
      icon: <BarChart2 size={24} />,
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
      action: () => {
        const today = new Date();
        const lastWeek = new Date(today);
        lastWeek.setDate(today.getDate() - 6);
        
        setDateRange({
          startDate: lastWeek.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        });
        setReportType('summary');
        setFilters(prev => ({ ...prev, employeeId: '', department: '' }));
        setTimeout(() => generateReport(), 300);
      }
    },
    {
      id: 3,
      title: 'Monthly Report',
      description: 'Complete monthly analysis',
      icon: <TrendingUp size={24} />,
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      action: () => {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        
        setDateRange({
          startDate: firstDay.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        });
        setReportType('detailed');
        setFilters(prev => ({ 
          ...prev, 
          includeSummary: true,
          employeeId: '',
          department: ''
        }));
        setTimeout(() => generateReport(), 300);
      }
    },
    {
      id: 4,
      title: 'Absent Report',
      description: 'Absent employees analysis',
      icon: <XCircle size={24} />,
      color: '#ef4444',
      gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      action: () => {
        const today = new Date();
        const lastMonth = new Date(today);
        lastMonth.setMonth(today.getMonth() - 1);
        
        setDateRange({
          startDate: lastMonth.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        });
        setReportType('detailed');
        setFilters(prev => ({
          ...prev,
          lateArrivalsOnly: false,
          earlyDeparturesOnly: false,
          employeeId: '',
          department: ''
        }));
        setTimeout(() => generateReport(), 300);
      }
    }
  ];

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
    {
      value: 'excel',
      label: 'Excel Spreadsheet',
      description: 'Data in spreadsheet format',
      icon: <BarChart2 size={20} />
    },
    {
      value: 'csv',
      label: 'CSV Data',
      description: 'Raw data for analysis',
      icon: <Settings size={20} />
    }
  ];

  return (
    <div className="reports-container">
      {/* Notification container */}
      <div className="notifications-container"></div>

      {/* Header */}
      <div className="reports-header">
        <div className="header-left">
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
                onClick={report.action}
                style={{ 
                  background: report.gradient,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1
                }}
                disabled={loading}
              >
                <div className="quick-report-icon" style={{ color: 'white' }}>
                  {report.icon}
                </div>
                <div className="quick-report-content">
                  <h3 style={{ color: 'white' }}>{report.title}</h3>
                  <p style={{ color: 'rgba(255, 255, 255, 0.9)' }}>{report.description}</p>
                </div>
                <div className="quick-report-arrow">
                  <ChevronRight size={20} color="white" />
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
                <span className="stat-label">Report Types</span>
                <span className="stat-value">{reportTypes.length}</span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon" style={{ background: '#f0f9ff' }}>
                <Clock size={18} color="#0ea5e9" />
              </div>
              <div className="stat-info">
                <span className="stat-label">Time Range</span>
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
                  <input
                    type="text"
                    name="department"
                    placeholder="Enter department name"
                    value={filters.department}
                    onChange={handleFilterChange}
                    className="filter-input"
                  />
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
                    <label className="checkbox-option">
                      <input
                        type="checkbox"
                        name="lateArrivalsOnly"
                        checked={filters.lateArrivalsOnly}
                        onChange={handleFilterChange}
                      />
                      <span className="checkbox-label">
                        <Clock size={16} />
                        Late Arrivals Only
                      </span>
                    </label>
                    <label className="checkbox-option">
                      <input
                        type="checkbox"
                        name="earlyDeparturesOnly"
                        checked={filters.earlyDeparturesOnly}
                        onChange={handleFilterChange}
                      />
                      <span className="checkbox-label">
                        <Clock size={16} />
                        Early Departures Only
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
                <span>PDF reports will be downloaded directly. Large reports may take a moment to generate.</span>
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