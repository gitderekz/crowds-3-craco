import React, { useContext } from 'react';
import { ThemeContext } from '../App';
import { FaSun, FaMoon } from 'react-icons/fa'; // Import sun and moon icons
import '../pages/ThemeToggle.css'; // Import CSS for styling

const ThemeToggle = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <div className="theme-toggle" onClick={toggleTheme}>
      <div className={`slider ${theme === 'light' ? 'light' : 'dark'}`}>
        <div className="icon">
          {theme === 'light' ? <FaMoon />: <FaSun /> }
        </div>
        <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
      </div>
    </div>

  //   <button className="theme-toggle" onClick={toggleTheme}>
  //   <div className={`toggle-content ${theme === 'light' ? 'light' : 'dark'}`}>
  //     <span className="icon">
  //       {theme === 'light' ? <FaMoon /> : <FaSun />}
  //     </span>
  //     <span className="text">
  //       {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
  //     </span>
  //   </div>
  // </button>
  );
};

export default ThemeToggle;