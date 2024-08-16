import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './Settings.css';

const Settings = () => {
  const { t, i18n } = useTranslation();
  const [settings, setSettings] = useState({
    businessName: '',
    businessAddress: '',
    businessPhone: '',
  });

  const [isSaved, setIsSaved] = useState(false);
  const isRTL = i18n.language === 'he';

  useEffect(() => {
    const savedSettings = localStorage.getItem('businessSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prevSettings => ({
      ...prevSettings,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem('businessSettings', JSON.stringify(settings));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className={`settings-container ${isRTL ? 'rtl' : ''}`}>
      <h1>{t('nav_settings')}</h1>
      <form onSubmit={handleSubmit} className="settings-form">
        <div className="form-group">
          <label htmlFor="businessName">{t('settings_business_name')}:</label>
          <input
            type="text"
            id="businessName"
            name="businessName"
            value={settings.businessName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="businessAddress">{t('settings_business_address')}:</label>
          <textarea
            id="businessAddress"
            name="businessAddress"
            value={settings.businessAddress}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="businessPhone">{t('settings_business_phone')}:</label>
          <input
            type="tel"
            id="businessPhone"
            name="businessPhone"
            value={settings.businessPhone}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" className="save-button">{t('settings_save')}</button>
      </form>
      {isSaved && <div className="success-message">{t('settings_saved')}</div>}
    </div>
  );
};

export default Settings;