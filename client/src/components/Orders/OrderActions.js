import React from 'react';
import { useTranslation } from 'react-i18next';
import './OrderActions.css';

const OrderActions = ({
  onAddOrder,
  activeTab,
  setActiveTab,
  searchTerm,
  setSearchTerm,
  isSelectingForRoute,
  setIsSelectingForRoute,
  setSelectedOrders
}) => {
  const { t } = useTranslation();

  const handleBuildRoute = () => {
    setIsSelectingForRoute(true);
    setSelectedOrders([]);
  };

  const handleCancelBuildRoute = () => {
    setIsSelectingForRoute(false);
    setSelectedOrders([]);
  };

  return (
    <div className="order-actions">
      <div className="order-actions-row">
        <button className="order-action-button add-order-button" onClick={onAddOrder}>
          <i className="fas fa-plus"></i> {t('add_order')}
        </button>
        {!isSelectingForRoute ? (
          <button className="order-action-button build-route-button" onClick={handleBuildRoute}>
            <i className="fas fa-route"></i> {t('build_route')}
          </button>
        ) : (
          <button className="order-action-button cancel-build-route-button" onClick={handleCancelBuildRoute}>
            <i className="fas fa-times"></i> {t('cancel_build_route')}
          </button>
        )}
      </div>
      <div className="order-actions-row">
        <input
          type="text"
          className="search-input"
          placeholder={t('search_orders')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="order-actions-row">
        <div className="tabs">
          {['Accepted', 'On Their Way', 'Finished'].map((tab) => (
            <button
              key={tab}
              className={`tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {t(tab.toLowerCase().replace(' ', '_'))}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderActions;