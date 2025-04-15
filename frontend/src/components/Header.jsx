import React, { useState, useContext, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ThemeContext } from '../App';
import ThemeToggle from './ThemeToggle';
import CategoryFilter from './CategoryFilter';
import { FaHome, FaUpload, FaUser, FaUsers, FaPalette, FaCog } from 'react-icons/fa';
import AuthModal from './AuthModal'; // Import the new AuthModal component
import SettingsModal from './SettingsModal'; // Import the new AuthModal component
import RegisterClientModal from './RegisterClientModal'; // Import the new RegisterClientModal component
import axios from 'axios';
import { api, clearTokens } from '../services/authService';
import useAuth from '../hooks/useAuth';

const Header = ({ onSearch, setIsSearching, setActiveCategoryName }) => {
  const { theme } = useContext(ThemeContext);
  const { isAuthenticated, user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false); // State for AuthModal
  const [isRegisterClientModalOpen, setIsRegisterClientModalOpen] = useState(false); // State for AuthModal
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false); // State for color picker
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('accessToken'));
  const [userRole, setUserRole] = useState(localStorage.getItem('user')!==null?JSON.parse(localStorage.getItem('user'))?.role:null);
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('user')));
  // Ref for the dropdown container
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null); 
  const colorPickerRef = useRef(null);

  // Color options
  const colorOptions = [
    '#4fd1c5', // Teal
    '#4CAF50', // Green
    '#009688', // Teal Green
    '#2196F3', // Blue
    '#644ccc', // Purple
    '#FF5722', // Orange
    '#ff8da1', // Pink
    '#FFEB3B', // Yellow
    '#ae2a2a', // Red
    '#56084a'  // Dark Purple
  ];

  // Set primary color function
  const setPrimaryColor = (color) => {
    document.documentElement.style.setProperty('--primary-color', color);
    localStorage.setItem('primaryColor', color); // Save to localStorage
    setIsColorPickerOpen(false);
  };

  // Load saved color on component mount
  useEffect(() => {
    const savedColor = localStorage.getItem('primaryColor');
    if (savedColor) {
      document.documentElement.style.setProperty('--primary-color', savedColor);
    }
  }, []);

  // Handle clicks outside dropdown and color picker
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target)) {
        setIsColorPickerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  // Check token validity on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const validatedUser = await axios.get(`${process.env.REACT_APP_API_URL}/auth/validate`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          // Token is valid
          if (validatedUser?.data) {
            console.log('validatedUser = ',validatedUser.data);
            setIsLoggedIn(true);
            setUserRole(localStorage.getItem('user')!==null?JSON.parse(localStorage.getItem('user'))?.role:null);
            setCurrentUser(JSON.parse(localStorage.getItem('user')));           
          }
        } catch (error) {
          // Token is invalid or expired
          handleLogout();
        }
      }
    };
    checkAuth();
  }, []);


  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query); // ✅ Update state
    setIsSearching(query.trim() !== '');
    onSearch(query); // Pass the search query to the parent component
  };

  const clearSearch = () => {
    setSearchQuery(''); // <-- Reset state properly
    setIsSearching(false); // Reset search state
    onSearch(''); // Notify parent component

    if (searchInputRef.current) {
      searchInputRef.current.value = ''; // <-- Ensure input field clears
    }
  };

  // Handle clicks outside the dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false); // Close the dropdown
      }
    };

    // Add event listener when the dropdown is open
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Cleanup the event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // const handleLogout = () => {
  //   clearSearch();
  //   localStorage.removeItem('accessToken');
  //   localStorage.removeItem('refreshToken');
  //   localStorage.removeItem('role');
  //   localStorage.removeItem('userId');
  //   localStorage.removeItem('user');
  //   setIsLoggedIn(false);
  //   setUserRole(null);
  //   setCurrentUser(null);
  //   navigate('/');
  //   // navigate('/login');
  // };

  const handleLogout = async () => {
    await logout();
    clearSearch();
    navigate('/');
  };

  const registerClient = () => {
    setIsRegisterClientModalOpen(true);
  };

  const goHome = () => {
    navigate('/');
  };

  const handleLinkClick = (e, destination) => {
    e.preventDefault(); // Prevent default Link navigation
    
    clearSearch(); // Clear the search input
    navigate(destination); // Manually navigate to the target link
  };

  return (
    <header className={`header ${theme}`}>
      <div className="header-top">
        <div className="search-bar">
          <Link
            onClick={(e) => handleLinkClick(e, '/')}
            className={`home-button ${theme}`}
          >
            <span>Home</span> <FaHome className="fa-home" />
          </Link>
          <input
            ref={searchInputRef} // <-- Attach ref to input
            type="text"
            placeholder="Search photos..."
            value={searchQuery}
            onChange={handleSearch}
          />

          {isAuthenticated && user?.role === 'publisher' && (
            <>
              <Link
                onClick={(e) => handleLinkClick(e, '/users')}
                className="users-icon"
              >
                <FaUsers className="fa-users" /> Users
              </Link>
              <Link
                onClick={(e) => handleLinkClick(e, '/upload')}
                className="upload-icon"
              >
                <FaUpload className="fa-upload" /> Upload
              </Link>
            </>
          )}
        </div>
        <div className="header-icons">
          {/* Color Picker Button */}
          <div className="color-picker-container" ref={colorPickerRef}>
            <button 
              className="color-picker-button"
              onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
              aria-label="Change theme color"
            >
              <FaPalette className="color-picker-icon" />
            </button>
            
            {isColorPickerOpen && (
              <div className="color-picker-dropdown">
                <div className="color-options">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      className="color-option"
                      style={{ backgroundColor: color }}
                      onClick={() => setPrimaryColor(color)}
                      aria-label={`Set color to ${color}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {isAuthenticated && (
            <Link 
              onClick={() => setIsSettingsModalOpen(true)}
              className="settings-icon"
            >
              <FaCog className=""/> Settings
            </Link>
          )}

          <ThemeToggle />
          <div
            className="user-icon"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            ref={dropdownRef} // Attach the ref to the dropdown container
          >
            {isAuthenticated ? (
            <img 
              // src={`${process.env.REACT_APP_API_URL.replace('/api', '')}${user?.avatar}` || `${process.env.REACT_APP_API_URL.replace('/api', '')}/uploads/default-avatar.jpg`} 
              src={`${process.env.REACT_APP_API_URL.replace('/api', '')}${user?.avatar??"/uploads/avatar/default-avatar.png"}`} 
              alt={user?.username} 
              className="user-avatar" 
            />
          ) : (
            <FaUser className="fa-user" />
          )}
          {isAuthenticated && user?.username}
            {/* {isDropdownOpen && (
              <div className="dropdown">
                {isLoggedIn ? (
                  <button onClick={handleLogout}>Logout</button>
                ) : (
                  <>
                    <Link to="/login">Login</Link>
                    <Link to="/register">Register</Link>
                  </>
                )}
              </div>
            )} */}
            {isDropdownOpen && (
              <div className="dropdown">
                {isLoggedIn ? (
                  userRole === 'publisher' ? (
                    <>
                      <button onClick={() => setIsRegisterClientModalOpen(true)}>Register Client</button>
                      <button onClick={handleLogout}>Logout</button>
                    </>
                  ) : (
                    <button onClick={handleLogout}>Logout</button>
                  )
                ) : (
                  <button onClick={() => setIsAuthModalOpen(true)}>Login/Register</button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <CategoryFilter clearSearch={clearSearch} setActiveCategoryName={setActiveCategoryName}/>
      {/* Auth Modal */}
      {isAuthModalOpen && (
        <AuthModal 
          onClose={() => setIsAuthModalOpen(false)}
          onLoginSuccess={() => {
            setIsLoggedIn(true);
            setUserRole(localStorage.getItem('user')!==null?JSON.parse(localStorage.getItem('user'))?.role:null);
            setCurrentUser(JSON.parse(localStorage.getItem('user')));
          }}
        />
      )}
      {/* Register Client Modal */}
      {isRegisterClientModalOpen && (
        <RegisterClientModal onClose={() => setIsRegisterClientModalOpen(false)} />
      )}
      {/* Settings modal */}
      {isSettingsModalOpen && (
        <SettingsModal 
          onClose={() => setIsSettingsModalOpen(false)}
          userId={user?.id}
        />
      )}
    </header>
  );
};

export default Header;