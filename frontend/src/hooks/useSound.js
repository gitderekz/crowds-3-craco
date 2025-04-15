import { useRef, useEffect } from 'react';
import notificationSound from '../assets/sounds/mixkit-confirmation-tone-2867.wav';
import groupChatSound from '../assets/sounds/mixkit-confirmation-tone-2867.wav';
import callSound from '../assets/sounds/mixkit-urgent-simple-tone-loop-2976.wav';
import errorSound from '../assets/sounds/mixkit-interface-hint-notification-911.wav';
import foregroundSound from '../assets/sounds/mixkit-bubble-pop-up-alert-notification-2357.wav';
import sentMessageSound from '../assets/sounds/mixkit-light-button-2580.wav';

const useSound = () => {
  const sounds = useRef({
    notification: new Audio(notificationSound),
    groupChat: new Audio(groupChatSound),
    call: new Audio(callSound),
    error: new Audio(errorSound),
    foreground: new Audio(foregroundSound),
    sent: new Audio(sentMessageSound),
  });

  const playSound = (type) => {
    const audio = sounds.current[type];
    if (!audio) {
      console.error(`Sound type ${type} not found`);
      return;
    }

    try {
      audio.currentTime = 0;
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(e => console.log(`${type} sound play failed:`, e));
      }
    } catch (error) {
      console.error(`Error playing ${type} sound:`, error);
    }
  };

  // Safe preload that works in all browsers
  useEffect(() => {
    Object.values(sounds.current).forEach(audio => {
      try {
        // Some browsers don't support load() or it doesn't return a Promise
        if (typeof audio.load === 'function') {
          // Wrap in try-catch since load() might throw synchronously
          audio.load();
        }
      } catch (e) {
        console.log('Sound preload failed:', e);
      }
    });
  }, []);

  return {
    playNotification: () => playSound('notification'),
    playGroupChat: () => playSound('groupChat'),
    playCall: () => playSound('call'),
    playError: () => playSound('error'),
    playForeground: () => playSound('foreground'),
    playSent: () => playSound('sent'),
    // Optional: Add volume control
    setVolume: (type, volume) => {
      const audio = sounds.current[type];
      if (audio) audio.volume = Math.min(1, Math.max(0, volume));
    }
  };
};

export default useSound;