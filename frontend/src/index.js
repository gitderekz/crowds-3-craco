// import React from 'react';
// import ReactDOM from 'react-dom/client';
// import './index.css';
// import App from './App';
// import reportWebVitals from './reportWebVitals';

// const root = ReactDOM.createRoot(document.getElementById('root'));
// root.render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// );

// // If you want to start measuring performance in your app, pass a function
// // to log results (for example: reportWebVitals(console.log))
// // or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();

import React from 'react';
import ReactDOM from 'react-dom/client';  // Change the import
import App from './App';
import './theme.css';

// Get the root element from the DOM
const rootElement = document.getElementById('root');

// Create a root using the new React 18 API
const root = ReactDOM.createRoot(rootElement);

// Render the app
root.render(
  //<React.StrictMode>
    <App />
  //</React.StrictMode>
);
