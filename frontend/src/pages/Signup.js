import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import '../styles/Auth.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Signup = () => {
  const [step, setStep] = useState(1); // 1: role selection, 2: form
  const [role, setRole] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    password: '',
    confirm_password: '',
    gender: '',
    date_of_birth: '',
    address: '',
    preferred_language: 'English'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setStep(2);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const endpoint = `${API}/auth/signup/${role}`;
      const { confirm_password, ...submitData } = formData;
      
      const response = await axios.post(endpoint, submitData);
      login(response.data.token, response.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div className="auth-container">
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
        </div>
        
        <div className="auth-card role-selection">
          <div className="auth-header">
            <div className="logo-wrapper">
              <div className="logo-circle"></div>
              <h1 className="logo-text">HR Management</h1>
            </div>
            <h2 className="auth-title">Choose Your Role</h2>
            <p className="auth-subtitle">Select your position to get started</p>
          </div>

          <div className="role-cards">
            <div 
              className="role-card"
              onClick={() => handleRoleSelect('intern')}
              data-testid="role-intern"
            >
              <div className="role-icon intern-icon">🎓</div>
              <h3>Intern</h3>
              <p>Join as an intern to start your journey</p>
            </div>

            <div 
              className="role-card"
              onClick={() => handleRoleSelect('employee')}
              data-testid="role-employee"
            >
              <div className="role-icon employee-icon">💼</div>
              <h3>Employee</h3>
              <p>Access your employee portal</p>
            </div>

            <div 
              className="role-card"
              onClick={() => handleRoleSelect('hr')}
              data-testid="role-hr"
            >
              <div className="role-icon hr-icon">👔</div>
              <h3>HR Manager</h3>
              <p>Manage and oversee operations</p>
            </div>
          </div>

          <div className="auth-footer">
            <p>Already have an account? <Link to="/login" data-testid="login-link">Sign in</Link></p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="floating-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
      </div>
      
      <div className="auth-card signup-form">
        <div className="auth-header">
          <button 
            className="back-button" 
            onClick={() => setStep(1)}
            data-testid="back-button"
          >
            ← Back
          </button>
          <h2 className="auth-title">Create {role.charAt(0).toUpperCase() + role.slice(1)} Account</h2>
          <p className="auth-subtitle">Fill in your details to register</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="error-message" data-testid="signup-error">
              {error}
            </div>
          )}

          {/* Common Fields */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="full_name">Full Name *</label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                value={formData.full_name}
                onChange={handleChange}
                required
                placeholder="John Doe"
                data-testid="full-name-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="john@company.com"
                data-testid="email-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone_number">Phone Number *</label>
              <input
                id="phone_number"
                name="phone_number"
                type="tel"
                value={formData.phone_number}
                onChange={handleChange}
                required
                placeholder="+1234567890"
                data-testid="phone-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="date_of_birth">Date of Birth *</label>
              <input
                id="date_of_birth"
                name="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={handleChange}
                required
                data-testid="dob-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Minimum 6 characters"
                data-testid="password-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirm_password">Confirm Password *</label>
              <input
                id="confirm_password"
                name="confirm_password"
                type="password"
                value={formData.confirm_password}
                onChange={handleChange}
                required
                placeholder="Confirm password"
                data-testid="confirm-password-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="address">Address *</label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              placeholder="Your full address"
              rows="2"
              data-testid="address-input"
            ></textarea>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="gender">Gender</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                data-testid="gender-select"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="preferred_language">Preferred Language</label>
              <select
                id="preferred_language"
                name="preferred_language"
                value={formData.preferred_language}
                onChange={handleChange}
                data-testid="language-select"
              >
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Chinese">Chinese</option>
              </select>
            </div>
          </div>

          {/* Role-specific fields */}
          {role === 'intern' && (
            <InternFields formData={formData} handleChange={handleChange} />
          )}

          {role === 'employee' && (
            <EmployeeFields formData={formData} handleChange={handleChange} />
          )}

          {role === 'hr' && (
            <HRFields formData={formData} handleChange={handleChange} />
          )}

          <button 
            type="submit" 
            className="btn-primary"
            disabled={loading}
            data-testid="signup-button"
          >
            {loading ? <span className="spinner"></span> : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
};

// Role-specific form components
const InternFields = ({ formData, handleChange }) => (
  <div className="role-specific-fields">
    <h3 className="section-title">Intern Information</h3>
    <div className="form-row">
      <div className="form-group">
        <label htmlFor="educational_institution">Educational Institution *</label>
        <input
          id="educational_institution"
          name="educational_institution"
          type="text"
          value={formData.educational_institution || ''}
          onChange={handleChange}
          required
          placeholder="University/College name"
          data-testid="institution-input"
        />
      </div>
      <div className="form-group">
        <label htmlFor="current_year_semester">Current Year/Semester *</label>
        <input
          id="current_year_semester"
          name="current_year_semester"
          type="text"
          value={formData.current_year_semester || ''}
          onChange={handleChange}
          required
          placeholder="e.g., 3rd Year, 5th Semester"
          data-testid="year-input"
        />
      </div>
    </div>
    <div className="form-row">
      <div className="form-group">
        <label htmlFor="major_field_of_study">Major/Field of Study *</label>
        <input
          id="major_field_of_study"
          name="major_field_of_study"
          type="text"
          value={formData.major_field_of_study || ''}
          onChange={handleChange}
          required
          placeholder="Computer Science, Business, etc."
          data-testid="major-input"
        />
      </div>
      <div className="form-group">
        <label htmlFor="area_of_interest">Area of Interest *</label>
        <input
          id="area_of_interest"
          name="area_of_interest"
          type="text"
          value={formData.area_of_interest || ''}
          onChange={handleChange}
          required
          placeholder="Web Dev, Marketing, Design, etc."
          data-testid="interest-input"
        />
      </div>
    </div>
    <div className="form-row">
      <div className="form-group">
        <label htmlFor="internship_start_date">Internship Start Date *</label>
        <input
          id="internship_start_date"
          name="internship_start_date"
          type="date"
          value={formData.internship_start_date || ''}
          onChange={handleChange}
          required
          data-testid="start-date-input"
        />
      </div>
      <div className="form-group">
        <label htmlFor="internship_end_date">Internship End Date *</label>
        <input
          id="internship_end_date"
          name="internship_end_date"
          type="date"
          value={formData.internship_end_date || ''}
          onChange={handleChange}
          required
          data-testid="end-date-input"
        />
      </div>
    </div>
  </div>
);

const EmployeeFields = ({ formData, handleChange }) => (
  <div className="role-specific-fields">
    <h3 className="section-title">Employee Information</h3>
    <div className="form-row">
      <div className="form-group">
        <label htmlFor="department">Department *</label>
        <input
          id="department"
          name="department"
          type="text"
          value={formData.department || ''}
          onChange={handleChange}
          required
          placeholder="Engineering, Sales, HR, etc."
          data-testid="department-input"
        />
      </div>
      <div className="form-group">
        <label htmlFor="designation">Designation/Job Title *</label>
        <input
          id="designation"
          name="designation"
          type="text"
          value={formData.designation || ''}
          onChange={handleChange}
          required
          placeholder="Senior Developer, Manager, etc."
          data-testid="designation-input"
        />
      </div>
    </div>
    <div className="form-row">
      <div className="form-group">
        <label htmlFor="joining_date">Joining Date *</label>
        <input
          id="joining_date"
          name="joining_date"
          type="date"
          value={formData.joining_date || ''}
          onChange={handleChange}
          required
          data-testid="joining-date-input"
        />
      </div>
      <div className="form-group">
        <label htmlFor="skills_expertise">Skills & Expertise *</label>
        <input
          id="skills_expertise"
          name="skills_expertise"
          type="text"
          value={formData.skills_expertise || ''}
          onChange={handleChange}
          required
          placeholder="React, Node.js, Project Management, etc."
          data-testid="skills-input"
        />
      </div>
    </div>
  </div>
);

const HRFields = ({ formData, handleChange }) => (
  <div className="role-specific-fields">
    <h3 className="section-title">HR Manager Information</h3>
    <div className="form-row">
      <div className="form-group">
        <label htmlFor="hr_access_level">HR Access Level *</label>
        <select
          id="hr_access_level"
          name="hr_access_level"
          value={formData.hr_access_level || ''}
          onChange={handleChange}
          required
          data-testid="access-level-select"
        >
          <option value="">Select Access Level</option>
          <option value="View Only">View Only</option>
          <option value="Edit Specific">Edit Specific</option>
          <option value="Edit All">Edit All</option>
          <option value="Super Admin">Super Admin</option>
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="departments_overseen">Departments Overseen *</label>
        <input
          id="departments_overseen"
          name="departments_overseen"
          type="text"
          value={formData.departments_overseen || ''}
          onChange={handleChange}
          required
          placeholder="Engineering, Sales, Marketing, etc."
          data-testid="departments-input"
        />
      </div>
    </div>
    <div className="form-row">
      <div className="form-group">
        <label htmlFor="work_experience">Work Experience *</label>
        <input
          id="work_experience"
          name="work_experience"
          type="text"
          value={formData.work_experience || ''}
          onChange={handleChange}
          required
          placeholder="5+ years in HR Management"
          data-testid="experience-input"
        />
      </div>
      <div className="form-group">
        <label htmlFor="office_location">Office Location *</label>
        <input
          id="office_location"
          name="office_location"
          type="text"
          value={formData.office_location || ''}
          onChange={handleChange}
          required
          placeholder="New York HQ, Remote, etc."
          data-testid="location-input"
        />
      </div>
    </div>
    <div className="form-group">
      <label htmlFor="certifications">Certifications</label>
      <input
        id="certifications"
        name="certifications"
        type="text"
        value={formData.certifications || ''}
        onChange={handleChange}
        placeholder="SHRM-CP, PHR, etc."
        data-testid="certifications-input"
      />
    </div>
  </div>
);

export default Signup;