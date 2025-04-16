import React, { useEffect, useState } from 'react';
import { FaEllipsisH } from 'react-icons/fa';

const TypingIndicator = ({ typingUsers, users }) => {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    if (typingUsers.length === 0) {
      setDisplayText('');
      return;
    }

    const names = typingUsers.map(userId => {
      const user = users.find(u => u.id === userId);
      return user ? user.username : 'Someone';
    });

    let text = '';
    if (names.length === 1) {
      text = `${names[0]} is typing`;
    } else if (names.length === 2) {
      text = `${names[0]} and ${names[1]} are typing`;
    } else {
      text = `${names[0]}, ${names[1]}, and others are typing`;
    }

    setDisplayText(text);
  }, [typingUsers, users]);

  if (!displayText) return null;

  return (
    <div className="typing-indicator">
      <div className="typing-dots">
        <FaEllipsisH />
      </div>
      <span>{displayText}</span>
    </div>
  );
};

export default TypingIndicator;