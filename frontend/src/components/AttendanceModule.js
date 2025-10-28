import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AttendanceModule = ({ user, token }) => {
  const [attendance, setAttendance] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    start_date: '',
    end_date: '',
    reason: '',
    leave_type: 'Casual'
  });

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [attendanceRes, leavesRes] = await Promise.all([
        axios.get(`${API}/attendance/overview/${user.id}`, { headers }),
        axios.get(`${API}/attendance/leaves/${user.id}`, { headers })
      ]);
      setAttendance(attendanceRes.data);
      setLeaves(leavesRes.data);
      
      // Check if already checked in today
      const today = new Date().toISOString().split('T')[0];
      const todayRecord = attendanceRes.data.attendance_records?.find(r => r.date === today);
      setIsCheckedIn(todayRecord && todayRecord.check_in && !todayRecord.check_out);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API}/attendance/checkin`, {}, { headers });
      alert('Checked in successfully!');
      setIsCheckedIn(true);
      fetchAttendanceData();
    } catch (error) {
      alert(error.response?.data?.detail || 'Check-in failed');
    }
  };

  const handleCheckOut = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.post(`${API}/attendance/checkout`, {}, { headers });
      alert(`Checked out successfully! Hours worked: ${response.data.hours_worked}`);
      setIsCheckedIn(false);
      fetchAttendanceData();
    } catch (error) {
      alert(error.response?.data?.detail || 'Check-out failed');
    }
  };

  const applyLeave = async () => {
    if (!leaveForm.start_date || !leaveForm.end_date || !leaveForm.reason) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API}/attendance/leave/apply`, leaveForm, { headers });
      alert('Leave application submitted successfully!');
      setLeaveForm({ start_date: '', end_date: '', reason: '', leave_type: 'Casual' });
      fetchAttendanceData();
    } catch (error) {
      alert('Failed to apply for leave');
    }
  };

  if (loading) {
    return <div>Loading attendance data...</div>;
  }

  return (
    <div className="attendance-module">
      <h2>⏱ Time & Attendance</h2>

      {/* Check In/Out */}
      <div className="checkin-card" data-testid="checkin-section">
        <h3>Daily Check-In / Check-Out</h3>
        <div className="checkin-actions">
          <button 
            onClick={handleCheckIn} 
            disabled={isCheckedIn}
            className="btn-checkin"
            data-testid="checkin-button"
          >
            {isCheckedIn ? '✓ Checked In' : 'Check In'}
          </button>
          <button 
            onClick={handleCheckOut} 
            disabled={!isCheckedIn}
            className="btn-checkout"
            data-testid="checkout-button"
          >
            Check Out
          </button>
        </div>
        <p className="checkin-time">
          {isCheckedIn ? `Checked in at ${new Date().toLocaleTimeString()}` : 'Not checked in today'}
        </p>
      </div>

      {/* Attendance Overview */}
      {attendance && (
        <div className="attendance-overview" data-testid="attendance-overview">
          <h3>📊 Attendance Overview</h3>
          <div className="stats-row">
            <div className="stat-box">
              <span className="stat-label">Present Days</span>
              <span className="stat-value" data-testid="present-days">{attendance.present_days}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Leave Taken</span>
              <span className="stat-value" data-testid="leave-taken">{attendance.leave_taken}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Total Hours</span>
              <span className="stat-value" data-testid="total-hours">{attendance.total_hours}h</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Attendance %</span>
              <span className="stat-value" data-testid="attendance-percentage">{attendance.attendance_percentage}%</span>
            </div>
          </div>

          {/* Attendance Chart */}
          {attendance.attendance_records && attendance.attendance_records.length > 0 && (
            <div className="attendance-chart">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={attendance.attendance_records.slice(-7)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="hours_worked" stroke="#3b82f6" name="Hours Worked" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Apply for Leave */}
      <div className="leave-apply-card" data-testid="leave-apply-section">
        <h3>📝 Apply for Leave</h3>
        <div className="leave-form">
          <div className="form-row">
            <div className="form-group">
              <label>Start Date</label>
              <input
                type="date"
                value={leaveForm.start_date}
                onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })}
                data-testid="leave-start-date"
              />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input
                type="date"
                value={leaveForm.end_date}
                onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })}
                data-testid="leave-end-date"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Leave Type</label>
            <select
              value={leaveForm.leave_type}
              onChange={(e) => setLeaveForm({ ...leaveForm, leave_type: e.target.value })}
              data-testid="leave-type-select"
            >
              <option value="Casual">Casual Leave</option>
              <option value="Sick">Sick Leave</option>
              <option value="Vacation">Vacation Leave</option>
            </select>
          </div>
          <div className="form-group">
            <label>Reason</label>
            <textarea
              value={leaveForm.reason}
              onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
              rows="3"
              placeholder="Enter reason for leave..."
              data-testid="leave-reason"
            />
          </div>
          <button onClick={applyLeave} className="btn-apply" data-testid="apply-leave-button">Apply for Leave</button>
        </div>
      </div>

      {/* Leave History */}
      <div className="leave-history-card" data-testid="leave-history">
        <h3>📅 Leave History</h3>
        {leaves.length > 0 ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Reason</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((leave, index) => (
                  <tr key={index}>
                    <td>{leave.leave_type}</td>
                    <td>{new Date(leave.start_date).toLocaleDateString()}</td>
                    <td>{new Date(leave.end_date).toLocaleDateString()}</td>
                    <td>{leave.reason}</td>
                    <td>
                      <span className={`status-badge ${leave.status.toLowerCase()}`}>
                        {leave.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No leave applications yet.</p>
        )}
      </div>
    </div>
  );
};

export default AttendanceModule;