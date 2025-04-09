import React from 'react';
import './UserList.css';
import { useTranslation } from 'react-i18next';

const UserList = ({ users, onEdit, onDelete, onToggleAvailability, view }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'he';

  // If no users to display
  if (users.length === 0) {
    return (
      <div className="no-users-message">
        {t('no_users_found')}
      </div>
    );
  }

  return (
    <div className={`user-cards-container ${isRTL ? 'rtl' : 'ltr'}`}>
      {users.map(user => (
        <div 
          key={user.uid} 
          className={`user-card ${user.type === 'messenger' ? 'messenger-card' : 'dispatcher-card'} ${
            user.type === 'messenger' && user.isCurrentlyOnShift ? 'on-shift' : 'off-shift'
          }`}
        >
          <div className="card-header">
            <h3 className="user-name">{user.name}</h3>
            {user.type === 'messenger' && (
              <div className={`status-badge ${user.isCurrentlyOnShift ? 'in-shift' : 'off-shift'}`}>
                {t(user.isCurrentlyOnShift ? 'in_shift' : 'out_of_shift')}
              </div>
            )}
          </div>
          
          <div className="card-content">
            <div className="info-row">
              <span className="info-label">{t('user_phone')}:</span>
              <span className="info-value">{user.phoneNumber}</span>
            </div>
            <div className="info-row">
              <span className="info-label">{t('user_type')}:</span>
              <span className="info-value">{t(user.type === 'messenger' ? 'user_type_messenger' : 'user_type_dispatcher')}</span>
            </div>
          </div>
          
          <div className="card-actions">
            {user.type === 'messenger' && (
              <label className="shift-toggle-container">
                <span className="toggle-label">{t('shift_status')}:</span>
                <div 
                  className={`toggle-switch ${user.isCurrentlyOnShift ? 'active' : ''}`}
                  onClick={() => onToggleAvailability(user.uid)}
                  aria-label={t('toggle_shift_status')}
                  role="switch"
                  aria-checked={user.isCurrentlyOnShift}
                >
                  <div className="toggle-slider"></div>
                </div>
              </label>
            )}
            
            <div className="action-buttons">
              <button 
                onClick={() => onEdit(user)} 
                className="edit-button"
                aria-label={t('edit_user_aria')}
              >
                {t('edit')}
              </button>
              <button 
                onClick={() => onDelete(user.uid)} 
                className="delete-button"
                aria-label={t('delete_user_aria')}
              >
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserList;