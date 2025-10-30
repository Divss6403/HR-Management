import React, { useState } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../styles/Analytics.css';

const AnalyticsModule = ({ users }) => {
  const [dateRange, setDateRange] = useState('30days');

  // Sample data for charts
  const attendanceTrend = [
    { date: 'Oct 1', attendance: 92, avgHours: 8.2 },
    { date: 'Oct 5', attendance: 88, avgHours: 7.8 },
    { date: 'Oct 10', attendance: 95, avgHours: 8.5 },
    { date: 'Oct 15', attendance: 91, avgHours: 8.1 },
    { date: 'Oct 20', attendance: 94, avgHours: 8.4 },
    { date: 'Oct 25', attendance: 89, avgHours: 7.9 },
    { date: 'Oct 30', attendance: 93, avgHours: 8.3 }
  ];

  const performanceByDepartment = [
    { department: 'Engineering', score: 88, employees: 12 },
    { department: 'Sales', score: 85, employees: 8 },
    { department: 'Marketing', score: 92, employees: 6 },
    { department: 'HR', score: 90, employees: 4 },
    { department: 'Finance', score: 87, employees: 5 }
  ];

  const roleDistribution = [
    { name: 'Interns', value: 15, percentage: 42.9 },
    { name: 'Employees', value: 18, percentage: 51.4 },
    { name: 'HR Managers', value: 2, percentage: 5.7 }
  ];

  const payrollSummary = [
    { month: 'Jun', amount: 125000, employees: 33 },
    { month: 'Jul', amount: 132000, employees: 34 },
    { month: 'Aug', amount: 128000, employees: 34 },
    { month: 'Sep', amount: 145000, employees: 35 },
    { month: 'Oct', amount: 152000, employees: 35 },
    { month: 'Nov', amount: 148000, employees: 35 }
  ];

  const leaveAnalysis = [
    { type: 'Sick Leave', count: 12, approved: 10, pending: 2 },
    { type: 'Casual Leave', count: 25, approved: 23, pending: 2 },
    { type: 'Vacation', count: 18, approved: 15, pending: 3 }
  ];

  const topPerformers = [
    { name: 'John Doe', role: 'Intern', score: 95, department: 'Engineering' },
    { name: 'Sarah Johnson', role: 'Intern', score: 93, department: 'Marketing' },
    { name: 'Bob Developer', role: 'Employee', score: 92, department: 'Engineering' },
    { name: 'Emily Chen', role: 'Employee', score: 91, department: 'Sales' },
    { name: 'Mike Wilson', role: 'Employee', score: 89, department: 'Finance' }
  ];

  const recruitmentFunnel = [
    { stage: 'Applications', count: 120 },
    { stage: 'Screening', count: 85 },
    { stage: 'Interview', count: 45 },
    { stage: 'Offer', count: 20 },
    { stage: 'Hired', count: 15 }
  ];

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  // Calculate summary metrics
  const totalUsers = users.length;
  const totalInterns = users.filter(u => u.role === 'intern').length;
  const totalEmployees = users.filter(u => u.role === 'employee').length;
  const avgAttendance = 92;
  const avgPerformance = 88;

  return (
    <div className="analytics-module">
      <div className="analytics-header">
        <h2>📊 Analytics Dashboard</h2>
        <div className="date-filter">
          <label>Time Period:</label>
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="3months">Last 3 Months</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="metrics-overview">
        <div className="metric-card blue">
          <div className="metric-icon">👥</div>
          <div className="metric-content">
            <h3>{totalUsers}</h3>
            <p>Total Users</p>
            <span className="metric-change positive">+5% from last month</span>
          </div>
        </div>
        <div className="metric-card green">
          <div className="metric-icon">✅</div>
          <div className="metric-content">
            <h3>{avgAttendance}%</h3>
            <p>Avg Attendance</p>
            <span className="metric-change positive">+2% from last month</span>
          </div>
        </div>
        <div className="metric-card purple">
          <div className="metric-icon">🏆</div>
          <div className="metric-content">
            <h3>{avgPerformance}%</h3>
            <p>Avg Performance</p>
            <span className="metric-change positive">+3% from last month</span>
          </div>
        </div>
        <div className="metric-card orange">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <h3>$152K</h3>
            <p>Monthly Payroll</p>
            <span className="metric-change negative">+8% from last month</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="analytics-grid">
        {/* Attendance Trend */}
        <div className="analytics-card wide">
          <h3>📈 Attendance Trend & Work Hours</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={attendanceTrend}>
              <defs>
                <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="attendance" stroke="#3b82f6" fillOpacity={1} fill="url(#colorAttendance)" name="Attendance %" />
              <Line type="monotone" dataKey="avgHours" stroke="#8b5cf6" strokeWidth={2} name="Avg Hours" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Role Distribution */}
        <div className="analytics-card">
          <h3>👥 Workforce Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={roleDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name} (${entry.percentage}%)`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {roleDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Performance by Department */}
        <div className="analytics-card wide">
          <h3>🎯 Department Performance Scores</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceByDepartment}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="department" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Bar dataKey="score" fill="#8b5cf6" name="Performance Score" />
              <Bar dataKey="employees" fill="#3b82f6" name="Team Size" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payroll Summary */}
        <div className="analytics-card wide">
          <h3>💰 Monthly Payroll Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={payrollSummary}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Legend />
              <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} name="Payroll ($)" />
              <Line type="monotone" dataKey="employees" stroke="#f59e0b" strokeWidth={2} name="Employee Count" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Recruitment Funnel */}
        <div className="analytics-card">
          <h3>🎯 Recruitment Funnel</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={recruitmentFunnel} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" stroke="#6b7280" />
              <YAxis dataKey="stage" type="category" stroke="#6b7280" />
              <Tooltip />
              <Bar dataKey="count" fill="#ec4899" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Data Tables */}
      <div className="analytics-tables">
        {/* Top Performers */}
        <div className="analytics-table-card">
          <h3>🏆 Top Performers (This Month)</h3>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {topPerformers.map((performer, index) => (
                  <tr key={index}>
                    <td>
                      <div className="rank-badge">
                        {index === 0 && '🥇'}
                        {index === 1 && '🥈'}
                        {index === 2 && '🥉'}
                        {index > 2 && `#${index + 1}`}
                      </div>
                    </td>
                    <td><strong>{performer.name}</strong></td>
                    <td><span className={`badge badge-${performer.role.toLowerCase()}`}>{performer.role}</span></td>
                    <td>{performer.department}</td>
                    <td>
                      <div className="score-bar">
                        <div className="score-fill" style={{ width: `${performer.score}%` }}></div>
                        <span className="score-text">{performer.score}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Leave Analysis */}
        <div className="analytics-table-card">
          <h3>🏖️ Leave Analysis</h3>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Leave Type</th>
                  <th>Total Requests</th>
                  <th>Approved</th>
                  <th>Pending</th>
                  <th>Approval Rate</th>
                </tr>
              </thead>
              <tbody>
                {leaveAnalysis.map((leave, index) => (
                  <tr key={index}>
                    <td><strong>{leave.type}</strong></td>
                    <td>{leave.count}</td>
                    <td><span className="status-approved">{leave.approved}</span></td>
                    <td><span className="status-pending">{leave.pending}</span></td>
                    <td>
                      <div className="approval-rate">
                        {Math.round((leave.approved / leave.count) * 100)}%
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Summary Report */}
      <div className="summary-report">
        <h3>📋 Executive Summary</h3>
        <div className="report-grid">
          <div className="report-item">
            <span className="report-label">Workforce Size:</span>
            <span className="report-value">{totalUsers} total ({totalInterns} interns, {totalEmployees} employees)</span>
          </div>
          <div className="report-item">
            <span className="report-label">Overall Attendance:</span>
            <span className="report-value">{avgAttendance}% (Target: 90%)</span>
          </div>
          <div className="report-item">
            <span className="report-label">Average Performance:</span>
            <span className="report-value">{avgPerformance}% (Industry Average: 85%)</span>
          </div>
          <div className="report-item">
            <span className="report-label">Total Payroll (Monthly):</span>
            <span className="report-value">$152,000</span>
          </div>
          <div className="report-item">
            <span className="report-label">Pending Leave Requests:</span>
            <span className="report-value">7 applications</span>
          </div>
          <div className="report-item">
            <span className="report-label">Active Recruitment:</span>
            <span className="report-value">15 positions open, 45 in interview stage</span>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="export-section">
        <button className="btn-export">📥 Export to PDF</button>
        <button className="btn-export">📊 Export to Excel</button>
        <button className="btn-export">📧 Email Report</button>
      </div>
    </div>
  );
};

export default AnalyticsModule;
