import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PerformanceModule = ({ user, token }) => {
  const [goals, setGoals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState({ title: '', description: '', due_date: '', priority: 'Medium' });
  const [newFeedback, setNewFeedback] = useState({ content: '', rating: 5 });

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const fetchPerformanceData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [goalsRes, tasksRes, feedbackRes] = await Promise.all([
        axios.get(`${API}/performance/goals/${user.id}`, { headers }),
        axios.get(`${API}/performance/tasks/${user.id}`, { headers }),
        axios.get(`${API}/performance/feedback/${user.id}`, { headers })
      ]);
      setGoals(goalsRes.data);
      setTasks(tasksRes.data);
      setFeedback(feedbackRes.data);
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async () => {
    if (!newTask.title || !newTask.due_date) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API}/performance/task/create`, {
        ...newTask,
        user_id: user.id
      }, { headers });
      setNewTask({ title: '', description: '', due_date: '', priority: 'Medium' });
      fetchPerformanceData();
    } catch (error) {
      alert('Failed to create task');
    }
  };

  const submitFeedback = async () => {
    if (!newFeedback.content) {
      alert('Please enter feedback content');
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API}/performance/feedback/create`, {
        ...newFeedback,
        user_id: user.id,
        feedback_type: 'Self-Review'
      }, { headers });
      setNewFeedback({ content: '', rating: 5 });
      fetchPerformanceData();
    } catch (error) {
      alert('Failed to submit feedback');
    }
  };

  const updateTaskStatus = async (taskId, status) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(`${API}/performance/task/update/${taskId}`, { status }, { headers });
      fetchPerformanceData();
    } catch (error) {
      alert('Failed to update task');
    }
  };

  if (loading) {
    return <div>Loading performance data...</div>;
  }

  const taskStats = [
    { name: 'Pending', value: tasks.filter(t => t.status === 'Pending').length },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'In Progress').length },
    { name: 'Completed', value: tasks.filter(t => t.status === 'Completed').length }
  ];

  return (
    <div className="performance-module">
      <h2>📈 Performance Management</h2>

      {/* Goals Section */}
      <div className="goals-card" data-testid="goals-section">
        <h3>🎯 Goals & KPIs</h3>
        {goals.length > 0 ? (
          <div className="goals-list">
            {goals.map((goal, index) => (
              <div key={index} className="goal-item">
                <h4>{goal.title}</h4>
                <p>{goal.description}</p>
                <div className="goal-meta">
                  <span>Target: {new Date(goal.target_date).toLocaleDateString()}</span>
                  <span className={`status-badge ${goal.status.toLowerCase().replace(' ', '-')}`}>
                    {goal.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No goals set yet.</p>
        )}
      </div>

      {/* Task Tracker */}
      <div className="tasks-card" data-testid="tasks-section">
        <h3>🗓 Task Tracker</h3>
        
        {/* Add New Task */}
        <div className="add-task-form">
          <input
            type="text"
            placeholder="Task title"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            data-testid="task-title-input"
          />
          <input
            type="date"
            value={newTask.due_date}
            onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
            data-testid="task-date-input"
          />
          <select
            value={newTask.priority}
            onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
            data-testid="task-priority-select"
          >
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <button onClick={addTask} className="btn-add" data-testid="add-task-button">Add Task</button>
        </div>

        {/* Task List */}
        {tasks.length > 0 ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Due Date</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task, index) => (
                  <tr key={index}>
                    <td>{task.title}</td>
                    <td>{new Date(task.due_date).toLocaleDateString()}</td>
                    <td><span className={`priority-badge ${task.priority.toLowerCase()}`}>{task.priority}</span></td>
                    <td><span className={`status-badge ${task.status.toLowerCase().replace(' ', '-')}`}>{task.status}</span></td>
                    <td>
                      {task.status !== 'Completed' && (
                        <button 
                          onClick={() => updateTaskStatus(task.id, 'Completed')}
                          className="btn-complete"
                        >
                          Complete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No tasks yet.</p>
        )}

        {/* Task Stats Chart */}
        <div className="task-stats">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={taskStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Feedback Section */}
      <div className="feedback-card" data-testid="feedback-section">
        <h3>📋 Feedback</h3>
        
        {/* Self-Review Form */}
        <div className="feedback-form">
          <h4>Self-Review</h4>
          <textarea
            placeholder="Write your self-review..."
            value={newFeedback.content}
            onChange={(e) => setNewFeedback({ ...newFeedback, content: e.target.value })}
            rows="4"
            data-testid="feedback-textarea"
          />
          <div className="rating-input">
            <label>Rating (1-10):</label>
            <input
              type="number"
              min="1"
              max="10"
              value={newFeedback.rating}
              onChange={(e) => setNewFeedback({ ...newFeedback, rating: parseInt(e.target.value) })}
              data-testid="feedback-rating-input"
            />
          </div>
          <button onClick={submitFeedback} className="btn-submit" data-testid="submit-feedback-button">Submit Feedback</button>
        </div>

        {/* Feedback History */}
        <div className="feedback-history">
          <h4>Feedback History</h4>
          {feedback.length > 0 ? (
            <div className="feedback-list">
              {feedback.map((fb, index) => (
                <div key={index} className="feedback-item">
                  <div className="feedback-header">
                    <span className="feedback-type">{fb.feedback_type}</span>
                    {fb.rating && <span className="feedback-rating">⭐ {fb.rating}/10</span>}
                  </div>
                  <p>{fb.content}</p>
                  <small>{new Date(fb.created_at).toLocaleDateString()}</small>
                </div>
              ))}
            </div>
          ) : (
            <p>No feedback yet.</p>
          )}
        </div>

        {/* Performance Score */}
        <div className="performance-score" data-testid="performance-score">
          <h4>🌟 Performance Score</h4>
          <div className="score-circle">
            <span className="score-value">85%</span>
            <span className="score-label">Overall Performance</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceModule;