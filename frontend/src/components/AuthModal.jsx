import React, { useState, useRef, useContext } from 'react';
import { api, storeTokens } from '../services/authService';
import '../pages/Auth.css';
import { ThemeContext } from '../App';

const AuthModal = ({ onClose, onLoginSuccess }) => {
  const { theme } = useContext(ThemeContext);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'visitor'
  });
  const [error, setError] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setAvatar(e.target.files?.[0] || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Validate password confirmation
      if (!isLogin && formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      const formPayload = new FormData();
      
      // Add all form fields except confirmPassword
      const { confirmPassword, ...registrationData } = formData;
      for (const [key, value] of Object.entries(registrationData)) {
        formPayload.append(key, value);
      }
      
      // Add the avatar file if it exists
      if (avatar) {
        formPayload.append('avatar', avatar);
      }

      // Debug what's being sent
      for (let [key, value] of formPayload.entries()) {
        console.log(key, value);
      }

      const endpoint = isLogin ? 'login' : 'register';
      const response = await api.post(`/auth/${endpoint}`, formPayload, isLogin?'':{
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        transformRequest: (data) => data
      });

      // Store tokens and user data
      storeTokens(response.data.accessToken, response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      onLoginSuccess();
      onClose();
      window.location.reload();
    } catch (error) {
      setError(error.response?.data?.message || error.message || 
              (isLogin ? 'Invalid credentials' : 'Registration failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-modal-overlay">
      <div className={`auth-modal ${theme}`}>
        <button className="close-button" onClick={onClose}>
          &times;
        </button>
        <div className={`register-card ${theme}`}>
          {error && <p className="error">{error}</p>}
          <h2 className="register-title">{isLogin ? 'Login' : 'Register'} Here</h2>

          <div className={`social-icons ${theme}`}>
            <div className="icon-circle">f</div>
            <div className="icon-circle">t</div>
            <div className="icon-circle">g</div>
          </div>

          <form onSubmit={handleSubmit} className="register-form" encType="multipart/form-data">
            {!isLogin && (
              <>
                <div className="input-group">
                  <span className="input-icon">👤</span>
                  <input 
                    type="text" 
                    name="username"
                    placeholder="Username" 
                    value={formData.username} 
                    onChange={handleChange} 
                    className="input-field" 
                    style={{
                      border: 'none',
                      flex: "1",
                      fontSize: "0.9rem"
                    }} 
                    required
                  />
                </div>
                <div className="input-group">
                  <span className="input-icon">✉️</span>
                  <input 
                    type="email" 
                    name="email"
                    placeholder="Email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    className="input-field" 
                    style={{
                      border: 'none',
                      flex: "1",
                      fontSize: "0.9rem"
                    }}  
                    required
                  />
                </div>
                <div className="input-group">
                  <span className="input-icon">👥</span>
                  <select 
                    name="role"
                    value={formData.role} 
                    onChange={handleChange} 
                    className="select-field" 
                    style={{
                      border: 'none',
                      flex: "1",
                      fontSize: "0.9rem",
                      padding: "0.25rem 0"
                    }}
                  >
                    <option value="visitor">Visitor</option>
                    <option value="publisher">Publisher</option>
                  </select>
                </div>
                <div className="input-group">
                  <span className="input-icon">🖼️</span>
                  <input 
                    type="file" 
                    name="avatar"
                    accept="image/*" 
                    className="file-field"  
                    placeholder='Choose Photo'
                    style={{
                      border: 'none',
                      flex: "1",
                      fontSize: "0.9rem",
                      padding: "0.25rem 0"
                    }} 
                    onChange={handleFileChange}
                    ref={fileInputRef}
                  />
                  {avatar && (
                    <div className="avatar-preview">
                      <img 
                        src={URL.createObjectURL(avatar)} 
                        alt="Avatar preview" 
                        style={{
                          width: '50px', 
                          height: '50px', 
                          borderRadius: '50%'
                        }}
                      />
                      <button 
                        type="button" 
                        onClick={() => {
                          setAvatar(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="remove-avatar"
                        style={{
                          position: "absolute",
                          top: "-10px",
                          right: "-10px",
                          background: "red",
                          color: "white",
                          border: "none",
                          borderRadius: "50%",
                          width: "20px",
                          height: "20px",
                          fontSize: "12px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
            
            {isLogin && (
              <div className="input-group">
                <span className="input-icon">👤</span>
                <input 
                  type="text" 
                  name="username"
                  placeholder="Username / Email" 
                  value={formData.username} 
                  onChange={handleChange} 
                  className="input-field" 
                  style={{
                    border: 'none',
                    flex: "1",
                    fontSize: "0.9rem"
                  }}  
                  required
                />
              </div>
            )}
            
            <div className="input-group">
              <span className="input-icon">🔒</span>
              <input 
                type="password" 
                name="password"
                placeholder="Password" 
                value={formData.password} 
                onChange={handleChange} 
                className="input-field" 
                style={{
                  border: 'none',
                  flex: "1",
                  fontSize: "0.9rem"
                }}  
                required
              />
            </div>

            {!isLogin && (
              <div className="input-group">
                <span className="input-icon">🔒</span>
                <input 
                  type="password" 
                  name="confirmPassword"
                  placeholder="Confirm Password" 
                  value={formData.confirmPassword} 
                  onChange={handleChange} 
                  className="input-field" 
                  style={{
                    border: 'none',
                    flex: "1",
                    fontSize: "0.9rem"
                  }}  
                  required
                />
              </div>
            )}
            
            <button 
              type="submit" 
              className="register-button" 
              style={{
                borderRadius: "20px"
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
            </button>
          </form>
          
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span className="toggle-link" onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? 'Register here' : 'Login here'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;