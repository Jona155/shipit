import React from 'react';
import { useTranslation } from 'react-i18next';

const TabSelector = ({ activeTab, setActiveTab, isRTL }) => {
  const { t } = useTranslation();
  const tabs = isRTL 
    ? ['finished', 'on_their_way', 'accepted'] // Reversed order for RTL
    : ['accepted', 'on_their_way', 'finished']; // Original order for LTR

  return (
    <div className={`tabs ${isRTL ? 'rtl' : 'ltr'}`}>
      {tabs.map(tab => (
        <button 
          key={tab} 
          className={`tab ${activeTab === tab ? 'active' : ''}`}
          onClick={() => setActiveTab(tab)}
        >
          {t(tab)}
        </button>
      ))}
    </div>
  );
};

export default TabSelector;