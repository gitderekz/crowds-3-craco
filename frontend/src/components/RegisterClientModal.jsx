import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../pages/Auth.css';

const Register = ({onClose}) => {

  const [isLogin, setIsLogin] = useState(false); // Toggle between login and register
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('visitor');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('accessToken');
  const userRole = localStorage.getItem('user')!==null?JSON.parse(localStorage.getItem('user'))?.role:null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isLogin ? 'login' : 'register-client';
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/${endpoint}`, {
        username,
        email,
        password,
        role: isLogin ? undefined : role, // Only include role for registration
      });
    //   localStorage.setItem('userId', response.data.userId);
    //   localStorage.setItem('token', response.data.token);
    //   localStorage.setItem('role', response.data.role);
      onClose(); // Close the modal after successful login/register
      window.location.reload(); // Refresh the page to update the header
    } catch (error) {
      setError(isLogin ? 'Invalid credentials' : 'Registration failed');
    }
  };

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal">
        <button className="close-button" onClick={onClose}>
          &times;
        </button>
        <h1>{isLogin ? 'Login' : 'Register a client'}</h1>
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
            type="text"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {!isLogin && (
            <select value={role} onChange={(e) => setRole(e.target.value)} className='selection'>
              <option value="visitor">Visitor</option>
              <option value="publisher">Publisher</option>
            </select>
          )}
          <button type="submit">{isLogin ? 'Login' : 'Register'}</button>
        </form>
        {/* <p>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span className="toggle-link" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Register here' : 'Login here'}
          </span>
        </p> */}
      </div>
    </div>
  );
};

export default Register;