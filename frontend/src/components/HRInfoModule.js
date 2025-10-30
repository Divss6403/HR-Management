import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/HRInfo.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HRInfoModule = ({ user, token }) => {
  const [hrManagers, setHrManagers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHRManagers();
  }, []);

  const fetchHRManagers = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API}/users`, { headers });
      // Filter only HR role users
      const hrs = response.data.filter(u => u.role === 'hr');
      setHrManagers(hrs);
    } catch (error) {
      console.error('Error fetching HR managers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading HR information...</div>;
  }

  return (
    <div className="hr-info-module">
      <div className="hr-info-header">
        <h2>👔 Your HR Team</h2>
        <p className="hr-subtitle">Contact your HR managers for any assistance or queries</p>
      </div>

      {hrManagers.length === 0 ? (
        <div className="no-hr-card">
          <p>No HR managers found in the system.</p>
        </div>
      ) : (
        <div className="hr-cards-grid">
          {hrManagers.map((hr, index) => (
            <div key={hr.id} className="hr-info-card" data-testid={`hr-card-${index}`}>
              <div className="hr-card-header">
                <div className="hr-avatar-large">
                  {hr.profile_picture ? (
                    <img src={hr.profile_picture} alt={hr.full_name} />
                  ) : (
                    <span>{hr.full_name.charAt(0)}</span>
                  )}
                </div>
                <div className="hr-header-info">
                  <h3>{hr.full_name}</h3>
                  <span className="hr-role-badge">HR Manager</span>
                </div>
              </div>

              <div className="hr-contact-section">
                <h4>📞 Contact Information</h4>
                <div className="contact-item">
                  <span className="contact-icon">📧</span>
                  <div className="contact-details">
                    <span className="contact-label">Email</span>
                    <a href={`mailto:${hr.email}`} className="contact-value">{hr.email}</a>
                  </div>
                </div>
                <div className="contact-item">
                  <span className="contact-icon">📱</span>
                  <div className="contact-details">
                    <span className="contact-label">Phone</span>
                    <span className="contact-value">{hr.phone_number}</span>
                  </div>
                </div>
              </div>

              {hr.office_location && (
                <div className="hr-info-section">
                  <h4>📍 Office Location</h4>
                  <p>{hr.office_location}</p>
                </div>
              )}

              {hr.departments_overseen && (
                <div className="hr-info-section">
                  <h4>🏢 Departments Overseen</h4>
                  <div className="departments-tags">
                    {hr.departments_overseen.split(',').map((dept, idx) => (
                      <span key={idx} className="department-tag">{dept.trim()}</span>
                    ))}
                  </div>
                </div>
              )}

              {hr.work_experience && (
                <div className="hr-info-section">
                  <h4>💼 Experience</h4>
                  <p>{hr.work_experience}</p>
                </div>
              )}

              {hr.certifications && (
                <div className="hr-info-section">
                  <h4>🎓 Certifications</h4>
                  <p>{hr.certifications}</p>
                </div>
              )}

              {hr.hr_access_level && (
                <div className="hr-info-section">
                  <h4>⚙️ Access Level</h4>
                  <span className="access-badge">{hr.hr_access_level}</span>
                </div>
              )}

              <div className="hr-actions">
                <a href={`mailto:${hr.email}`} className="btn-contact">
                  <span>📧</span> Send Email
                </a>
                <a href={`tel:${hr.phone_number}`} className="btn-contact secondary">
                  <span>📱</span> Call
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="hr-help-section">
        <h3>💡 How Can HR Help You?</h3>
        <div className="help-grid">
          <div className="help-item">
            <span className="help-icon">📝</span>
            <h4>Onboarding Support</h4>
            <p>Assistance with joining formalities, documentation, and orientation</p>
          </div>
          <div className="help-item">
            <span className="help-icon">💰</span>
            <h4>Payroll Queries</h4>
            <p>Salary, benefits, tax deductions, and payment schedule information</p>
          </div>
          <div className="help-item">
            <span className="help-icon">🏖️</span>
            <h4>Leave Management</h4>
            <p>Leave policies, approvals, and balance inquiries</p>
          </div>
          <div className="help-item">
            <span className="help-icon">📈</span>
            <h4>Performance Reviews</h4>
            <p>Goal setting, feedback sessions, and performance evaluations</p>
          </div>
          <div className="help-item">
            <span className="help-icon">🎯</span>
            <h4>Career Development</h4>
            <p>Training opportunities, skill development, and career growth</p>
          </div>
          <div className="help-item">
            <span className="help-icon">🤝</span>
            <h4>Workplace Issues</h4>
            <p>Conflict resolution, grievances, and workplace concerns</p>
          </div>
        </div>
      </div>

      <div className="quick-links-section">
        <h3>🔗 Quick Links</h3>
        <div className="quick-links-grid">
          <a href="#" className="quick-link-card">
            <span className="link-icon">📚</span>
            <span className="link-text">Employee Handbook</span>
          </a>
          <a href="#" className="quick-link-card">
            <span className="link-icon">📋</span>
            <span className="link-text">Company Policies</span>
          </a>
          <a href="#" className="quick-link-card">
            <span className="link-icon">🏥</span>
            <span className="link-text">Benefits Guide</span>
          </a>
          <a href="#" className="quick-link-card">
            <span className="link-icon">📅</span>
            <span className="link-text">Holiday Calendar</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default HRInfoModule;
