import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './UserForm.css';

const UserForm = ({ onSubmit, initialData, onClose }) => {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    type: 'messenger',
    isCurrentlyOnShift: false,
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
        type: 'messenger',
        isCurrentlyOnShift: false,
        username: '',
        password: ''
      });
    }
  }, [initialData]);

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
      <form onSubmit={handleSubmit} className="user-form">
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder={t('user_name_placeholder')}
          required
          className="form-input"
        />
        <input
          type="tel"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleChange}
          placeholder={t('user_phone_placeholder')}
          required
          className="form-input"
        />
        <select
          name="type"
          value={formData.type}
          onChange={handleChange}
          required
          className="form-select"
        >
          <option value="messenger">{t('user_type_messenger')}</option>
          <option value="dispatcher">{t('user_type_dispatcher')}</option>
        </select>
        {formData.type === 'messenger' && (
          <label>
            <input
              type="checkbox"
              name="isCurrentlyOnShift"
              checked={formData.isCurrentlyOnShift}
              onChange={handleChange}
            />
            {t('user_is_on_shift')}
          </label>
        )}
        {!initialData && (
          <>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder={t('user_username_placeholder')}
              required
              className="form-input"
            />
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={t('user_password_placeholder')}
              required
              className="form-input"
            />
          </>
        )}
        <button type="submit" className="submit-button">
          {initialData ? t('update_user') : t('add_user')}
        </button>
      </form>
    </div>
  );
};

export default UserForm;