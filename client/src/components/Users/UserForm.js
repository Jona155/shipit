import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './UserForm.css';

const UserForm = ({ onSubmit, initialData, onClose, defaultType, defaultOnShift }) => {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    type: defaultType || 'messenger',
    isCurrentlyOnShift: defaultOnShift || false,
    username: '',
    password: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        name: '',
        phoneNumber: '',
        type: defaultType || 'messenger',
        isCurrentlyOnShift: defaultOnShift || false,
        username: '',
        password: ''
      });
    }
  }, [initialData, defaultType, defaultOnShift]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isRTL = i18n.language === 'he';

  return (
    <div className={`user-form-container ${isRTL ? 'rtl' : 'ltr'}`}>
      <h2 className="form-title">
        {initialData ? t('edit_user') : t('add_user')}
      </h2>
      
      <form onSubmit={handleSubmit} className="user-form" aria-label={t('user_form_aria')}>
        {/* Basic Information Section */}
        <div className="form-section">
          <h3 className="section-title">{t('basic_info')}</h3>
          
          <div className="form-field">
            <label htmlFor="name">{t('user_name')}</label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder={t('user_name_placeholder')}
              required
              className="form-input"
              aria-required="true"
              aria-label={t('user_name_aria')}
            />
          </div>
          
          <div className="form-field">
            <label htmlFor="phoneNumber">{t('user_phone')}</label>
            <input
              id="phoneNumber"
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder={t('user_phone_placeholder')}
              required
              className="form-input"
              aria-required="true"
              aria-label={t('user_phone_aria')}
            />
          </div>
          
          <div className="form-field">
            <label htmlFor="type">{t('user_type')}</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              className="form-select"
              aria-required="true"
              aria-label={t('user_type_aria')}
            >
              <option value="messenger">{t('user_type_messenger')}</option>
              <option value="dispatcher">{t('user_type_dispatcher')}</option>
            </select>
          </div>
        </div>
        
        {/* Shift Information Section - Only for messengers */}
        {formData.type === 'messenger' && (
          <div className="form-section">
            <h3 className="section-title">{t('shift_info')}</h3>
            
            <div className="form-field toggle-field">
              <label className="toggle-container">
                <span className="toggle-label">{t('user_is_on_shift')}</span>
                <div className={`toggle-switch-form ${formData.isCurrentlyOnShift ? 'active' : ''}`}>
                  <input
                    type="checkbox"
                    name="isCurrentlyOnShift"
                    checked={formData.isCurrentlyOnShift}
                    onChange={handleChange}
                    className="toggle-input"
                    aria-label={t('user_shift_toggle_aria')}
                  />
                  <div className="toggle-slider"></div>
                </div>
              </label>
            </div>
          </div>
        )}
        
        {/* Credentials Section - Only for new users */}
        {!initialData && (
          <div className="form-section">
            <h3 className="section-title">{t('credentials')}</h3>
            
            <div className="form-field">
              <label htmlFor="username">{t('username')}</label>
              <input
                id="username"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder={t('user_username_placeholder')}
                required
                className="form-input"
                aria-required="true"
                aria-label={t('username_aria')}
              />
            </div>
            
            <div className="form-field">
              <label htmlFor="password">{t('password')}</label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={t('user_password_placeholder')}
                required
                className="form-input"
                aria-required="true"
                aria-label={t('password_aria')}
              />
            </div>
          </div>
        )}
        
        <button type="submit" className="submit-button" aria-label={t('submit_form_aria')}>
          {initialData ? t('update_user') : t('add_user')}
        </button>
      </form>
    </div>
  );
};

export default UserForm;