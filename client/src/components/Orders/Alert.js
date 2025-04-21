import React, { useState, useEffect } from 'react';
import './Alert.css';

const Alert = ({ message, type = 'success' }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Reset visibility whenever a new alert is shown
    setIsVisible(true);
  }, [message, type]);

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  let icon;
  let title;

  switch (type) {
    case 'error':
      icon = <div className="alert-icon error"><i>!</i></div>;
      title = 'Uh oh, something went wrong';
      break;
    case 'info':
      icon = <div className="alert-icon info"><i>i</i></div>;
      title = 'Did you know?';
      break;
    case 'success':
    default:
      icon = <div className="alert-icon success"><i>✓</i></div>;
      title = 'Success!';
      break;
  }

  return (
    <div className={`toast-alert ${type}`}>
      <div className="toast-content">
        {icon}
        <div className="toast-message">
          <h4>{title}</h4>
          <p>{message}</p>
        </div>
        <div className="toast-close" onClick={handleClose}>×</div>
      </div>
    </div>
  );
};

export default Alert;