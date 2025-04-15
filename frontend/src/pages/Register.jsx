import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Auth.css'; // New CSS file for auth pages

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('visitor');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/register`, { username, password, role });
      localStorage.setItem('userId', response.data.userId);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('role', response.data.role);
      navigate('/');
    } catch (error) {
      setError('Registration failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Register</h1>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {/* Role selection only visible to publishers */}
          {localStorage.getItem('user')!==null?JSON.parse(localStorage.getItem('user'))?.role:null === 'publisher' && (
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="visitor">Visitor</option>
              <option value="publisher">Publisher</option>
            </select>
          )}
          <button type="submit">Register</button>
        </form>
      </div>
    </div>
  );
};

export default Register;