import React, { useState, useEffect} from 'react';
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

export const ThemeContext = React.createContext();
export const AuthContext = React.createContext();

// Add ProtectedRoute component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Or a spinner
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

  useEffect(()=>{
    // Call this when your app initializes
    console.log('isAuthenticated',isAuthenticated);
    if (isAuthenticated) {
      setupTokenRefresh();
    }
  })

  const fetchPhotos = async () => {
    try {
      // const response = await axios.get(`${process.env.REACT_APP_API_URL}/photos/home`);
      const response = await api.get(`/photos/home`);
      setPhotos(response.data);
      console.log('photos',response.data);
      
      fetchSponsorPhotos();
    } catch (error) {
      console.error('Error fetching photos:', error);
    }
  };
  const fetchSponsorPhotos = async () => {
    try {
      // const response = await axios.get(`${process.env.REACT_APP_API_URL}/photos/sponsor`);
      const response = await api.get(`/photos/sponsor`);
      setSponsorPhotos(response.data);
    } catch (error) {
      console.error('Error fetching sponsor photos:', error);
    }
  };
  useEffect(() => {
    fetchPhotos();
    // fetchSponsorPhotos();
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  // Filter photos based on the search query
  const filteredPhotos = photos.filter((photo) =>
    photo.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <AuthContext.Provider value={{ isAuthenticated, user }}>
        <div className={`app ${theme}`}>
          <Router>
            <Header 
              onSearch={handleSearch} 
              setIsSearching={setIsSearching} 
              setActiveCategoryName={setActiveCategoryName} 
            />
            <div className="main-content">
              <SponsorRow loadedSponsorPhotos={sponsorPhotos}/>
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
                  //<ProtectedRoute requiredRole="publisher">
                    <Users />
                  //</ProtectedRoute>
                } 
              />
              <Route path="/register" element={<Register />} />
              </Routes>
            </div>
            <Footer />
          </Router>
        </div>
      </AuthContext.Provider>
    </ThemeContext.Provider>
  );
}

export default App;