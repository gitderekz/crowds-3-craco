import React, { useState, useRef, useEffect, useContext } from 'react';
import axios from 'axios';
import { FaHeart } from 'react-icons/fa';
import PhotoModal from './PhotoModal';
import CustomAlert from './CustomAlert';
import { FaComments } from 'react-icons/fa';
import ClubChatScreen from '../pages/ClubChatScreen';
import PrivateChatScreen from '../pages/PrivateChatScreen';
import { ThemeContext } from '../App';
import AuthModal from './AuthModal';

const PhotoGrid = ({ photos, activeCategoryName }) => {
  const { theme } = useContext(ThemeContext);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [likes, setLikes] = useState({}); // Track likes count for each photo
  const [likedPhotos, setLikedPhotos] = useState({}); // Track which photos the user has liked
  const [alert, setAlert] = useState({ message: '', type: '' });
  const [selectedChatRoom, setSelectedChatRoom] = useState(null);
  const [privateChatUser, setPrivateChatUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [userId, setUserId] = useState(localStorage.getItem('user')!==null?JSON.parse(localStorage.getItem('user'))?.id:null); // Get logged-in user ID
  // Inside the component
  const gifIntervals = useRef({});

  // Cleanup intervals on unmount
  useEffect(() => {
    // userId = localStorage.getItem('user')!==null?JSON.parse(localStorage.getItem('user'))?.id:null;
    console.log('LOGEDUSEER',localStorage.getItem('user')!==null?JSON.parse(localStorage.getItem('user'))?.id:null);
    
    return () => {
      Object.values(gifIntervals.current).forEach(interval => clearInterval(interval));
    };
  }, []);


  const showAlert = (message, type) => {
    setAlert({ message, type });
  };

  // Handle like functionality
  const handleLike = async (photoId) => {
    if (!userId) {
      setIsAuthModalOpen(true);
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/photos/${photoId}/like`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        }
      );

      // Update likes count
      setLikes((prevLikes) => ({
        ...prevLikes,
        [photoId]: response.data.photo.photoLikes,
      }));

      // Update likedPhotos state to reflect that the user has liked this photo
      setLikedPhotos((prevLikedPhotos) => ({
        ...prevLikedPhotos,
        [photoId]: true,
      }));

      showAlert('Photo liked!', 'success');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'You have already liked this photo or need to log in.';
      showAlert(errorMessage, 'error');
    }
  };

  const handleChatClick = (e, photo) => {
    e.stopPropagation();
    
    if (!userId) {
      setIsAuthModalOpen(true);
      return;
    }

    setSelectedChatRoom({
      photoId: photo.id,
      name: photo.name,
      location: photo.location,
      schedule: photo.schedule,
      event: photo.event,
      gallery: photo.gallery,
      services: photo.services,
      photoLikes: photo.photoLikes,
      type: activeCategoryName
    });
  };

  // Handle image/video click to open modal
  const handleMediaClick = (photo) => {
    setSelectedPhoto(photo);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPhoto(null);
  };

  // Filter photos based on clientId or publisher userId matching with logged-in user
  const filteredPhotos = photos.filter((photo) => {
    const { clientId, userId: publisherId } = photo;
    return (
      (clientId && clientId === Number(userId)) || publisherId === Number(userId) || clientId === null
    );
  });

  return (
    <div className="photo-grid">
      {alert.message && (
        <CustomAlert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert({ message: '', type: '' })}
        />
      )}

      {filteredPhotos.length === 0 ? (
        // <div>Loading crowds...{console.log(filteredPhotos)}</div>
        [{ id:1, name: "placeholder" }, { id:2, name: "placeholder" }, { id:3, name: "placeholder" }].map((placeholder) => {
          return (
            <div key={placeholder.id} className="photo-item" >
              <div>Loading crowd...</div>
              <div className="video-thumbnail">
                <img
                  src={`${process.env.REACT_APP_API_URL.replace('/api', '')}/uploads/placeholders/flyd-fYZW5-Q-4cI-unsplash.jpg`}
                  alt={placeholder.name}
                  loading="lazy"
                  onError={(e) => {
                    if (e.target.src !== `${process.env.REACT_APP_API_URL.replace('/api', '')}/uploads/placeholder.jpg`) {
                      e.target.src = `${process.env.REACT_APP_API_URL.replace('/api', '')}/uploads/placeholder.jpg`;
                    }
                  }}
                />
              </div>
            </div>
          );
        })
        
      ) : (
        filteredPhotos.map((photo) => {
          // Check if the user has liked the photo
          const hasLiked =
            likedPhotos[photo.id] || photo.likes.some((like) => like.userId === Number(userId));

          // Check if it's a GIF by checking the file extension
          const isGif = photo.imageUrl.endsWith('.gif');

          return (
            <div key={photo.id} className="photo-item" onClick={() => handleMediaClick(photo)}>
              {photo.mediaType === 'video' ? (
                // Show a video thumbnail (use an image or preview here)
                <div className="video-thumbnail">
                  <img
                    src={`${process.env.REACT_APP_API_URL.replace('/api', '')}${photo.thumbnailUrl}`} // Thumbnail for video
                    alt={photo.name}
                    loading="lazy"
                    onError={(e) => {
                      if (e.target.src !== `${process.env.REACT_APP_API_URL.replace('/api', '')}/uploads/placeholder.jpg`) {
                        e.target.src = `${process.env.REACT_APP_API_URL.replace('/api', '')}/uploads/placeholder.jpg`;
                      }
                    }}
                  />
                  <div className="video-overlay">Play Video</div>
                </div>
              ) : photo.mediaType === 'gif' ? (
                // If it's a GIF, render it normally but ensure it loops endlessly
                <img
                  src={`${process.env.REACT_APP_API_URL.replace('/api', '')}${photo.imageUrl}`}
                  alt={photo.name}
                  loading="lazy"
                  ref={(el) => {
                    if (el) {
                      // Clear existing interval (if any)
                      if (gifIntervals.current[photo.id]) {
                        clearInterval(gifIntervals.current[photo.id]);
                      }
                      // Set new interval with smooth transition
                      gifIntervals.current[photo.id] = setInterval(() => {
                        // Fade out
                        el.style.opacity = '0';
                        // After fade-out completes, reset src and fade back in
                        setTimeout(() => {
                          el.src = el.src;
                          el.style.opacity = '1';
                        }, 300); // Matches the CSS transition duration
                      }, 10000); // GIF restart interval (adjust as needed)
                    }
                  }}
                  style={{ transition: 'opacity 0.3s ease-in-out', display: 'block', width: '100%', height: 'auto', maxWidth: '100%', maxHeight: '100%', opacity: '1' }}
                  onError={(e) => {
                    if (e.target.src !== `${process.env.REACT_APP_API_URL.replace('/api', '')}/uploads/placeholder.jpg`) {
                      e.target.src = `${process.env.REACT_APP_API_URL.replace('/api', '')}/uploads/placeholder.jpg`;
                    }
                  }}
                />
              ) : (
                // If it's not a GIF, render as a regular image (or video)
                <img
                  src={`${process.env.REACT_APP_API_URL.replace('/api', '')}${photo.imageUrl}`}
                  alt={photo.name}
                  loading="lazy"
                  onError={(e) => {
                    if (e.target.src !== `${process.env.REACT_APP_API_URL.replace('/api', '')}/uploads/placeholder.jpg`) {
                      e.target.src = `${process.env.REACT_APP_API_URL.replace('/api', '')}/uploads/placeholder.jpg`;
                    }
                  }}
                />
              )
              }

              {/* Left Event Overlay */}
              <div className="event-overlay">
                <div className="event-current">
                  <span className="event-title">Current</span>
                  {/* <span className="event-time">10:00 AM - Yoga</span> */}
                  <span className="event-time">
                    {photo.currentEvent?.time??'10:00 AM'} - {photo.currentEvent?.name??'Yoga'}
                  </span>
                </div>
                <div className="event-next">
                  <span className="event-title">Next</span>
                  {/* <span className="event-time">11:30 AM - Pilates</span> */}
                  <span className="event-time">
                    {photo.nextEvent?.time??'11:30 AM'} - {photo.nextEvent?.name??"Pilates"}
                  </span>
                </div>
              </div>
              
              {/* Top right Chat overlay */}
              {parseInt(photo.category) !== 1 && photo.mediaType === 'gif' && (
                <div 
                  className="chat-overlay"
                  onClick={(e) => handleChatClick(e, photo)}
                >
                  <FaComments className="chat-icon" />
                  <span>Join Chat</span>
                </div>
              )}

              {/* Bottom overlay */}
              <div className="photo-overlay">
                <div className="photo-name">{photo.name}</div>
                <div
                  className="photo-likes"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent handleMediaClick from triggering
                    handleLike(photo.id);
                  }}
                >
                  <FaHeart className={`fa-heart ${hasLiked ? 'liked' : ''}`} />
                  {hasLiked ? 'Liked' : 'Likes'}
                  <span>{likes[photo.id] ?? photo.photoLikes}</span>
                </div>
              </div>
            </div>
          );
        })
      )}

      {isModalOpen && selectedPhoto && (
        <PhotoModal photo={selectedPhoto} handleChatClick={handleChatClick} onClose={closeModal} activeCategoryName={activeCategoryName} />
      )}
      
      {/* Add these components at the bottom of your return statement (before the closing div) */}
      {selectedChatRoom && (
        <div className="chat-modal-overlay">
          <ClubChatScreen
            room={selectedChatRoom}
            setIsAuthModalOpen={setIsAuthModalOpen}
            onClose={() => setSelectedChatRoom(null)}
            onOpenPrivateChat={(user) => {
              setSelectedChatRoom(null);
              setPrivateChatUser(user);
            }}
          />
        </div>
      )}

      {privateChatUser && (
        <div className="chat-modal-overlay">
          <PrivateChatScreen
            user={privateChatUser}
            setIsAuthModalOpen={setIsAuthModalOpen}
            onClose={() => setPrivateChatUser(null)}
          />
        </div>
      )}

      {isAuthModalOpen && (
        <AuthModal 
          onClose={() => setIsAuthModalOpen(false)}
          onLoginSuccess={() => {
            window.location.reload();
          }}
        />
      )}

    </div>
  );
};

export default PhotoGrid;
