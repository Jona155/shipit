import React from 'react';
import './Loading.css';
import { useTranslation } from 'react-i18next';

const Loading = ({ size = 'medium' }) => {
  const { t } = useTranslation();
  
  return (
    <div className={`loading-container ${size}`}>
      <div className="loading-content">
        <div className="delivery-icon">
          <svg viewBox="0 0 24 24" width="100%" height="100%" fill="#4361EE">
            <path d="M19.15,8a2,2,0,0,0-1.72-1H15V5a1,1,0,0,0-1-1H4A1,1,0,0,0,3,5V15a1,1,0,0,0,1,1H5.13a3,3,0,0,0,5.74,0h2.26a3,3,0,0,0,5.74,0H20a1,1,0,0,0,1-1V9.43A3,3,0,0,0,19.15,8ZM8,17a1,1,0,1,1,1-1A1,1,0,0,1,8,17Zm8,0a1,1,0,1,1,1-1A1,1,0,0,1,16,17Zm3-3H18.87a3,3,0,0,0-5.74,0H10.87a3,3,0,0,0-5.74,0H5V5h9v2H11a1,1,0,0,0,0,2h4.15c.14,0,.44.12.53.29L17.5,12Z"/>
          </svg>
        </div>
        <div className="loading-text">{t('loading')}...</div>
        <div className="loading-bar-container">
          <div className="loading-bar-progress"></div>
        </div>
      </div>
    </div>
  );
};

export default Loading; 