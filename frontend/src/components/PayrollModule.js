import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PayrollModule = ({ user, token }) => {
  const [payroll, setPayroll] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayroll();
  }, []);

  const fetchPayroll = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API}/payroll/${user.id}`, { headers });
      // Check if response has data property or is direct data
      setPayroll(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching payroll:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading payroll information...</div>;
  }

  if (!payroll || !payroll.id) {
    return (
      <div className="payroll-empty">
        <p>No payroll information available yet.</p>
        <p>Please contact HR for more details.</p>
      </div>
    );
  }

  return (
    <div className="payroll-module">
      <h2>💰 Payroll & Compensation</h2>

      {/* Salary Details */}
      <div className="salary-card" data-testid="salary-details">
        <h3>Salary Information</h3>
        <div className="salary-info">
          <div className="info-item">
            <span className="label">Type:</span>
            <span className="value">{payroll.salary_type}</span>
          </div>
          <div className="info-item">
            <span className="label">Amount:</span>
            <span className="value amount">₹{(payroll.amount * 82.5).toLocaleString('en-IN')}</span>
          </div>
          <div className="info-item">
            <span className="label">Payment Schedule:</span>
            <span className="value">{payroll.payment_schedule}</span>
          </div>
          <div className="info-item">
            <span className="label">Bank Account:</span>
            <span className="value">****{payroll.bank_account.slice(-4)}</span>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="payment-history-card" data-testid="payment-history">
        <h3>🗓 Payment History</h3>
        {payroll.payment_history && payroll.payment_history.length > 0 ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Payment Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {payroll.payment_history.map((payment, index) => (
                  <tr key={index}>
                    <td>{new Date(payment.payment_date).toLocaleDateString()}</td>
                    <td>${payment.amount}</td>
                    <td>
                      <span className={`status-badge ${payment.status.toLowerCase()}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td>
                      {payment.slip_url ? (
                        <button className="btn-download">Download Slip</button>
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No payment history available.</p>
        )}
      </div>
    </div>
  );
};

export default PayrollModule;