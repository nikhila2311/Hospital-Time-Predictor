import React, { useState, useEffect } from 'react';
import './App.css';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

function App() {
  const [formData, setFormData] = useState({
    arrival_hour: '',
    day_of_week: '',
    doctor_type: '',
    patient_type: '',
  });

  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      setFormData((prev) => ({
        ...prev,
        arrival_hour: prev.arrival_hour || now.getHours().toString()
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getPeakTimeColor = (hour) => {
    const h = parseInt(hour);
    if ((h >= 10 && h <= 13) || (h >= 17 && h <= 19)) return 'red';
    if ((h >= 8 && h < 10) || (h > 13 && h < 17)) return 'orange';
    return 'green';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.arrival_hour || !formData.day_of_week || !formData.doctor_type || !formData.patient_type) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setLoading(true);
    setPrediction(null);

    try {
      const response = await fetch('http://127.0.0.1:8000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      setPrediction(result.predicted_wait_time_minutes);
      setHistory((prev) => [...prev, { ...formData, result: result.predicted_wait_time_minutes }]);
    } catch (err) {
      setError('Could not connect to the backend. Is it running?');
    } finally {
      setLoading(false);
    }
  };

  const avgWaitData = [
    { day: 'Monday', wait: 15 },
    { day: 'Tuesday', wait: 20 },
    { day: 'Wednesday', wait: 18 },
    { day: 'Thursday', wait: 22 },
    { day: 'Friday', wait: 25 },
    { day: 'Saturday', wait: 30 },
    { day: 'Sunday', wait: 12 },
  ];

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🏥 Hospital Wait Time Estimator</h1>
      <p style={styles.timeDisplay}>🕒 Current Time: {currentTime.toLocaleTimeString()}</p>

      <div style={styles.flexLayout}>
        <form style={styles.form} onSubmit={handleSubmit}>
          <label>Arrival Hour (0–23)</label>
          <input
            type="number"
            name="arrival_hour"
            min="0"
            max="23"
            value={formData.arrival_hour}
            onChange={handleChange}
            style={styles.input}
          />
          {formData.arrival_hour && (
            <p style={{ color: getPeakTimeColor(formData.arrival_hour), fontWeight: '500' }}>
              {getPeakTimeColor(formData.arrival_hour) === 'red' && '🔴 Peak hours – expect higher wait times'}
              {getPeakTimeColor(formData.arrival_hour) === 'orange' && '🟡 Moderate hours'}
              {getPeakTimeColor(formData.arrival_hour) === 'green' && '🟢 Off-peak hours – faster service likely'}
            </p>
          )}

          <label>Day of Week</label>
          <select name="day_of_week" value={formData.day_of_week} onChange={handleChange} style={styles.input}>
            <option value="">-- Select Day --</option>
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>

          <label>Doctor Type</label>
          <select name="doctor_type" value={formData.doctor_type} onChange={handleChange} style={styles.input}>
            <option value="">-- Select Doctor Type --</option>
            <option value="ANCHOR">ANCHOR</option>
            <option value="FLOATING">FLOATING</option>
            <option value="LOCUM">LOCUM</option>
          </select>

          <label>Patient Type</label>
          <select name="patient_type" value={formData.patient_type} onChange={handleChange} style={styles.input}>
            <option value="">-- Select Patient Type --</option>
            <option value="OUTPATIENT">OUTPATIENT</option>
            <option value="INPATIENT">INPATIENT</option>
          </select>

          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Predicting...' : 'Predict Wait Time'}
          </button>
        </form>

        <div style={{ flex: 1 }}>
          {prediction !== null && (
            <div style={styles.resultBox}>
              <h2>⏱️ Estimated Wait Time:</h2>
              <p><strong>{prediction} minutes</strong></p>
            </div>
          )}

          <div style={{ marginTop: '30px' }}>
            <h3 style={{ textAlign: 'center', color: '#0d47a1' }}>📊 Average Wait Time Per Day</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={avgWaitData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Bar dataKey="wait" fill="#1976d2" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 🕘 Prediction History */}
          {history.length > 0 && (
            <div style={{ marginTop: '30px' }}>
              <h3 style={{ textAlign: 'center', color: '#6d4c41' }}>📄 Prediction History</h3>
              <ul style={{ fontSize: '14px', paddingLeft: '20px' }}>
                {history.map((item, i) => (
                  <li key={i}>
                    {item.day_of_week}, {item.arrival_hour}:00 — {item.doctor_type}, {item.patient_type} ➜ <b>{item.result} mins</b>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    fontFamily: 'Segoe UI, sans-serif',
    maxWidth: '1100px',
    margin: '40px auto',
    padding: '30px',
    borderRadius: '16px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
    backgroundColor: '#ffffff',
    color: '#000000',
  },
  title: {
    fontWeight: 'bold',
    fontSize: '26px',
    textAlign: 'center',
    marginBottom: '10px',
  },
  timeDisplay: {
    textAlign: 'center',
    color: '#666',
    fontSize: '14px',
    marginBottom: '25px',
  },
  flexLayout: {
    display: 'flex',
    gap: '40px',
    alignItems: 'flex-start',
  },
  form: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  input: {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #90caf9',
    fontSize: '16px',
    backgroundColor: '#f1f8ff',
    outlineColor: '#42a5f5',
    color:'black'
  },
  button: {
    padding: '14px',
    backgroundColor: '#1976d2',
    color: '#ffffff',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: '0.3s',
  },
  resultBox: {
    marginTop: '20px',
    padding: '20px',
    border: '2px solid #64b5f6',
    borderRadius: '10px',
    backgroundColor: '#e3f2fd',
    textAlign: 'center',
    color: '#0d47a1',
  },
  error: {
    color: '#d32f2f',
    textAlign: 'center',
    fontWeight: '500',
  },
};

export default App;
