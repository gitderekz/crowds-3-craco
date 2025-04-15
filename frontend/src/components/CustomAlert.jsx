import React, { useEffect, useState } from 'react';

const CustomAlert = ({ message, type, onClose }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setVisible(false);
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!visible) return null;

  return (
    <div className={`custom-alert ${type}`}>
      {message}
    </div>
  );
};

export default CustomAlert;

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`
// import React, { useEffect, useState } from 'react';

// const CustomAlert = ({ message, type, onClose }) => {
//   const [visible, setVisible] = useState(true);

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setVisible(false);
//       onClose();
//     }, 3000);

//     return () => clearTimeout(timer);
//   }, [onClose]);

//   if (!visible) return null;

//   return (
//     <div className={`custom-alert ${type}`}>
//       {message}
//     </div>
//   );
// };

// export default CustomAlert;