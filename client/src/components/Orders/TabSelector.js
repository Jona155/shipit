import React from 'react';
import { useTranslation } from 'react-i18next';

const TabSelector = ({ activeTab, setActiveTab }) => {
  const { t } = useTranslation();
  const tabs = ['Accepted', 'On Their Way', 'Finished'];

  const getTranslationKey = (tab) => {
    switch (tab) {
      case 'Accepted':
        return 'orders_accepted';
      case 'On Their Way':
        return 'orders_on_their_way';
      case 'Finished':
        return 'orders_finished';
      default:
        return tab;
    }
  };

  return (
    <div className="tabs">
      {tabs.map(tab => (
        <button 
          key={tab} 
          className={`tab ${activeTab === tab ? 'active' : ''}`}
          onClick={() => setActiveTab(tab)}
        >
          {t(getTranslationKey(tab))}
        </button>
      ))}
    </div>
  );
};

export default TabSelector;