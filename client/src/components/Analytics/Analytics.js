import React from 'react';
import { useTranslation } from 'react-i18next';
import { Rocket } from 'lucide-react'; // Using Rocket icon
import './Analytics.css';

const Analytics = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'he';

  return (
    <div className={`analytics-placeholder ${isRTL ? 'rtl' : 'ltr'}`}>
      <Rocket size={80} className="placeholder-icon" />
      <h1 className="placeholder-title">
        {t('analytics_coming_soon_title', 'Coming Soon!')}
      </h1>
      <p className="placeholder-subtitle">
        {t('analytics_coming_soon_message', 'We are working hard to bring you amazing analytics features. Check back later!')}
      </p>
      {/* Optional: Add a link back or other info here if needed */}
    </div>
  );
};

export default Analytics;