import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaHeart, FaTimes, FaMapMarkerAlt, FaUsers, FaCalendarAlt, FaComments } from 'react-icons/fa';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import '../pages/PhotoModal.css';

const PhotoModal = ({ photo, onClose, activeCategoryName: propActiveCategoryName, handleChatClick }) => {
  const [likes, setLikes] = useState(photo.photoLikes);
  const [hasLiked, setHasLiked] = useState(photo.likes.some((like) => like.userId === Number(localStorage.getItem('user')!==null?JSON.parse(localStorage.getItem('user'))?.id:null)));
  const [activeCategoryName, setActiveCategoryName] = useState(propActiveCategoryName || '');
  const [currentSlide, setCurrentSlide] = useState(0);

  // Sample data for demonstration (replace with actual data from your API)
  const [address, setAddress] = useState({
    name: photo.name || 'Venue Name',
    street: '123 Main Street',
    building: 'Building A',
    geoLocation: '40.7128° N, 74.0060° W'
  });

  const [services, setServices] = useState([
    'Food & Drinks',
    'Live Music',
    'Swimming Pool',
    'Free WiFi',
    'Parking'
  ]);

  const [galleryImages, setGalleryImages] = useState([
    `${process.env.REACT_APP_API_URL.replace('/api', '')}${photo.imageUrl}`,
    `${process.env.REACT_APP_API_URL.replace('/api', '')}/uploads/1744046390561-pexels-jill-wellington-1638660-257816.jpg`,
    `${process.env.REACT_APP_API_URL.replace('/api', '')}/uploads/1739655370104-ai-generated-7818581_1280.jpg`,
    `${process.env.REACT_APP_API_URL.replace('/api', '')}/uploads/1739655399020-ai-generated-7832245_1280.jpg`
  ]);

  // Slider settings
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    afterChange: (current) => setCurrentSlide(current),
  };

  // Effect to set activeCategoryName from localStorage if not provided as prop
  useEffect(() => {
    
    if (!propActiveCategoryName) {
      const storedCategoryName = localStorage.getItem('activeCategoryName');
      if (storedCategoryName) {
        setActiveCategoryName(storedCategoryName);
      }
    }
    console.log(`propActiveCategoryName ${propActiveCategoryName}`);
    console.log(`storedCategoryName ${activeCategoryName}`);
  }, [propActiveCategoryName]);  // Dependency on propActiveCategoryName

  const handleLike = async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/photos/${photo.id}/like`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        }
      );

      // Update the likes count and like status
      setLikes(response.data.photo.photoLikes);
      setHasLiked(true);
    } catch (error) {
      console.error('Error liking photo:', error.response?.data?.message || error.message);
      alert('You need to log in or have already liked this photo .');
    }
  };

  return (
    <div className="photo-modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Add this fixed header section */}
        <div className="modal-header">
          <p className="modal-title">{photo.name}</p>
          <button onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-scrollable-content">
          <div className="modal-columns-container">
            {/* Left Column */}
            <div className="modal-left-column">
              {/* Main Image */}
              <div className="modal-content-image">
                <img src={`${process.env.REACT_APP_API_URL.replace('/api', '')}${photo.imageUrl}`} alt={photo.name} />
              </div>
              
              {/* Chat and Like in one row */}
              <div className="modal-interaction-row">
                {parseInt(photo.category) !== 1 && photo.mediaType === 'gif' && (
                  <div 
                    className="chat-overlay-modal"
                    onClick={(e) => handleChatClick(e, photo)}
                  >
                    <FaComments className="chat-icon" />
                    <span>Join Chat</span>
                  </div>
                )}

                <div className="like-section" onClick={handleLike}>
                  <p>{hasLiked ? "Liked" : "Likes"} {likes}</p>
                  <FaHeart className={`fa-heart modal ${hasLiked ? 'liked' : ''} `} />
                </div>

                <p className="place-category">Category: {activeCategoryName??''}</p>

              </div>
            </div>

            {/* Right Column */}
            <div className="modal-right-column">

              {/* Address Section */}
              <div className="address-section">
                <b><FaMapMarkerAlt /> Address</b>
                <div className="address-details">
                  <span>Name: <i style={{"fontSize":"11px","fontWeight":"normal"}}>{JSON.parse(photo.location)?.name || address.name}</i></span>
                  <span>Street: <i style={{"fontSize":"11px","fontWeight":"normal"}}>{JSON.parse(photo.location)?.street || address.street}</i></span>
                  <span>Building: <i style={{"fontSize":"11px","fontWeight":"normal"}}>{JSON.parse(photo.location)?.building || address.building}</i></span>
                  <span>Location: <i style={{"fontSize":"11px","fontWeight":"normal"}}>{JSON.parse(photo.location)?.geoLocation || address.geoLocation}</i></span>
                </div>
              </div>

              {/* Events Schedule */}
              <div className="events-section">
                <b><FaCalendarAlt /> Events Schedule</b>
                <div className="event-current">
                  <span className="event-title">Current</span>
                  <span className="event-time">
                    {photo.currentEvent?.time??'10:00 AM'} - {photo.currentEvent?.name??'Yoga'}
                  </span>
                </div>
                <div className="event-next">
                  <span className="event-title">Next</span>
                  <span className="event-time">
                     {/* {photo.nextEvent?.time??'11:30 AM'} - {photo.nextEvent?.name??"Pilates"} */}
                    {
                      photo.schedule?
                      JSON.parse(photo.schedule)?.map((event, index)=>(
                        <span key={index} className="info-value">{event.time}-{event.event}<br /></span>
                      )):"No events"
                    }
                  </span>
                </div>
                <div className="members">
                  <span className="members-title"><FaUsers /> Members</span>
                  <span className="members-count">
                    {photo.members??'100+'}
                  </span>
                </div>
              </div>

              {/* Services Section */}
              <div className="services-section">
                <b>Services Offered</b>
                <ul className="services-list">
                  {/* {services.map((service, index) => ( */}
                  {photo.services?JSON.parse(photo.services)?.map((service, index) => (
                    <li key={index}><span>{service}</span></li>
                  )):<li>Not listed</li>}
                </ul>
              </div>
            </div>
          </div>

          <div className="modal-bottom-row">
            {/* Image Gallery Slider */}
            <div className="image-slider-section">
              <h3>Gallery</h3>
              <Slider {...sliderSettings}>
                {/* {galleryImages.map((img, index) => ( */}
                {photo.gallery?JSON.parse(photo.gallery)?.map((img, index) => (
                  <div key={index} className="slider-image-container">
                    <img 
                      src={`${process.env.REACT_APP_API_URL.replace('/api', '')}${img}`} 
                      alt={`Gallery ${index + 1}`} 
                      className="slider-image"
                    />
                  </div>
                )):''}
              </Slider>
            </div>

            <div className="buttons">
              <p className="publisher"><i>By {photo.user.username}</i></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoModal;