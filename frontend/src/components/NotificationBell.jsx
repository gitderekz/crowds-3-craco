// frontend/src/components/NotificationBell.jsx
import React, { useContext, useState } from 'react';
import { FaBell } from 'react-icons/fa';
import { NotificationContext } from '../App';
import './NotificationBell.css';

const NotificationBell = () => {
  const { notifications, unreadCount, markNotificationsAsRead } = useContext(NotificationContext);
  const [isOpen, setIsOpen] = useState(false);

  // Function to format notification time (you can replace with actual timestamp from your notifications)
  const formatTime = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="notification-bell-container--">
      <button 
        className="notification-bell-button" 
        onClick={() => {
          setIsOpen(!isOpen);
          if (isOpen) {
            markNotificationsAsRead();
          }
        }}
        aria-label="Notifications"
      >
        <FaBell className='notification-bell-icon'/>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>
      
      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h4>Notifications</h4>
            <button onClick={() => setIsOpen(false)} aria-label="Close notifications">×</button>
          </div>
          
          <div className="notification-list">
            {notifications.length > 0 ? (
              notifications.map((notification, index) => (
                <div 
                  key={index} 
                  className={`notification-item ${
                    notification.type === 'message' ? 'notification-message' : 
                    notification.type === 'call' ? 'notification-call' : ''
                  }`}
                  onClick={() => {
                    // Handle notification click (e.g., navigate to message)
                    setIsOpen(false);
                  }}
                >
                  <div className="notification-content">
                    {notification.type === 'message' && (
                      <>
                        <p>New message from {notification.senderId}</p>
                        <div className="notification-time">
                          {formatTime()}
                        </div>
                      </>
                    )}
                    {notification.type === 'call' && (
                      <>
                        <p>Missed call from {notification.callerId}</p>
                        <div className="notification-time">
                          {formatTime()}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="no-notifications">
                No new notifications
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;