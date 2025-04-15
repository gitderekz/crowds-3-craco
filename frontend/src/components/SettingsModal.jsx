import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../App';
import axios from 'axios';
import { FaTimes, FaUser, FaImage, FaCalendarAlt, FaMapMarkerAlt, FaListUl, FaImages } from 'react-icons/fa';

const SettingsModal = ({ onClose, userId }) => {
    const { theme } = useContext(ThemeContext);
    const [activeTab, setActiveTab] = useState('user');
    const [userData, setUserData] = useState({
      username: '',
      email: '',
      avatar: null,
      currentAvatar: '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    const [photoSettings, setPhotoSettings] = useState({
      schedule: [],
      location: {
        name: '',
        street: '',
        building: '',
        geoLocation: ''
      },
      services: [],
      gallery: []
    });
    const [photos, setPhotos] = useState([]);
    const [selectedPhotoId, setSelectedPhotoId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
  
    // Fetch user data and photos on component mount
    useEffect(() => {
      const fetchData = async () => {
        try {
          // Fetch user data
          const userResponse = await axios.get(`${process.env.REACT_APP_API_URL}/users/${userId}`,
              {
                  headers:{ Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
              }
          );
          setUserData({
            ...userResponse.data,
            currentAvatar: userResponse.data.avatar,
            newPassword: '',
            confirmPassword: ''
          });
  
          // Fetch user's photos
          const photosResponse = await axios.get(`${process.env.REACT_APP_API_URL}/photos?userId=${userId}`,
              {
                  headers:{ Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
              }
          );
          setPhotos(photosResponse.data);
  
          // Initialize photo settings if photos exist
          if (photosResponse.data.length > 0) {
            const firstPhoto = photosResponse.data[0];
            setPhotoSettings({
              schedule: firstPhoto.schedule || [],
              location: firstPhoto.location || {
                name: '',
                street: '',
                building: '',
                geoLocation: ''
              },
              services: firstPhoto.services || [],
              gallery: firstPhoto.gallery || []
            });
            setSelectedPhotoId(firstPhoto.id);
          }
  
          setIsLoading(false);
        } catch (err) {
          setError('Failed to fetch data');
          setIsLoading(false);
        }
      };
  
      fetchData();
    }, [userId]);
  
    const handleUserChange = (e) => {
      const { name, value } = e.target;
      setUserData(prev => ({ ...prev, [name]: value }));
    };
  
    const handleAvatarChange = (e) => {
      setUserData(prev => ({ ...prev, avatar: e.target.files[0] }));
    };
  
    const handlePhotoSettingChange = (e) => {
      const { name, value } = e.target;
      setPhotoSettings(prev => ({ ...prev, [name]: value }));
    };
  
    const handleLocationChange = (e) => {
      const { name, value } = e.target;
      setPhotoSettings(prev => ({
        ...prev,
        location: { ...prev.location, [name]: value }
      }));
    };
  
    const handleServiceChange = (index, value) => {
      const newServices = [...photoSettings.services];
      newServices[index] = value;
      setPhotoSettings(prev => ({ ...prev, services: newServices }));
    };
  
    const addService = () => {
      setPhotoSettings(prev => ({ ...prev, services: [...prev.services, ''] }));
    };
  
    const removeService = (index) => {
      const newServices = photoSettings.services.filter((_, i) => i !== index);
      setPhotoSettings(prev => ({ ...prev, services: newServices }));
    };
  
    const handleScheduleChange = (index, field, value) => {
      const newSchedule = [...photoSettings.schedule];
      newSchedule[index] = { ...newSchedule[index], [field]: value };
      setPhotoSettings(prev => ({ ...prev, schedule: newSchedule }));
    };
  
    const addScheduleItem = () => {
      setPhotoSettings(prev => ({
        ...prev,
        schedule: [...prev.schedule, { time: '', event: '' }]
      }));
    };
  
    const removeScheduleItem = (index) => {
      const newSchedule = photoSettings.schedule.filter((_, i) => i !== index);
      setPhotoSettings(prev => ({ ...prev, schedule: newSchedule }));
    };
  
    const handleGalleryChange = (e) => {
      setPhotoSettings(prev => ({
        ...prev,
        gallery: [...prev.gallery, ...Array.from(e.target.files)]
      }));
    };
  
    const removeGalleryImage = (index) => {
      const newGallery = photoSettings.gallery.filter((_, i) => i !== index);
      setPhotoSettings(prev => ({ ...prev, gallery: newGallery }));
    };
  
    const handleSubmitUser = async (e) => {
      e.preventDefault();
      setError('');
      setSuccess('');
  
      // Validate password changes
      if (userData.newPassword) {
          if (!userData.currentPassword) {
          setError('Current password is required to change password');
          return;
          }
          
          if (userData.newPassword !== userData.confirmPassword) {
          setError('New passwords do not match');
          return;
          }
      }
  
      try {
        const formData = new FormData();
        formData.append('username', userData.username);
        formData.append('email', userData.email);
        if (userData.currentPassword) formData.append('currentPassword', userData.currentPassword);
        if (userData.newPassword) formData.append('password', userData.newPassword);
        if (userData.avatar) formData.append('avatar', userData.avatar);
  
        await axios.put(`${process.env.REACT_APP_API_URL}/users/${userId}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
  
        setSuccess('User settings updated successfully');
        setTimeout(() => onClose(), 1500);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to update user settings');
      }
    };
  
    const handleSubmitPhotoSettings = async (e) => {
      e.preventDefault();
      setError('');
      setSuccess('');
    
      if (!selectedPhotoId) {
        setError('No photo selected');
        return;
      }
    
      try {
        const formData = new FormData();
        
        // Append files
        photoSettings.gallery
          .filter(file => file instanceof File) // Only new files
          .forEach(file => formData.append('images', file));
        
        // Append other data as JSON strings
        formData.append('schedule', JSON.stringify(photoSettings.schedule));
        formData.append('location', JSON.stringify(photoSettings.location));
        formData.append('services', JSON.stringify(photoSettings.services));
    
        await axios.put(
          `${process.env.REACT_APP_API_URL}/photos/${selectedPhotoId}`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`
            }
          }
        );
    
        setSuccess('Photo settings updated successfully');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to update photo settings');
      }
    };
  

  return (
    <div className="settings-modal-overlay">
      <div className={`settings-modal ${theme}`}>
        <button className="close-button" onClick={onClose}>
          <FaTimes />
        </button>

        <div className="settings-tabs">
          <button
            className={`tab-button ${activeTab === 'user' ? 'active' : ''} ${theme}`}
            onClick={() => setActiveTab('user')}
          >
            <FaUser /> User Settings
          </button>
          <button
            className={`tab-button ${activeTab === 'photo' ? 'active' : ''} ${theme}`}
            onClick={() => setActiveTab('photo')}
            disabled={photos.length === 0}
          >
            <FaImage /> Photo Settings
          </button>
        </div>

        {isLoading ? (
          <div className="loading">Loading...</div>
        ) : (
          <>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            {activeTab === 'user' ? (
              <form onSubmit={handleSubmitUser} className="settings-form">
                <div className="form-columns">
                  {/* Left Column */}
                  <div className="form-column">
                    <div className="form-group">
                      <label>Username</label>
                      <input
                        type="text"
                        name="username"
                        value={userData.username}
                        onChange={handleUserChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        name="email"
                        value={userData.email}
                        onChange={handleUserChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Avatar</label>
                      <div className="avatar-upload">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                        />
                        {userData.currentAvatar && (
                          <img
                            src={`${process.env.REACT_APP_API_URL.replace('/api', '')}${userData.currentAvatar}`}
                            alt="Current avatar"
                            className="current-avatar"
                          />
                        )}
                        {userData.avatar && (
                          <span className="avatar-preview">
                            {userData.avatar.name}
                            <button
                              type="button"
                              onClick={() => setUserData(prev => ({ ...prev, avatar: null }))}
                            >
                              ×
                            </button>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="form-column">
                    <div className="password-change-section">
                      <h4>Change Password</h4>
                      
                      <div className="form-group">
                        <label>Current Password</label>
                        <input
                          type="password"
                          name="currentPassword"
                          value={userData.currentPassword}
                          onChange={handleUserChange}
                          placeholder="Enter current password"
                          required={userData.newPassword !== ''}
                        />
                      </div>

                      <div className="form-group">
                        <label>New Password</label>
                        <input
                          type="password"
                          name="newPassword"
                          value={userData.newPassword}
                          onChange={handleUserChange}
                          placeholder="Leave blank to keep current"
                        />
                        {userData.newPassword && userData.newPassword.length < 8 && (
                          <p className="password-hint">Password must be at least 8 characters</p>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Confirm Password</label>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={userData.confirmPassword}
                          onChange={handleUserChange}
                          placeholder="Confirm new password"
                        />
                        {userData.newPassword && userData.newPassword !== userData.confirmPassword && (
                          <p className="password-hint">Passwords don't match</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <button type="submit" className="submit-button">
                  Save User Settings
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmitPhotoSettings} className="settings-form">
                <div className="form-columns">
                  {/* Left Column */}
                  <div className="form-column">
                    <div className="form-group">
                      <label>Select Photo</label>
                      <select
                        value={selectedPhotoId || ''}
                        onChange={(e) => {
                          const photoId = e.target.value;
                          setSelectedPhotoId(photoId);
                          const selectedPhoto = photos.find(p => p.id === parseInt(photoId));
                          if (selectedPhoto) {
                            setPhotoSettings({
                              schedule: selectedPhoto.schedule || [],
                              location: selectedPhoto.location || {
                                name: '',
                                street: '',
                                building: '',
                                geoLocation: ''
                              },
                              services: selectedPhoto.services || [],
                              gallery: selectedPhoto.gallery || []
                            });
                          }
                        }}
                      >
                        {photos.map(photo => (
                          <option key={photo.id} value={photo.id}>
                            {photo.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="section-title">
                      <FaCalendarAlt /> Schedule
                    </div>
                    {JSON.parse(photoSettings.schedule).map((item, index) => (
                      <div key={index} className="schedule-item">
                        <input
                          type="text"
                          placeholder="Time (e.g., 10:00 AM)"
                          value={item.time}
                          onChange={(e) => handleScheduleChange(index, 'time', e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="Event (e.g., Yoga)"
                          value={item.event}
                          onChange={(e) => handleScheduleChange(index, 'event', e.target.value)}
                        />
                        <button
                          type="button"
                          className="remove-button"
                          onClick={() => removeScheduleItem(index)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="add-button"
                      onClick={addScheduleItem}
                    >
                      + Add Schedule Item
                    </button>

                    <div className="section-title">
                      <FaListUl /> Services
                    </div>
                    {JSON.parse(photoSettings.services).map((service, index) => (
                      <div key={index} className="service-item">
                        <input
                          type="text"
                          value={service}
                          onChange={(e) => handleServiceChange(index, e.target.value)}
                          placeholder="Service (e.g., Food & Drinks)"
                        />
                        <button
                          type="button"
                          className="remove-button"
                          onClick={() => removeService(index)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="add-button"
                      onClick={addService}
                    >
                      + Add Service
                    </button>
                  </div>

                  {/* Right Column */}
                  <div className="form-column">
                    <div className="section-title">
                      <FaMapMarkerAlt /> Location
                    </div>
                    <div className="form-group">
                      <label>Name</label>
                      <input
                        type="text"
                        name="name"
                        value={JSON.parse(photoSettings.location).name}
                        onChange={handleLocationChange}
                        placeholder="Venue Name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Street</label>
                      <input
                        type="text"
                        name="street"
                        value={JSON.parse(photoSettings.location).street}
                        onChange={handleLocationChange}
                        placeholder="123 Main Street"
                      />
                    </div>
                    <div className="form-group">
                      <label>Building</label>
                      <input
                        type="text"
                        name="building"
                        value={JSON.parse(photoSettings.location).building}
                        onChange={handleLocationChange}
                        placeholder="Building A"
                      />
                    </div>
                    <div className="form-group">
                      <label>Geo Location</label>
                      <input
                        type="text"
                        name="geoLocation"
                        value={JSON.parse(photoSettings.location).geoLocation}
                        onChange={handleLocationChange}
                        placeholder="40.7128° N, 74.0060° W"
                      />
                    </div>

                    <div className="section-title">
                      <FaImages /> Gallery
                    </div>
                    <div className="form-group">
                      <label>Add Images</label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleGalleryChange}
                      />
                    </div>
                    <div className="gallery-preview">
                      {JSON.parse(photoSettings.gallery).map((image, index) => (
                        <div key={index} className="gallery-item">
                          {typeof image === 'string' ? (
                            <img
                              src={`${process.env.REACT_APP_API_URL.replace('/api', '')}${image}`}
                              alt={`Gallery ${index}`}
                            />
                          ) : (
                            <span>{image.name}</span>
                          )}
                          <button
                            type="button"
                            className="remove-button"
                            onClick={() => removeGalleryImage(index)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <button type="submit" className="submit-button">
                  Save Photo Settings
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SettingsModal;