import React from 'react';
import { FaCircle } from 'react-icons/fa';

const UserStatusIndicator = ({ online, lastSeen }) => {
  const getStatusText = () => {
    if (online) return 'Online';
    if (!lastSeen) return 'Offline';
    
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffMinutes = Math.floor((now - lastSeenDate) / (1000 * 60));
    
    if (diffMinutes < 5) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hours ago`;
    return `${Math.floor(diffMinutes / 1440)} days ago`;
  };

  return (
    <div className="user-status">
      <FaCircle 
        className={`status-icon ${online ? 'online' : 'offline'}`} 
        size={10} 
      />
      <span className="status-text">{getStatusText()}</span>
    </div>
  );
};

export default UserStatusIndicator;