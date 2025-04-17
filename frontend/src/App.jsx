// frontend/src/app.jsx (updated)
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Photos from './pages/Photos';
import Upload from './pages/Upload';
import Users from './pages/Users';
import Register from './pages/Register';
import './App.css';
import './theme.css';
import SponsorRow from './components/SponsorRow';
import { api, publicApi, getRefreshToken, setupTokenRefresh } from './services/authService';
import useAuth from './hooks/useAuth';
import io from 'socket.io-client';
import NotificationBell from './components/NotificationBell';
import useSound from './hooks/useSound';
import { VideoCallProvider } from './contexts/VideoCallContext';

export const ThemeContext = React.createContext();
export const AuthContext = React.createContext();
export const SocketContext = React.createContext();
export const NotificationContext = React.createContext();

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [photos, setPhotos] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeCategoryName, setActiveCategoryName] = useState('');
  const { isAuthenticated, user } = useAuth();
  const [sponsorPhotos, setSponsorPhotos] = useState([]);
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [incomingCall, setIncomingCall] = useState(null);
  const { 
    playNotification, 
    playGroupChat, 
    playSent,
    playCall
  } = useSound();

  // Initialize socket connection
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      const newSocket = io(process.env.REACT_APP_SOCKET_SERVER, {
        withCredentials: true,
        transports: ['websocket']
      });
      
      newSocket.on('connect', () => {
        console.log('Socket connected');
        newSocket.emit('authenticate', user.id);
      });
      
      newSocket.on('new-notification', (notification) => {
        setNotifications(prev => [...prev, notification]);
        setUnreadCount(prev => prev + 1);
        // Play notification sound
        // const audio = new Audio('./sounds/notification.mp3');
        // audio.play().catch(e => console.log('Audio play failed:', e));
        playNotification();
      });
      
      newSocket.on('incoming-call', (callData) => {
        setIncomingCall(callData);
        // Play ringtone
        // const ringtone = new Audio('./sounds/ringtone.mp3');
        // ringtone.loop = true;
        // ringtone.play().catch(e => console.log('Ringtone play failed:', e));
        playCall();
      });
      
      newSocket.on('user-online', ({ userId }) => {
        // Update online status in your state management
        console.log(`User ${userId} is online`);
      });
      
      newSocket.on('user-offline', ({ userId }) => {
        // Update offline status in your state management
        console.log(`User ${userId} is offline`);
      });
      
      setSocket(newSocket);
      
      return () => {
        newSocket.disconnect();
      };
    }
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (isAuthenticated) {
      setupTokenRefresh();
    }
  }, [isAuthenticated]);

  const fetchPhotos = async () => {
    try {
      const response = await api.get(`/photos/home`);
      setPhotos(response.data);
      fetchSponsorPhotos();
    } catch (error) {
      console.error('Error fetching photos:', error);
    }
  };

  const fetchSponsorPhotos = async () => {
    try {
      const response = await api.get(`/photos/sponsor`);
      setSponsorPhotos(response.data);
    } catch (error) {
      console.error('Error fetching sponsor photos:', error);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const filteredPhotos = photos.filter((photo) =>
    photo.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const markNotificationsAsRead = () => {
    setUnreadCount(0);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <AuthContext.Provider value={{ isAuthenticated, user }}>
        <SocketContext.Provider value={socket}>
          <NotificationContext.Provider value={{ 
            notifications, 
            unreadCount,
            markNotificationsAsRead,
            incomingCall,
            setIncomingCall
          }}>
            <div className={`app ${theme}`}>
              <VideoCallProvider>
                <Router>
                  <Header 
                    onSearch={handleSearch} 
                    setIsSearching={setIsSearching} 
                    setActiveCategoryName={setActiveCategoryName} 
                  />
                  <div className="main-content">
                    <SponsorRow loadedSponsorPhotos={sponsorPhotos}/>
                    {/* <NotificationBell /> */}
                    <Routes>
                      <Route path="/" element={<Home photos={filteredPhotos} />} />
                      <Route path="/photos" element={<Photos filteredPhotos={isSearching?filteredPhotos:null} isSearching={isSearching} activeCategoryName={activeCategoryName} />} />
                      <Route 
                        path="/upload" 
                        element={
                          <ProtectedRoute requiredRole="publisher" >
                            <Upload fetchPhotos={fetchPhotos} fetchSponsorPhotos={fetchSponsorPhotos} />
                          </ProtectedRoute>
                        } 
                      />
                      <Route path="/users" 
                        element={
                          <ProtectedRoute requiredRole="publisher">
                            <Users />
                          </ProtectedRoute>
                        } 
                      />
                      <Route path="/register" element={<Register />} />
                    </Routes>
                  </div>
                  <Footer />
                </Router>
              </VideoCallProvider>
            </div>
          </NotificationContext.Provider>
        </SocketContext.Provider>
      </AuthContext.Provider>
    </ThemeContext.Provider>
  );
}
export default App;