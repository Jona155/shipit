import React from 'react';
import { useTranslation } from 'react-i18next';
import './Footer.css';

const Footer = () => {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    document.documentElement.dir = lng === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = lng;
  };

  const isRTL = i18n.language === 'he';

  const LanguageButtons = () => (
    <>
      <button 
        onClick={() => changeLanguage('en')} 
        className={i18n.language === 'en' ? 'active' : ''}
      >
        {t('language_english')}
      </button>
      <button 
        onClick={() => changeLanguage('he')} 
        className={i18n.language === 'he' ? 'active' : ''}
      >
        {t('language_hebrew')}
      </button>
    </>
  );

  return (
    <footer className={`app-footer ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="language-switcher">
        {isRTL ? (
          <>
            <LanguageButtons />
            <span>{t('footer_language')}:</span>
          </>
        ) : (
          <>
            <span>{t('footer_language')}:</span>
            <LanguageButtons />
          </>
        )}
      </div>
    </footer>
  );
};

export default Footer;