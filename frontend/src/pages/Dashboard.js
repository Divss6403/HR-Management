import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../styles/Dashboard.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      const [statsResponse, usersResponse] = await Promise.all([
        axios.get(`${API}/dashboard/stats`, { headers }),
        axios.get(`${API}/users`, { headers })
      ]);
      
      setStats(statsResponse.data);
      setUsers(usersResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploadingPhoto(true);
    try {
      const headers = { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      };
      await axios.post(`${API}/upload/profile-picture`, formData, { headers });
      alert('Profile picture uploaded successfully!');
      window.location.reload();
    } catch (error) {
      alert('Failed to upload profile picture');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploadingResume(true);
    try {
      const headers = { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      };
      await axios.post(`${API}/upload/resume`, formData, { headers });
      alert('Resume uploaded successfully!');
      window.location.reload();
    } catch (error) {
      alert('Failed to upload resume');
    } finally {
      setUploadingResume(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-large"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-circle-small"></div>
          <h2>HR Portal</h2>
        </div>
        
        <nav className="sidebar-nav">
          <a href="#overview" className="nav-item active" data-testid="nav-overview">
            <span className="nav-icon">📊</span>
            <span>Overview</span>
          </a>
          <a href="#profile" className="nav-item" data-testid="nav-profile">
            <span className="nav-icon">👤</span>
            <span>My Profile</span>
          </a>
          {user.role === 'hr' && (
            <>
              <a href="#employees" className="nav-item" data-testid="nav-employees">
                <span className="nav-icon">👥</span>
                <span>All Users</span>
              </a>
              <a href="#analytics" className="nav-item" data-testid="nav-analytics">
                <span className="nav-icon">📈</span>
                <span>Analytics</span>
              </a>
            </>
          )}
          {user.role === 'employee' && (
            <a href="#interns" className="nav-item" data-testid="nav-interns">
              <span className="nav-icon">🎓</span>
              <span>My Interns</span>
            </a>
          )}
        </nav>

        <button className="logout-btn" onClick={handleLogout} data-testid="logout-button">
          <span>🚪</span> Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="dashboard-header">
          <div>
            <h1 data-testid="welcome-message">Welcome back, {user.full_name}!</h1>
            <p className="role-badge" data-testid="role-badge">{user.role.toUpperCase()}</p>
          </div>
          <div className="header-actions">
            <div className="user-avatar" data-testid="user-avatar">
              {user.profile_picture ? (
                <img src={user.profile_picture} alt="Profile" />
              ) : (
                <span>{user.full_name.charAt(0)}</span>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard Content Based on Role */}
        {user.role === 'hr' && <HRDashboard stats={stats} users={users} />}
        {user.role === 'employee' && <EmployeeDashboard stats={stats} users={users} user={user} />}
        {user.role === 'intern' && (
          <InternDashboard 
            user={user} 
            handlePhotoUpload={handlePhotoUpload}
            handleResumeUpload={handleResumeUpload}
            uploadingPhoto={uploadingPhoto}
            uploadingResume={uploadingResume}
          />
        )}
      </main>
    </div>
  );
};

// HR Dashboard Component
const HRDashboard = ({ stats, users }) => {
  const performanceData = [
    { month: 'Jan', performance: 75 },
    { month: 'Feb', performance: 82 },
    { month: 'Mar', performance: 78 },
    { month: 'Apr', performance: 88 },
    { month: 'May', performance: 92 },
    { month: 'Jun', performance: 95 }
  ];

  const departmentData = [
    { name: 'Engineering', value: 45 },
    { name: 'Sales', value: 25 },
    { name: 'Marketing', value: 15 },
    { name: 'HR', value: 10 },
    { name: 'Finance', value: 5 }
  ];

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  return (
    <div className="dashboard-content">
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card" data-testid="total-users-card">
          <div className="stat-icon blue">👥</div>
          <div className="stat-info">
            <p className="stat-label">Total Users</p>
            <h3 className="stat-value" data-testid="total-users-value">{stats.total_users}</h3>
          </div>
        </div>
        <div className="stat-card" data-testid="total-interns-card">
          <div className="stat-icon purple">🎓</div>
          <div className="stat-info">
            <p className="stat-label">Total Interns</p>
            <h3 className="stat-value" data-testid="total-interns-value">{stats.total_interns}</h3>
          </div>
        </div>
        <div className="stat-card" data-testid="total-employees-card">
          <div className="stat-icon green">💼</div>
          <div className="stat-info">
            <p className="stat-label">Total Employees</p>
            <h3 className="stat-value" data-testid="total-employees-value">{stats.total_employees}</h3>
          </div>
        </div>
        <div className="stat-card" data-testid="performance-card">
          <div className="stat-icon orange">📈</div>
          <div className="stat-info">
            <p className="stat-label">Avg Performance</p>
            <h3 className="stat-value" data-testid="performance-value">87%</h3>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        <div className="chart-card" data-testid="performance-chart">
          <h3>Performance Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="performance" stroke="#3b82f6" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card" data-testid="department-chart">
          <h3>Department Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={departmentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => entry.name}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {departmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Users Table */}
      <div className="table-card" data-testid="users-table">
        <h3>All Users</h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, index) => (
                <tr key={u.id} data-testid={`user-row-${index}`}>
                  <td>{u.full_name}</td>
                  <td>{u.email}</td>
                  <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                  <td>{u.phone_number}</td>
                  <td>{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Employee Dashboard Component
const EmployeeDashboard = ({ stats, users, user }) => {
  const taskData = [
    { task: 'Q1 Review', completed: 85 },
    { task: 'Mentorship', completed: 70 },
    { task: 'Projects', completed: 95 },
    { task: 'Training', completed: 60 }
  ];

  return (
    <div className="dashboard-content">
      <div className="stats-grid">
        <div className="stat-card" data-testid="interns-managed-card">
          <div className="stat-icon blue">🎓</div>
          <div className="stat-info">
            <p className="stat-label">Interns Managed</p>
            <h3 className="stat-value" data-testid="interns-count">{stats.total_interns_under_me || 0}</h3>
          </div>
        </div>
        <div className="stat-card" data-testid="tasks-card">
          <div className="stat-icon green">✅</div>
          <div className="stat-info">
            <p className="stat-label">Tasks Completed</p>
            <h3 className="stat-value">24/30</h3>
          </div>
        </div>
        <div className="stat-card" data-testid="attendance-card">
          <div className="stat-icon purple">📅</div>
          <div className="stat-info">
            <p className="stat-label">Attendance</p>
            <h3 className="stat-value">95%</h3>
          </div>
        </div>
      </div>

      {/* Task Performance Chart */}
      <div className="charts-grid">
        <div className="chart-card" data-testid="task-performance-chart">
          <h3>Task Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={taskData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="task" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Interns Under Management */}
      {users.length > 0 && (
        <div className="table-card" data-testid="interns-table">
          <h3>Interns Under Your Supervision</h3>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Institution</th>
                  <th>Area of Interest</th>
                </tr>
              </thead>
              <tbody>
                {users.map((intern, index) => (
                  <tr key={intern.id} data-testid={`intern-row-${index}`}>
                    <td>{intern.full_name}</td>
                    <td>{intern.email}</td>
                    <td>{intern.educational_institution}</td>
                    <td>{intern.area_of_interest}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// Intern Dashboard Component
const InternDashboard = ({ user, handlePhotoUpload, handleResumeUpload, uploadingPhoto, uploadingResume }) => {
  const learningProgress = [
    { module: 'Onboarding', progress: 100 },
    { module: 'Technical Skills', progress: 75 },
    { module: 'Soft Skills', progress: 60 },
    { module: 'Final Project', progress: 30 }
  ];

  return (
    <div className="dashboard-content">
      {/* Profile Section */}
      <div className="profile-section" data-testid="profile-section">
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar-large">
              {user.profile_picture ? (
                <img src={user.profile_picture} alt="Profile" />
              ) : (
                <span>{user.full_name.charAt(0)}</span>
              )}
            </div>
            <div className="profile-info">
              <h2 data-testid="profile-name">{user.full_name}</h2>
              <p data-testid="profile-email">{user.email}</p>
              <p data-testid="profile-institution">{user.educational_institution}</p>
              <p className="profile-major" data-testid="profile-major">{user.major_field_of_study}</p>
            </div>
          </div>

          <div className="profile-details">
            <div className="detail-item">
              <span className="detail-label">Phone:</span>
              <span data-testid="profile-phone">{user.phone_number}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Date of Birth:</span>
              <span data-testid="profile-dob">{user.date_of_birth}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Area of Interest:</span>
              <span data-testid="profile-interest">{user.area_of_interest}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Internship Period:</span>
              <span data-testid="profile-period">{user.internship_start_date} to {user.internship_end_date}</span>
            </div>
          </div>

          <div className="upload-section">
            <div className="upload-item">
              <label htmlFor="photo-upload" className="upload-label">
                {uploadingPhoto ? 'Uploading...' : '📷 Upload Profile Photo'}
              </label>
              <input
                id="photo-upload"
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handlePhotoUpload}
                disabled={uploadingPhoto}
                style={{ display: 'none' }}
                data-testid="photo-upload-input"
              />
            </div>
            <div className="upload-item">
              <label htmlFor="resume-upload" className="upload-label">
                {uploadingResume ? 'Uploading...' : '📄 Upload Resume'}
              </label>
              <input
                id="resume-upload"
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleResumeUpload}
                disabled={uploadingResume}
                style={{ display: 'none' }}
                data-testid="resume-upload-input"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Learning Progress Chart */}
      <div className="charts-grid">
        <div className="chart-card" data-testid="learning-progress-chart">
          <h3>Learning Progress</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={learningProgress}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="module" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Bar dataKey="progress" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid">
        <div className="stat-card" data-testid="attendance-stat">
          <div className="stat-icon blue">📅</div>
          <div className="stat-info">
            <p className="stat-label">Attendance</p>
            <h3 className="stat-value">92%</h3>
          </div>
        </div>
        <div className="stat-card" data-testid="tasks-stat">
          <div className="stat-icon green">✅</div>
          <div className="stat-info">
            <p className="stat-label">Tasks Completed</p>
            <h3 className="stat-value">15/20</h3>
          </div>
        </div>
        <div className="stat-card" data-testid="performance-stat">
          <div className="stat-icon purple">🎖️</div>
          <div className="stat-info">
            <p className="stat-label">Performance Score</p>
            <h3 className="stat-value">85%</h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;