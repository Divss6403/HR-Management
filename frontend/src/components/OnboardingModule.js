import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const OnboardingModule = ({ user, token }) => {
  const [onboarding, setOnboarding] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOnboarding();
  }, []);

  const fetchOnboarding = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API}/onboarding/${user.id}`, { headers });
      setOnboarding(response.data);
    } catch (error) {
      console.error('Error fetching onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading onboarding information...</div>;
  }

  if (!onboarding || !onboarding.data) {
    return (
      <div className="onboarding-empty">
        <p>No onboarding information available yet.</p>
        <p>Please contact HR for more details.</p>
      </div>
    );
  }

  return (
    <div className="onboarding-module">
      <h2>Recruitment & Onboarding</h2>

      {/* Application Status */}
      <div className="status-card" data-testid="application-status">
        <h3>📋 Application Status</h3>
        <div className={`status-badge ${onboarding.application_status.toLowerCase().replace(' ', '-')}`}>
          {onboarding.application_status}
        </div>
      </div>

      {/* Welcome Message */}
      {onboarding.welcome_message && (
        <div className="welcome-card" data-testid="welcome-message">
          <h3>👋 Welcome Message</h3>
          <p>{onboarding.welcome_message}</p>
          <p><strong>HR Contact:</strong> {onboarding.hr_contact}</p>
        </div>
      )}

      {/* Onboarding Checklist */}
      <div className="checklist-card" data-testid="onboarding-checklist">
        <h3>📝 Onboarding Checklist</h3>
        <ul className="checklist">
          {onboarding.onboarding_checklist && onboarding.onboarding_checklist.map((item, index) => (
            <li key={index} className={item.completed ? 'completed' : ''}>
              <input type="checkbox" checked={item.completed} readOnly />
              <span>{item.item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Background Verification */}
      <div className="verification-card" data-testid="background-verification">
        <h3>🔍 Background Verification Status</h3>
        <div className={`status-badge ${onboarding.background_verification.toLowerCase()}`}>
          {onboarding.background_verification}
        </div>
      </div>

      {/* Documents Submitted */}
      <div className="documents-card" data-testid="documents-submitted">
        <h3>📄 Documents Submitted</h3>
        {onboarding.documents_submitted && onboarding.documents_submitted.length > 0 ? (
          <ul>
            {onboarding.documents_submitted.map((doc, index) => (
              <li key={index}>{doc.name} - {doc.status}</li>
            ))}
          </ul>
        ) : (
          <p>No documents submitted yet.</p>
        )}
      </div>
    </div>
  );
};

export default OnboardingModule;