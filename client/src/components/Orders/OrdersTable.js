import React from 'react';
import { useTranslation } from 'react-i18next';
import OrderRow from './OrderRow';
import './OrdersTable.css';

const OrdersTable = ({ 
  orders, 
  activeTab, 
  setActiveTab,
  selectedOrders, 
  onSelectOrder, 
  onFinishOrder, 
  onUnassignOrder, 
  onReturnToOnTheirWay,
  onFinishRoute,
  searchTerm,
  setSearchTerm,
  onAddOrder,
  isMapView,
  isSelectingForRoute,
  onBuildRoute,
  onCancelBuildRoute
}) => {
  const { t } = useTranslation();

  const filteredOrders = orders.filter(order => 
    order.status === activeTab && 
    (order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
     order.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
     order.items.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const groupedOrders = filteredOrders.reduce((acc, order) => {
    if (order.status === 'On Their Way') {
      if (!acc[order.courier]) {
        acc[order.courier] = [];
      }
      acc[order.courier].push(order);
    } else {
      const groupName = order.status === 'Finished' ? t('orders_finished') : t('orders_unassigned');
      if (!acc[groupName]) {
        acc[groupName] = [];
      }
      acc[groupName].push(order);
    }
    return acc;
  }, {});

  return (
    <div className="orders-table-container">
      <div className="orders-table-header">
        <input
          type="text"
          className="search-input"
          placeholder={t('search_orders')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
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
        {isMapView && (
          <button 
            className={`build-route-button ${isSelectingForRoute ? 'cancel' : ''}`}
            onClick={isSelectingForRoute ? onCancelBuildRoute : onBuildRoute}
          >
            {isSelectingForRoute ? t('cancel_build_route') : t('build_route')}
          </button>
        )}
      </div>
      {Object.entries(groupedOrders).map(([group, groupOrders]) => (
        <div key={group}>
          <div className="group-header">
            <h2>{group}</h2>
            {activeTab === 'On Their Way' && group !== t('orders_unassigned') && (
              <button 
                className="finish-route-button"
                onClick={() => onFinishRoute(group)}
              >
                {t('orders_finish_route')}
              </button>
            )} 
          </div>
          <table className="orders-table">
            <thead>
              <tr>
                {activeTab === 'Accepted' && <th>{t('orders_select')}</th>}
                <th>{t('orders_id')}</th>
                <th>{t('orders_customer')}</th>
                <th>{t('orders_address')}</th>
                <th>{t('orders_items')}</th>
                <th>{t('orders_status')}</th>
                {(activeTab === 'On Their Way' || activeTab === 'Finished') && <th>{t('orders_courier')}</th>}
                <th>{t('orders_action')}</th>
              </tr>
            </thead>
            <tbody>
              {groupOrders.map(order => (
                <OrderRow 
                  key={order.id}
                  order={order}
                  activeTab={activeTab}
                  isSelected={selectedOrders.includes(order.id)}
                  onSelectOrder={onSelectOrder}
                  onFinishOrder={onFinishOrder}
                  onUnassignOrder={onUnassignOrder}
                  onReturnToOnTheirWay={onReturnToOnTheirWay}
                />
              ))}
            </tbody>
          </table>
        </div>
      ))}
      <div className="add-order-row">
        <button className="add-order-button" onClick={onAddOrder}>
          {t('add_order')}
        </button>
      </div>
    </div>
  );
};

export default OrdersTable;