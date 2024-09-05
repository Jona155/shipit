import React from 'react';
import { useTranslation } from 'react-i18next';
import './Loader.css';

const Loader = () => {
  const { t } = useTranslation();

  return (
    <div className="loader-container">
      <div className="loader"></div>
      <p className="loader-text">{t('loading')}</p>
    </div>
  );
};

export default Loader;