
import React from 'react';
import { useTranslation } from 'react-i18next';

const TabSelector = ({ activeTab, setActiveTab }) => {
  const { t } = useTranslation();
  const tabs = ['accepted', 'on_their_way', 'finished'];

  return (
    <div className="tabs">
      {tabs.map(tab => (
        <button 
          key={tab} 
          className={`tab ${activeTab === tab ? 'active' : ''}`}
          onClick={() => setActiveTab(tab)}
        >
          {t(`orders_${tab}`)}
        </button>
      ))}
    </div>
  );
};

export default TabSelector;