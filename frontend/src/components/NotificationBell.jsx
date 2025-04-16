// frontend/src/components/NotificationBell.jsx
import React, { useContext, useState } from 'react';
import { FaBell } from 'react-icons/fa';
import { NotificationContext } from '../App';
import './NotificationBell.css';

const NotificationBell = () => {
  const { notifications, unreadCount, markNotificationsAsRead } = useContext(NotificationContext);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="notification-bell-container">
      <button 
        className="notification-bell" 
        onClick={() => {
          setIsOpen(!isOpen);
          if (isOpen) {
            markNotificationsAsRead();
          }
        }}
      >
        <FaBell />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>
      
      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h4>Notifications</h4>
            <button onClick={() => setIsOpen(false)}>×</button>
          </div>
          
          <div className="notification-list">
            {notifications.length > 0 ? (
              notifications.map((notification, index) => (
                <div key={index} className="notification-item">
                  <div className="notification-content">
                    {notification.type === 'message' && (
                      <p>New message from {notification.senderId}</p>
                    )}
                    {notification.type === 'call' && (
                      <p>Missed call from {notification.callerId}</p>
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