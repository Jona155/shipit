import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './UserForm.css';

const UserForm = ({ onSubmit, initialData, onClose }) => {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Courier',
    availability: 'Out of Shift'
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        name: '',
        email: '',
        role: 'Courier',
        availability: 'Out of Shift'
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    if (!initialData) {
      setFormData({
        name: '',
        email: '',
        role: 'Courier',
        availability: 'Out of Shift'
      });
    }
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
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder={t('user_email_placeholder')}
          required
          className="form-input"
        />
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          required
          className="form-select"
        >
          <option value="Courier">{t('user_role_courier')}</option>
          <option value="Dispatcher">{t('user_role_dispatcher')}</option>
        </select>
        <button type="submit" className="submit-button">
          {initialData ? t('update_user') : t('add_user')}
        </button>
      </form>
    </div>
  );
};

export default UserForm;